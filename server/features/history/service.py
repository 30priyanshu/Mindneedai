"""
Analysis History service.

Single responsibility: cross-modality paginated history queries and
ownership-verified deletion. No HTTP coupling.

Failure modes handled:
- Record not found            → NotFoundError
- Ownership mismatch          → ForbiddenError (surfaced as NotFoundError to avoid enumeration)
"""
from __future__ import annotations

from loguru import logger
from sqlalchemy.orm import Session
from sqlalchemy import select, func, literal, delete, union_all, desc

from server.db.models.analysis import AnalysisRecord
from server.db.models.audio_analysis import AudioAnalysisSession
from server.db.models.video_analysis import VideoAnalysisSession
from server.exceptions import NotFoundError
from server.features.history.schemas import AnalysisHistoryItem, HistoryResponse
from server.utils.pagination import build_paginated_response


class HistoryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_history(
        self, user_id: str, page: int, size: int, modality: str | None = None
    ) -> HistoryResponse:
        stmts = []
        if modality == "":
            modality = None

        if modality in (None, "text"):
            stmts.append(
                select(
                    AnalysisRecord.request_id.label("request_id"),
                    AnalysisRecord.prediction_label.label("prediction_label"),
                    AnalysisRecord.confidence.label("confidence"),
                    AnalysisRecord.requires_human_review.label("requires_human_review"),
                    AnalysisRecord.created_at.label("created_at"),
                    literal("text").label("modality"),
                    AnalysisRecord.analysis_metadata.label("analysis_metadata"),
                ).where(AnalysisRecord.user_id == user_id)
            )

        if modality in (None, "speech"):
            stmts.append(
                select(
                    AudioAnalysisSession.session_id.label("request_id"),
                    func.coalesce(AudioAnalysisSession.dominant_emotion, "neutral").label("prediction_label"),
                    func.coalesce(AudioAnalysisSession.average_confidence, 0.0).label("confidence"),
                    func.coalesce(AudioAnalysisSession.requires_human_review, False).label("requires_human_review"),
                    AudioAnalysisSession.created_at.label("created_at"),
                    literal("speech").label("modality"),
                    AudioAnalysisSession.analysis_metadata.label("analysis_metadata"),
                ).where(AudioAnalysisSession.user_id == user_id)
            )

        if modality in (None, "video"):
            stmts.append(
                select(
                    VideoAnalysisSession.session_id.label("request_id"),
                    func.coalesce(VideoAnalysisSession.dominant_emotion, "neutral").label("prediction_label"),
                    func.coalesce(VideoAnalysisSession.average_confidence, 0.0).label("confidence"),
                    func.coalesce(VideoAnalysisSession.requires_human_review, False).label("requires_human_review"),
                    VideoAnalysisSession.created_at.label("created_at"),
                    literal("video").label("modality"),
                    VideoAnalysisSession.analysis_metadata.label("analysis_metadata"),
                ).where(VideoAnalysisSession.user_id == user_id)
            )

        if not stmts:
            return build_paginated_response([], 0, page, size)

        union_stmt = union_all(*stmts).subquery()

        # count
        count_stmt = select(func.count()).select_from(union_stmt)
        total = self.db.scalar(count_stmt) or 0

        # fetch
        skip = (page - 1) * size
        q = select(union_stmt).order_by(union_stmt.c.created_at.desc()).offset(skip).limit(size)
        rows = self.db.execute(q).mappings().all()

        items = [AnalysisHistoryItem.parse_row(r) for r in rows]
        return build_paginated_response(items, total, page, size)

    def delete_analysis(self, user_id: str, request_id: str) -> None:
        deleted = False
        
        # Try Text
        stmt = delete(AnalysisRecord).where(
            AnalysisRecord.request_id == request_id, 
            AnalysisRecord.user_id == user_id
        )
        if self.db.execute(stmt).rowcount > 0:
            deleted = True

        # Try Audio
        if not deleted:
            stmt = delete(AudioAnalysisSession).where(
                AudioAnalysisSession.session_id == request_id, 
                AudioAnalysisSession.user_id == user_id
            )
            if self.db.execute(stmt).rowcount > 0:
                deleted = True

        # Try Video
        if not deleted:
            stmt = delete(VideoAnalysisSession).where(
                VideoAnalysisSession.session_id == request_id, 
                VideoAnalysisSession.user_id == user_id
            )
            if self.db.execute(stmt).rowcount > 0:
                deleted = True

        self.db.commit()

        if not deleted:
            raise NotFoundError("Analysis record not found")
            
        logger.info("analysis_deleted", extra={"user_id": user_id, "request_id": request_id})

    def clear_history(self, user_id: str) -> dict[str, int]:
        d1 = self.db.execute(delete(AnalysisRecord).where(AnalysisRecord.user_id == user_id)).rowcount
        d2 = self.db.execute(delete(AudioAnalysisSession).where(AudioAnalysisSession.user_id == user_id)).rowcount
        d3 = self.db.execute(delete(VideoAnalysisSession).where(VideoAnalysisSession.user_id == user_id)).rowcount
        self.db.commit()
        deleted = d1 + d2 + d3
        logger.info("history_cleared", extra={"user_id": user_id, "deleted": deleted})
        return {"deleted": deleted}

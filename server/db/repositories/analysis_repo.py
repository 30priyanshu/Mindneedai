"""
Analysis Repository.

Single responsibility: AnalysisRecord, ReviewRecord, UserFeedback ORM access.
All callers receive typed domain objects; no raw SQLAlchemy outside this file.
"""
from __future__ import annotations

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from server.db.models.analysis import AnalysisRecord, ReviewRecord, UserFeedback
from server.db.repositories.base import BaseRepository


class AnalysisRepository(BaseRepository[AnalysisRecord]):
    def __init__(self, db: Session):
        super().__init__(AnalysisRecord, db)

    def find_by_request_id(self, request_id: str) -> AnalysisRecord | None:
        stmt = (
            select(AnalysisRecord)
            .where(AnalysisRecord.request_id == request_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_user(
        self, user_id: str, page: int = 1, size: int = 50, modality: str | None = None
    ) -> list[AnalysisRecord]:
        skip = (page - 1) * size
        stmt = select(AnalysisRecord).where(AnalysisRecord.user_id == user_id)
        if modality:
            stmt = stmt.where(AnalysisRecord.analysis_metadata["modality"].astext == modality)
        stmt = stmt.order_by(AnalysisRecord.created_at.desc()).offset(skip).limit(size)
        return list(self.db.scalars(stmt).all())

    def count_by_user(self, user_id: str, modality: str | None = None) -> int:
        stmt = select(func.count()).select_from(AnalysisRecord).where(AnalysisRecord.user_id == user_id)
        if modality:
            stmt = stmt.where(AnalysisRecord.analysis_metadata["modality"].astext == modality)
        return self.db.scalar(stmt) or 0

    def paginate_by_user(
        self, user_id: str, page: int, size: int, modality: str | None = None
    ) -> tuple[list[AnalysisRecord], int]:
        """Return (items, total) without double-counting N+1."""
        total = self.count_by_user(user_id, modality)
        items = self.list_by_user(user_id, page, size, modality)
        return items, total

    def delete_all_by_user(self, user_id: str) -> int:
        stmt = delete(AnalysisRecord).where(AnalysisRecord.user_id == user_id)
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount


class ReviewRepository(BaseRepository[ReviewRecord]):
    def __init__(self, db: Session):
        super().__init__(ReviewRecord, db)

    def find_by_request_id(self, request_id: str) -> ReviewRecord | None:
        stmt = (
            select(ReviewRecord)
            .where(ReviewRecord.request_id == request_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_status(self, status: str, page: int = 1, size: int = 50) -> list[ReviewRecord]:
        skip = (page - 1) * size
        stmt = (
            select(ReviewRecord)
            .where(ReviewRecord.status == status)
            .order_by(ReviewRecord.created_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def update_status(self, request_id: str, new_status: str) -> bool:
        stmt = (
            update(ReviewRecord)
            .where(ReviewRecord.request_id == request_id)
            .values(status=new_status)
        )
        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount > 0

    def bulk_get_by_request_ids(self, request_ids: list[str]) -> list[ReviewRecord]:
        if not request_ids:
            return []
        stmt = select(ReviewRecord).where(ReviewRecord.request_id.in_(request_ids))
        return list(self.db.scalars(stmt).all())


class FeedbackRepository(BaseRepository[UserFeedback]):
    def __init__(self, db: Session):
        super().__init__(UserFeedback, db)

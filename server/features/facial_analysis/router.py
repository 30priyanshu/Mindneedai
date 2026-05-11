"""Facial analysis HTTP layer.

All endpoints require auth; the user_id is taken from the JWT and ownership
is verified inside the service for every session-scoped operation.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from server.analysis.facial.analyzer import FacialAnalyzer
from server.analysis.facial.learner import FacialLearner
from server.analysis.facial.model_manager import FacialModelManager
from server.analysis.facial.reasoner import FacialReasoner
from server.db.repositories.notification_repo import NotificationRepository
from server.db.repositories.video_repo import (
    VideoAnalysisReviewRepository, VideoFrameRepository, VideoSessionRepository,
)
from server.db.session import get_db
from server.exceptions import NotFoundError
from server.features.auth.dependencies import get_current_user
from server.features.auth.ownership import require_owner
from server.features.facial_analysis.schemas import (
    EndSessionRequest, FrameAnalysisRequest, SessionResponse, StartSessionRequest,
)
from server.features.facial_analysis.service import FacialAnalysisService
from server.features.notifications.service import NotificationService
from server.infra.runtime.deps import get_facial_analyzer, get_registry
from server.infra.runtime.rate_limit import rate_limit
from server.infra.runtime.registry import AnalyzerRegistry
from server.security.audit import AuditLogger

router = APIRouter(prefix="/video-analysis", tags=["video-analysis"])

_audit_logger = AuditLogger()
_model_manager = FacialModelManager()
_learner = FacialLearner()
_reasoner: FacialReasoner | None = None


def _get_reasoner() -> FacialReasoner:
    global _reasoner
    if _reasoner is None:
        _reasoner = FacialReasoner()
    return _reasoner


def get_facial_service(
    db: Session = Depends(get_db),
    analyzer: FacialAnalyzer = Depends(get_facial_analyzer),
    registry: AnalyzerRegistry = Depends(get_registry),
) -> FacialAnalysisService:
    return FacialAnalysisService(
        registry=registry,
        analyzer=analyzer,
        reasoner=_get_reasoner(),
        video_session_repo=VideoSessionRepository(db),
        video_frame_repo=VideoFrameRepository(db),
        review_repo=VideoAnalysisReviewRepository(db),
        notification_svc=NotificationService(repo=NotificationRepository(db)),
        audit_logger=_audit_logger,
    )


@router.post("/start-session", response_model=SessionResponse)
async def start_session(
    request: StartSessionRequest,
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    service: FacialAnalysisService = Depends(get_facial_service),
):
    return await service.start_session(current_user["user_id"], bg_tasks)


@router.post(
    "/analyze-frame",
    dependencies=[Depends(rate_limit("frame"))],
)
async def analyze_frame(
    request: FrameAnalysisRequest,
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    service: FacialAnalysisService = Depends(get_facial_service),
):
    return await service.analyze_frame(request, current_user["user_id"], bg_tasks)


@router.post("/end-session")
async def end_session(
    request: EndSessionRequest,
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    service: FacialAnalysisService = Depends(get_facial_service),
):
    try:
        return await service.end_session(request, current_user["user_id"], bg_tasks)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = VideoSessionRepository(db)
    record = repo.find_by_session_id(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")
    require_owner(record.user_id, current_user["user_id"])
    meta = record.analysis_metadata or {}
    return {
        "session_id": record.session_id,
        "user_id": record.user_id,
        "status": getattr(record, "status", "completed"),
        "start_time": record.start_time.isoformat() if record.start_time else None,
        "end_time": record.end_time.isoformat() if record.end_time else None,
        "dominant_emotion": getattr(record, "dominant_emotion", None),
        "average_confidence": getattr(record, "average_confidence", None),
        "total_frames": getattr(record, "total_frames", 0),
        "valid_frames": meta.get("valid_frames", 0),
        "emotion_distribution": meta.get("distribution", {}),
        "requires_human_review": getattr(record, "requires_human_review", False),
        "review_request_id": getattr(record, "review_request_id", None),
    }


@router.get("/sessions")
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    repo = VideoSessionRepository(db)
    items = repo.list_by_user(current_user["user_id"], limit=min(limit, 100), offset=max(offset, 0))
    return {
        "sessions": [
            {
                "session_id": s.session_id, "user_id": s.user_id,
                "start_time": s.start_time.isoformat() if s.start_time else None,
                "end_time": s.end_time.isoformat() if s.end_time else None,
                "total_frames": s.total_frames, "dominant_emotion": s.dominant_emotion,
                "average_confidence": s.average_confidence,
                "requires_review": s.requires_human_review, "status": s.status,
            }
            for s in items
        ],
        "total": len(items), "limit": limit, "offset": offset,
    }


@router.get("/performance")
async def get_performance(
    current_user: dict = Depends(get_current_user),
    analyzer: FacialAnalyzer = Depends(get_facial_analyzer),
    registry: AnalyzerRegistry = Depends(get_registry),
):
    return {
        "model_registry": {
            "active_version": _model_manager.get_active_version(),
            "total_versions": len(_model_manager.versions),
        },
        "analyzer": {
            "model_loaded": analyzer.is_loaded,
            "device": str(analyzer.device),
            "active_video_sessions": registry.video_session_count(),
        },
        "learning_metrics": {"pending_feedback": len(_learner._feedback_buffer)},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/weekly-training")
async def trigger_weekly_training(
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    training_id = f"weekly_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    bg_tasks.add_task(_learner.trigger_cycle)
    return {
        "status": "started", "training_id": training_id,
        "message": "Weekly training initiated in background",
        "training_date": datetime.now(timezone.utc).isoformat(),
    }

"""Text analysis HTTP layer.

All write/analyze endpoints require an authenticated user; the user_id is
sourced from the JWT (never from the request body) and ownership is enforced
on every read of analysis records.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends
from loguru import logger
from sqlalchemy.orm import Session

from server.analysis.text.analyzer import TextAnalyzer
from server.analysis.text.learner import TextLearner
from server.analysis.text.model_manager import TextModelManager
from server.analysis.text.reasoner import TextReasoner
from server.db.repositories.analysis_repo import (
    AnalysisRepository, FeedbackRepository, ReviewRepository,
)
from server.db.repositories.notification_repo import NotificationRepository
from server.db.session import get_db
from server.exceptions import ForbiddenError, NotFoundError
from server.features.auth.dependencies import get_current_user
from server.features.auth.ownership import require_owner
from server.features.notifications.service import NotificationService
from server.features.text_analysis.schemas import (
    AnalysisResponse, FeedbackRequest, TextAnalysisRequest,
)
from server.features.text_analysis.service import TextAnalysisService
from server.infra.runtime.deps import get_text_analyzer
from server.infra.runtime.rate_limit import rate_limit
from server.security.audit import AuditLogger
from server.security.privacy import PrivacyManager

router = APIRouter(prefix="/text-analysis", tags=["text-analysis"])

_audit_logger = AuditLogger()
_privacy_manager = PrivacyManager()
_model_manager = TextModelManager()
_learner = TextLearner()
_reasoner: TextReasoner | None = None


def get_text_reasoner() -> TextReasoner:
    global _reasoner
    if _reasoner is None:
        _reasoner = TextReasoner()
    return _reasoner


def get_text_service(
    db: Session = Depends(get_db),
    analyzer: TextAnalyzer = Depends(get_text_analyzer),
    reasoner: TextReasoner = Depends(get_text_reasoner),
) -> TextAnalysisService:
    return TextAnalysisService(
        analyzer=analyzer,
        reasoner=reasoner,
        analysis_repo=AnalysisRepository(db),
        notification_svc=NotificationService(repo=NotificationRepository(db)),
        audit_logger=_audit_logger,
        privacy_manager=_privacy_manager,
    )


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    dependencies=[Depends(rate_limit("text"))],
)
async def analyze_text(
    request: TextAnalysisRequest,
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    service: TextAnalysisService = Depends(get_text_service),
) -> AnalysisResponse:
    return await service.analyze(request, current_user["user_id"], bg_tasks)


@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(request.user_id, current_user["user_id"])
    feedback_repo = FeedbackRepository(db)
    feedback_id = f"fb_{request.original_request_id}"
    feedback_repo.create({
        "feedback_id": feedback_id,
        "user_id": current_user["user_id"],
        "original_request_id": request.original_request_id,
        "feedback_type": "text",
        "feedback_text": str(request.feedback),
    })
    _learner.collect_feedback(request.original_request_id, {
        "user_id": current_user["user_id"],
        "human_correction": request.feedback.get("correct_label"),
        "feedback_data": request.feedback,
    })
    return {"status": "success", "feedback_id": feedback_id}


@router.get("/review/{review_request_id}")
async def get_review_status(
    review_request_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = ReviewRepository(db)
    record = repo.find_by_request_id(review_request_id)
    if not record:
        return {"review_request_id": review_request_id, "status": "pending_human_assessment"}
    require_owner(getattr(record, "user_id", None), current_user["user_id"])
    return {
        "review_request_id": review_request_id,
        "status": record.status,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


@router.get("/models")
async def list_models(current_user: dict = Depends(get_current_user)):
    active = _model_manager.get_active_version()
    versions = [
        {
            "version_id": vid, "is_active": v.get("is_active", False),
            "fine_tuned": v.get("fine_tuned", False), "created_at": v.get("created_at"),
            "model_path": v.get("model_path"),
        }
        for vid, v in _model_manager.versions.items()
    ]
    return {"active_version": active, "total_versions": len(versions), "versions": versions}


@router.get("/learning")
async def get_learning_status(current_user: dict = Depends(get_current_user)):
    return {
        "status": "idle" if not _learner._feedback_buffer else "data_available",
        "pending_samples": len(_learner._feedback_buffer),
        "last_trigger": None,
    }


@router.post("/learning/trigger")
async def trigger_learning(
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    pending = len(_learner._feedback_buffer)
    bg_tasks.add_task(_learner.trigger_cycle)
    return {"status": "learning_triggered", "samples_queued": pending}


@router.get("/consent/{user_id}")
async def get_consent_status(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_owner(user_id, current_user["user_id"])
    repo = AnalysisRepository(db)
    records = repo.list_by_user(user_id, page=1, size=1)
    has_consent = any(getattr(r, "consent_token", None) for r in records)
    return {
        "user_id": user_id,
        "consent_given": has_consent,
        "training_eligible": has_consent,
        "data_retention_days": 30,
    }


@router.get("/hardware/status")
async def get_hardware_status(
    current_user: dict = Depends(get_current_user),
    analyzer: TextAnalyzer = Depends(get_text_analyzer),
):
    import torch
    return {
        "gpu_available": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "model_loaded": analyzer.is_loaded,
    }

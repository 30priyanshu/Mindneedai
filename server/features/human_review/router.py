"""
Human Review router — INTERNAL ONLY.

All routes require admin/internal role. Never mounted under public user prefix.
Thin HTTP adapter: dependency wiring, auth guard, routing.
All business logic lives in HumanReviewService.

Routes:
  GET    /internal/review/queue
  GET    /internal/review/queue/status
  POST   /internal/review/enqueue
  POST   /internal/review/{review_id}/complete
  POST   /internal/review/{review_id}/escalate
  GET    /internal/review/reviewers
  POST   /internal/review/reviewers
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.analysis_repo import ReviewRepository
from server.features.auth.dependencies import get_current_doctor
from server.features.human_review.schemas import (
    CompleteReviewRequest,
    QueueStatusResponse,
    ReviewQueueItem,
    ReviewRequest,
    ReviewerProfile,
)
from server.features.human_review.service import HumanReviewService

human_review_router = APIRouter(
    prefix="/internal/review", tags=["internal", "human-review"]
)

# Singleton service — shared across requests in the same process.
# In multi-process deployments, replace with a Redis-backed queue.
_service_singleton: HumanReviewService | None = None


def _get_service(db: Session = Depends(get_db)) -> HumanReviewService:
    global _service_singleton
    if _service_singleton is None:
        _service_singleton = HumanReviewService(review_repo=ReviewRepository(db))
    return _service_singleton


def _require_admin(principal: dict = Depends(get_current_doctor)) -> dict:
    """
    Internal-only guard: only doctors with role='doctor' may access review endpoints.
    In a future iteration this would check an `is_admin` flag or a dedicated admin role.
    """
    if principal.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Internal review endpoints require doctor/admin access",
        )
    return principal


@human_review_router.get("/queue", response_model=list[ReviewQueueItem])
def get_queue(
    reviewer_id: Optional[str] = Query(None, description="Filter by assigned reviewer"),
    _principal: dict = Depends(_require_admin),
    service: HumanReviewService = Depends(_get_service),
) -> list[ReviewQueueItem]:
    """List pending review queue items, optionally filtered by assigned reviewer."""
    return service.get_queue(reviewer_id=reviewer_id)


@human_review_router.get("/queue/status", response_model=QueueStatusResponse)
def get_queue_status(
    _principal: dict = Depends(_require_admin),
    service: HumanReviewService = Depends(_get_service),
) -> QueueStatusResponse:
    """Aggregate priority/status breakdown of the current review queue."""
    return service.get_queue_status()


@human_review_router.post(
    "/enqueue", response_model=dict, status_code=status.HTTP_201_CREATED
)
def enqueue_review(
    payload: ReviewRequest,
    _principal: dict = Depends(_require_admin),
    service: HumanReviewService = Depends(_get_service),
) -> dict[str, str]:
    """Submit an analysis record for human review. Idempotent by request_id."""
    review_id = service.enqueue(payload)
    return {"review_id": review_id}


@human_review_router.post(
    "/{review_id}/complete", status_code=status.HTTP_200_OK
)
def complete_review(
    review_id: str,
    payload: CompleteReviewRequest,
    principal: dict = Depends(_require_admin),
    service: HumanReviewService = Depends(_get_service),
) -> dict[str, str]:
    """Mark a review as completed. Caller must be the assigned reviewer."""
    reviewer_id = principal["doctor_id"]
    service.complete_review(review_id, reviewer_id, payload)
    return {"status": "completed", "review_id": review_id}


@human_review_router.post(
    "/{review_id}/escalate", status_code=status.HTTP_200_OK
)
def escalate_review(
    review_id: str,
    reason: str = Query(..., min_length=1),
    _principal: dict = Depends(_require_admin),
    service: HumanReviewService = Depends(_get_service),
) -> dict[str, str]:
    """Escalate a review to URGENT priority with a stated reason."""
    service.escalate(review_id, reason)
    return {"status": "escalated", "review_id": review_id}


@human_review_router.get("/reviewers", response_model=list[ReviewerProfile])
def list_reviewers(
    _principal: dict = Depends(_require_admin),
    service: HumanReviewService = Depends(_get_service),
) -> list[ReviewerProfile]:
    """List all registered reviewers and their current load."""
    return service.list_reviewers()


@human_review_router.post(
    "/reviewers", response_model=dict, status_code=status.HTTP_201_CREATED
)
def register_reviewer(
    profile: ReviewerProfile,
    _principal: dict = Depends(_require_admin),
    service: HumanReviewService = Depends(_get_service),
) -> dict[str, str]:
    """Register a new reviewer in the system."""
    service.register_reviewer(profile)
    return {"reviewer_id": profile.reviewer_id, "status": "registered"}

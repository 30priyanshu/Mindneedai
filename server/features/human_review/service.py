"""
Human Review service.

Single responsibility: in-memory priority queue, reviewer registration,
load-balanced assignment, review completion, escalation, and DB persistence
via ReviewRepository.

This is an INTERNAL-ONLY service — no public routes, never mounted
under a user-facing prefix.

Design notes:
- In-memory queue is per-process; suitable for single-instance deployment.
  Multi-process upgrade path: replace _queue dict with a Redis-backed store.
- Reviewer state is in-memory; registration is done at startup or via internal API.
- DB persistence is best-effort: a write failure logs but does not block the
  in-memory state update.

Failure modes handled:
- review_id not in queue          → NotFoundError
- reviewer not assigned to item   → ForbiddenError
- DB write fails                  → logged, state still updated in-memory
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from loguru import logger

from server.db.repositories.analysis_repo import ReviewRepository
from server.exceptions import ForbiddenError, NotFoundError
from server.features.human_review.schemas import (
    CompleteReviewRequest,
    QueueStatusResponse,
    ReviewPriority,
    ReviewQueueItem,
    ReviewRequest,
    ReviewerProfile,
    ReviewStatus,
)


class HumanReviewService:
    """
    In-memory review queue with DB-backed persistence.
    One shared instance injected at router level.
    """

    def __init__(self, review_repo: ReviewRepository) -> None:
        self._repo = review_repo
        self._queue: dict[str, dict] = {}         # review_id → queue entry
        self._reviewers: dict[str, ReviewerProfile] = {}

    # ── Reviewer management ───────────────────────────────────────────────────

    def register_reviewer(self, profile: ReviewerProfile) -> None:
        self._reviewers[profile.reviewer_id] = profile
        logger.info("reviewer_registered", extra={"reviewer_id": profile.reviewer_id})

    def list_reviewers(self) -> list[ReviewerProfile]:
        return list(self._reviewers.values())

    # ── Queue operations ──────────────────────────────────────────────────────

    def enqueue(self, request: ReviewRequest) -> str:
        """
        Submit an analysis record for review.  Returns the review_id.
        Idempotent: if request_id already queued, returns existing review_id.
        """
        existing = next(
            (rid for rid, e in self._queue.items() if e["request_id"] == request.request_id),
            None,
        )
        if existing:
            return existing

        review_id = f"rev_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{request.user_id[:8]}"
        priority = self._auto_priority(request)
        assigned = self._assign_reviewer(priority)

        entry = {
            "review_id": review_id,
            "request_id": request.request_id,
            "user_id": request.user_id,
            "original_prediction": request.original_prediction,
            "priority": priority,
            "status": ReviewStatus.IN_PROGRESS if assigned else ReviewStatus.PENDING,
            "assigned_reviewer": assigned,
            "ai_summary": request.ai_summary,
            "created_at": datetime.utcnow().isoformat(),
        }
        self._queue[review_id] = entry

        self._persist_create(entry, request)
        logger.info(
            "review_enqueued",
            extra={
                "review_id": review_id,
                "priority": priority,
                "assigned": assigned,
            },
        )
        return review_id

    def complete_review(
        self, review_id: str, reviewer_id: str, payload: CompleteReviewRequest
    ) -> None:
        entry = self._queue.get(review_id)
        if not entry:
            raise NotFoundError(f"Review {review_id} not found in queue")
        if entry.get("assigned_reviewer") != reviewer_id:
            raise ForbiddenError("Review not assigned to this reviewer")

        entry["status"] = ReviewStatus.COMPLETED
        entry["human_assessment"] = payload.human_assessment
        entry["confidence_override"] = payload.confidence_override
        entry["review_notes"] = payload.review_notes
        entry["completed_at"] = datetime.utcnow().isoformat()

        self._free_reviewer_slot(reviewer_id)
        self._persist_complete(review_id, payload)
        del self._queue[review_id]

        logger.info("review_completed", extra={"review_id": review_id, "reviewer_id": reviewer_id})

    def escalate(self, review_id: str, reason: str) -> None:
        entry = self._queue.get(review_id)
        if not entry:
            raise NotFoundError(f"Review {review_id} not found")
        entry["status"] = ReviewStatus.ESCALATED
        entry["priority"] = ReviewPriority.URGENT
        entry["escalation_reason"] = reason
        logger.warning("review_escalated", extra={"review_id": review_id, "reason": reason})

    # ── Queue reads ───────────────────────────────────────────────────────────

    def get_queue(
        self, reviewer_id: Optional[str] = None
    ) -> list[ReviewQueueItem]:
        entries = (
            [e for e in self._queue.values() if e.get("assigned_reviewer") == reviewer_id]
            if reviewer_id
            else list(self._queue.values())
        )
        return [ReviewQueueItem(**e) for e in entries]

    def get_queue_status(self) -> QueueStatusResponse:
        by_priority: dict[str, int] = {}
        by_status: dict[str, int] = {}
        wait_minutes: list[float] = []

        for entry in self._queue.values():
            pri = entry["priority"].value if hasattr(entry["priority"], "value") else entry["priority"]
            sta = entry["status"].value if hasattr(entry["status"], "value") else entry["status"]
            by_priority[pri] = by_priority.get(pri, 0) + 1
            by_status[sta] = by_status.get(sta, 0) + 1

            created = datetime.fromisoformat(entry["created_at"])
            wait_minutes.append((datetime.utcnow() - created).total_seconds() / 60)

        avg_wait = sum(wait_minutes) / len(wait_minutes) if wait_minutes else 0.0
        available = sum(
            1
            for r in self._reviewers.values()
            if r.is_available and r.current_reviews < r.max_concurrent_reviews
        )

        return QueueStatusResponse(
            total_pending=len(self._queue),
            by_priority=by_priority,
            by_status=by_status,
            average_wait_minutes=round(avg_wait, 1),
            reviewers_available=available,
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _auto_priority(req: ReviewRequest) -> ReviewPriority:
        """Derive priority from confidence when caller doesn't specify URGENT."""
        if req.priority == ReviewPriority.URGENT:
            return ReviewPriority.URGENT
        if req.confidence < 0.3:
            return ReviewPriority.HIGH
        return req.priority

    def _assign_reviewer(self, priority: ReviewPriority) -> Optional[str]:
        candidates = [
            r for r in self._reviewers.values()
            if r.is_available and r.current_reviews < r.max_concurrent_reviews
        ]
        if not candidates:
            return None

        if priority in (ReviewPriority.URGENT, ReviewPriority.HIGH):
            candidates.sort(key=lambda r: (-r.performance_rating, r.current_reviews))
        else:
            candidates.sort(key=lambda r: r.current_reviews)

        chosen = candidates[0]
        chosen.current_reviews += 1
        return chosen.reviewer_id

    def _free_reviewer_slot(self, reviewer_id: str) -> None:
        reviewer = self._reviewers.get(reviewer_id)
        if reviewer:
            reviewer.current_reviews = max(0, reviewer.current_reviews - 1)

    def _persist_create(self, entry: dict, request: ReviewRequest) -> None:
        try:
            self._repo.create(
                {
                    "review_id": entry["review_id"],
                    "request_id": request.request_id,
                    "user_id": request.user_id,
                    "reviewer_id": entry.get("assigned_reviewer") or "unassigned",
                    "original_prediction": request.original_prediction,
                    "human_assessment": "pending",
                    "ai_summary": request.ai_summary,
                    "status": entry["status"].value
                    if hasattr(entry["status"], "value")
                    else entry["status"],
                }
            )
        except Exception:
            logger.exception("review_db_create_failed", extra={"review_id": entry["review_id"]})

    def _persist_complete(self, review_id: str, payload: CompleteReviewRequest) -> None:
        try:
            record = self._repo.find_by_request_id(review_id)
            if record:
                self._repo.update(
                    record.id,
                    {
                        "human_assessment": payload.human_assessment,
                        "confidence_override": payload.confidence_override,
                        "review_notes": payload.review_notes,
                        "status": "completed",
                        "completed_at": datetime.utcnow(),
                    },
                )
        except Exception:
            logger.exception("review_db_complete_failed", extra={"review_id": review_id})

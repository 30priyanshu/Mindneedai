"""
Human Review schemas.

Single responsibility: typed Pydantic shapes for the review queue, reviewer
profiles, and queue item responses. Internal-only — not part of the public API.
"""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ReviewPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ReviewStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ESCALATED = "escalated"


class ReviewRequest(BaseModel):
    """Payload to submit an analysis record for human review."""

    request_id: str = Field(..., description="AnalysisRecord.request_id to review")
    user_id: str
    original_prediction: str
    confidence: float
    ai_summary: Optional[str] = None
    priority: ReviewPriority = ReviewPriority.MEDIUM


class CompleteReviewRequest(BaseModel):
    """Payload submitted by a reviewer to close a review."""

    human_assessment: str
    confidence_override: Optional[float] = Field(None, ge=0.0, le=1.0)
    review_notes: Optional[str] = None


class ReviewerProfile(BaseModel):
    """Read-model for a registered reviewer."""

    reviewer_id: str
    name: str
    role: str
    specialization: list[str]
    max_concurrent_reviews: int = 5
    current_reviews: int = 0
    performance_rating: float = 5.0
    is_available: bool = True


class ReviewQueueItem(BaseModel):
    """Single item in the pending review queue."""

    review_id: str
    request_id: str
    user_id: str
    original_prediction: str
    priority: ReviewPriority
    status: ReviewStatus
    assigned_reviewer: Optional[str] = None
    ai_summary: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class QueueStatusResponse(BaseModel):
    """Aggregate status of the whole review queue."""

    total_pending: int
    by_priority: dict[str, int]
    by_status: dict[str, int]
    average_wait_minutes: float
    reviewers_available: int

"""
Assessments schemas.

Single responsibility: Pydantic input/output contracts for assessment endpoints.
No business logic or DB access here.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class _AssessmentSubmissionBase(BaseModel):
    responses: dict[str, int] = Field(..., description="question_id → score (0–3)")
    assessment_request_id: str = Field(..., description="Request ID issued by the doctor")

    @field_validator("responses")
    @classmethod
    def validate_responses(cls, v: dict[str, int]) -> dict[str, int]:
        if not v:
            raise ValueError("responses cannot be empty")
        for q_id, score in v.items():
            if not isinstance(score, int) or score < 0 or score > 3:
                raise ValueError(f"Score for {q_id} must be an integer 0–3, got {score!r}")
        return v


class PHQ9Submission(_AssessmentSubmissionBase):
    """Patient submission for the PHQ-9 depression questionnaire."""


class GAD7Submission(_AssessmentSubmissionBase):
    """Patient submission for the GAD-7 anxiety questionnaire."""


class AssessmentResponse(BaseModel):
    assessment_id: str
    user_id: str
    assessment_type: str
    score: int
    severity_level: str
    severity_label: str
    treatment_recommendations: dict[str, Any]
    responses: dict[str, int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AssessmentSubmissionResponse(BaseModel):
    """Simplified confirmation returned to the patient — no clinical results."""
    assessment_id: str
    message: str
    created_at: datetime


class AssessmentRequestCreate(BaseModel):
    """Doctor-facing payload to create assessment request(s) for a patient."""
    assessment_types: list[str] = Field(
        ..., description="One or both of: ['PHQ9', 'GAD7']"
    )
    expires_in_days: Optional[int] = Field(30, ge=1, le=365)
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("assessment_types")
    @classmethod
    def validate_types(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one assessment type is required")
        if len(v) > 2:
            raise ValueError("Maximum 2 assessment types allowed")
        validated: list[str] = []
        for t in v:
            upper = t.upper()
            if upper not in ("PHQ9", "GAD7"):
                raise ValueError(f"Invalid type {t!r}; must be 'PHQ9' or 'GAD7'")
            if upper in validated:
                raise ValueError(f"Duplicate assessment type: {t!r}")
            validated.append(upper)
        return validated


class AssessmentResultSummary(BaseModel):
    """Embedded result summary surfaced on assessment requests for doctor view."""
    score: int
    severity_level: str
    severity_label: str


class AssessmentRequestResponse(BaseModel):
    request_id: str
    doctor_id: str
    patient_id: str
    patient_email: Optional[str] = None
    assessment_type: str
    status: str
    notes: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    completed_at: Optional[datetime]
    result: Optional[AssessmentResultSummary] = None

    model_config = {"from_attributes": True}

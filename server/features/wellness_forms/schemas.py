"""
Wellness Forms schemas.

Single responsibility: Pydantic input/output contracts for wellness-form endpoints.
No business logic or DB access here.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class WellnessFormCreate(BaseModel):
    user_id: str = Field(..., description="Patient user ID")
    client_name: str = Field(..., min_length=1, max_length=255)
    form_date: str = Field(..., description="ISO date string YYYY-MM-DD")
    form_data: dict[str, Any] = Field(..., description="MSE section payloads")
    status: Optional[str] = Field("submitted", description="'draft' or 'submitted'")

    @field_validator("form_date")
    @classmethod
    def validate_form_date(cls, v: str) -> str:
        try:
            parsed = datetime.fromisoformat(v).date()
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD")
        if parsed > date.today():
            raise ValueError("Form date cannot be in the future")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v not in (None, "draft", "submitted"):
            raise ValueError("Status must be 'draft' or 'submitted'")
        return v


class WellnessFormUpdate(BaseModel):
    client_name: Optional[str] = Field(None, min_length=1, max_length=255)
    form_date: Optional[str] = None
    form_data: Optional[dict[str, Any]] = None
    status: Optional[str] = None

    @field_validator("form_date")
    @classmethod
    def validate_form_date(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            parsed = datetime.fromisoformat(v).date()
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD")
        if parsed > date.today():
            raise ValueError("Form date cannot be in the future")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("draft", "submitted", "reviewed"):
            raise ValueError("Status must be 'draft', 'submitted', or 'reviewed'")
        return v


class SendAIReportRequest(BaseModel):
    edited_patient_summary: Optional[str] = None


class AIInsightsResponse(BaseModel):
    form_id: str
    ai_generation_status: str
    clinical_summary: Optional[str] = None
    patient_summary: Optional[str] = None
    patterns_detected: Optional[dict[str, Any]] = None
    generated_at: Optional[str] = None
    model_version: Optional[str] = None
    error_message: Optional[str] = None
    client_name: Optional[str] = None
    form_date: Optional[str] = None
    ai_report_status: Optional[str] = None
    ai_report_sent_at: Optional[str] = None


class WellnessFormResponse(BaseModel):
    form_id: str
    user_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    doctor_email: Optional[str] = None
    doctor_specialty: Optional[str] = None
    client_name: str
    form_date: str
    form_data: dict[str, Any]
    status: str
    ai_generation_status: str
    ai_summary_clinical: Optional[str] = None
    ai_summary_patient: Optional[str] = None
    ai_patterns_detected: Optional[dict[str, Any]] = None
    ai_generated_at: Optional[str] = None
    ai_model_version: Optional[str] = None
    ai_report_status: str
    ai_report_sent_at: Optional[str] = None
    ai_error_message: Optional[str] = None
    submitted_at: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}

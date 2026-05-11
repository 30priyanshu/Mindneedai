"""
Dashboard schemas.

Single responsibility: Pydantic response shapes for user and doctor dashboards.
No business logic — pure data contracts.
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class UserDashboardStats(BaseModel):
    """Aggregated statistics for the patient-facing dashboard."""

    total_analyses: int = Field(..., description="All-time analysis count across modalities")
    this_week_count: int = Field(..., description="Analyses in the last 7 calendar days")
    streak_days: int = Field(..., description="Consecutive days with at least one analysis")
    weekly_avg_mood: Optional[float] = Field(
        None, description="Mean mood score over the last 7 days; null when no entries"
    )


class RecentAnalysis(BaseModel):
    """Lightweight summary of a single analysis record for the dashboard feed."""

    id: str
    type: str = Field(..., description="'text' | 'audio' | 'video'")
    emotion: str
    confidence: float
    timestamp: Optional[str] = None


class DoctorDashboardStats(BaseModel):
    """Aggregated statistics for the doctor-facing dashboard."""

    total_patients: int = Field(..., description="All-time active connected patients")
    recent_patients_count: int = Field(
        ..., description="Patients connected in the last 30 days"
    )
    total_forms: int = Field(..., description="All wellness forms created by this doctor")
    recent_forms_count: int = Field(
        ..., description="Wellness forms created in the last 7 days"
    )

class RecentFormSummary(BaseModel):
    id: str
    client_name: str
    form_date: Optional[str] = None
    status: str
    ai_status: str

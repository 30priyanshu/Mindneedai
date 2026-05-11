"""
Health Metrics schemas.

Single responsibility: Pydantic input/output contracts for health-metrics endpoints.
No business logic or DB access here.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, model_validator


class HealthMetricsEntryRequest(BaseModel):
    oxygen_level: Optional[float] = Field(None)
    systolic_bp: Optional[int] = Field(None)
    diastolic_bp: Optional[int] = Field(None)
    pulse_rate: Optional[int] = Field(None)
    note: Optional[str] = Field(None, max_length=1000)

    @model_validator(mode="after")
    def at_least_one_metric(self) -> "HealthMetricsEntryRequest":
        fields = ("oxygen_level", "systolic_bp", "diastolic_bp", "pulse_rate")
        if all(getattr(self, f) is None for f in fields):
            raise ValueError("At least one metric is required")
        return self


class HealthMetricsEntryResponse(BaseModel):
    entry_id: str
    user_id: str
    timestamp: datetime
    date: date
    metrics: dict[str, Any]
    ai_analysis: Optional[dict[str, Any]]
    risk_level: Optional[str]
    warnings: list[str] = Field(default_factory=list)
    note: Optional[str]

    model_config = {"from_attributes": True}

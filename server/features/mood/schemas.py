"""
Mood Tracker schemas.

Single responsibility: Pydantic input/output contracts for mood endpoints.
No business logic or DB access here.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class MoodEntryPayload(BaseModel):
    date: str = Field(..., description="Entry date in YYYY-MM-DD format")
    score: int = Field(..., ge=1, le=10, description="Mood score 1–10")
    note: Optional[str] = Field(None, max_length=1000)

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            d = date.fromisoformat(v)
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        if d > date.today():
            raise ValueError("Date cannot be in the future")
        return v

    @field_validator("note")
    @classmethod
    def strip_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        stripped = v.strip()
        return stripped or None


class MoodEntryResponse(BaseModel):
    entry_id: str
    user_id: str
    date: str
    score: int
    note: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WeeklyMoodData(BaseModel):
    week_start: str
    week_end: str
    entries: list[Optional[MoodEntryResponse]]

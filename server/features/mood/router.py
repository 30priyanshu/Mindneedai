"""
Mood Tracker router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in MoodService.
"""
from __future__ import annotations

from datetime import date
from typing import Optional
from datetime import date
from fastapi import HTTPException

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.mood_repo import MoodRepository
from server.features.auth.dependencies import get_current_user
from server.features.mood.schemas import MoodEntryPayload, MoodEntryResponse, WeeklyMoodData
from server.features.mood.service import MoodService

mood_router = APIRouter(prefix="/mood", tags=["mood"])


def _get_service(db: Session = Depends(get_db)) -> MoodService:
    return MoodService(repo=MoodRepository(db))


@mood_router.post("", response_model=MoodEntryResponse, status_code=201)
def upsert_mood_entry(
    payload: MoodEntryPayload,
    current_user: dict = Depends(get_current_user),
    service: MoodService = Depends(_get_service),
) -> MoodEntryResponse:
    """Create or update today's mood entry (one per user per day)."""
    return service.upsert_entry(current_user["user_id"], payload)


@mood_router.get("", response_model=list[MoodEntryResponse])
def list_mood_entries(
    start: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user),
    service: MoodService = Depends(_get_service),
) -> list[MoodEntryResponse]:
    """List mood entries in a date range (defaults to current week)."""
    return service.list_entries(current_user["user_id"], start, end)


@mood_router.get("/weekly", response_model=WeeklyMoodData)
def get_weekly_mood(
    week_offset: int = Query(0, ge=-52, le=0, description="0=current week, -1=previous, etc."),
    current_user: dict = Depends(get_current_user),
    service: MoodService = Depends(_get_service),
) -> WeeklyMoodData:
    """Return a 7-day mood grid for a given week offset."""
    return service.get_weekly(current_user["user_id"], week_offset)


@mood_router.get("/entry/{date_str}", response_model=MoodEntryResponse)
def get_mood_entry_by_date(
    date_str: str,
    current_user: dict = Depends(get_current_user),
    service: MoodService = Depends(_get_service),
) -> MoodEntryResponse:
    """Return a mood entry by date."""
    try:
        parsed_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    entries = service.list_entries(current_user["user_id"], parsed_date, parsed_date)
    if not entries:
        raise HTTPException(status_code=404, detail="Mood entry not found")
    return entries[0]


@mood_router.delete("/entry/{date_str}", status_code=204)
def delete_mood_entry(
    date_str: str,
    current_user: dict = Depends(get_current_user),
    service: MoodService = Depends(_get_service),
) -> None:
    """Delete a mood entry by date."""
    try:
        parsed_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    entries = service.list_entries(current_user["user_id"], parsed_date, parsed_date)
    if not entries:
        raise HTTPException(status_code=404, detail="Mood entry not found")
    service.delete_entry(current_user["user_id"], entries[0].entry_id)

"""
Mood Tracker service.

Single responsibility: mood entry CRUD + weekly aggregation business logic.
Depends on MoodRepository; no HTTP coupling.
"""
from __future__ import annotations

import uuid
from datetime import date, timedelta

from loguru import logger
from sqlalchemy.orm import Session

from server.db.models.mood import MoodEntry
from server.db.repositories.mood_repo import MoodRepository
from server.exceptions import NotFoundError, ValidationError
from server.features.mood.schemas import MoodEntryPayload, MoodEntryResponse, WeeklyMoodData


def _to_response(entry: MoodEntry) -> MoodEntryResponse:
    return MoodEntryResponse(
        entry_id=entry.entry_id,
        user_id=entry.user_id,
        date=entry.date.isoformat(),
        score=entry.score,
        note=entry.note,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


def _week_bounds(offset: int = 0) -> tuple[date, date]:
    today = date.today()
    monday = today - timedelta(days=today.weekday()) + timedelta(weeks=offset)
    return monday, monday + timedelta(days=6)


class MoodService:
    def __init__(self, repo: MoodRepository) -> None:
        self._repo = repo

    def upsert_entry(self, user_id: str, payload: MoodEntryPayload) -> MoodEntryResponse:
        entry_date = date.fromisoformat(payload.date)
        if entry_date > date.today():
            raise ValidationError("Date cannot be in the future")

        existing = self._repo.find_by_user_date(user_id, entry_date)
        if existing:
            updated = self._repo.update(
                existing.id,
                {"score": payload.score, "note": payload.note},
            )
            logger.info("mood_entry_updated", extra={"user_id": user_id, "date": payload.date})
            return _to_response(updated)

        entry = self._repo.create({
            "entry_id": f"mood_{uuid.uuid4().hex[:16]}",
            "user_id": user_id,
            "date": entry_date,
            "score": payload.score,
            "note": payload.note,
        })
        logger.info("mood_entry_created", extra={"user_id": user_id, "date": payload.date})
        return _to_response(entry)

    def list_entries(
        self,
        user_id: str,
        start: date | None,
        end: date | None,
    ) -> list[MoodEntryResponse]:
        if start is None or end is None:
            start, end = _week_bounds(0)
        entries = self._repo.find_in_range(user_id, start, end)
        return [_to_response(e) for e in entries]

    def delete_entry(self, user_id: str, entry_id: str) -> None:
        entry = self._repo.find_by_entry_id(entry_id)
        if not entry:
            raise NotFoundError("Mood entry not found")
        if entry.user_id != user_id:
            raise NotFoundError("Mood entry not found")
        self._repo.delete(entry.id)
        logger.info("mood_entry_deleted", extra={"user_id": user_id, "entry_id": entry_id})

    def get_weekly(self, user_id: str, week_offset: int) -> WeeklyMoodData:
        start, end = _week_bounds(week_offset)
        entries = self._repo.find_in_range(user_id, start, end)
        by_date = {e.date.isoformat(): e for e in entries}

        days: list[MoodEntryResponse | None] = []
        for i in range(7):
            key = (start + timedelta(days=i)).isoformat()
            days.append(_to_response(by_date[key]) if key in by_date else None)

        return WeeklyMoodData(
            week_start=start.isoformat(),
            week_end=end.isoformat(),
            entries=days,
        )

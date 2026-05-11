"""
Preferences service.

Single responsibility: accessibility preference persistence per user.
Upserts (not inserts) on every PUT so GET always returns a row.

Failure modes handled:
- User not found on get    → NotFoundError (preferences not yet created returns defaults)
"""
from __future__ import annotations

from loguru import logger

from server.db.repositories.user_repo import PreferencesRepository
from server.features.preferences.schemas import (
    UserPreferencesRequest,
    UserPreferencesResponse,
)

_DEFAULTS = {
    "fontSize": "normal",
    "highContrast": False,
    "reduceMotion": False,
    "textToSpeech": False,
    "autoSave": True,
    "notifications": True,
}


def _to_response(prefs, user_id: str) -> UserPreferencesResponse:
    return UserPreferencesResponse(
        user_id=user_id,
        fontSize=prefs.fontSize,
        highContrast=prefs.highContrast,
        reduceMotion=prefs.reduceMotion,
        textToSpeech=prefs.textToSpeech,
        autoSave=prefs.autoSave,
        notifications=prefs.notifications,
        updated_at=prefs.updated_at,
    )


class PreferencesService:
    def __init__(self, repo: PreferencesRepository) -> None:
        self._repo = repo

    def get_preferences(self, user_id: str) -> UserPreferencesResponse:
        prefs = self._repo.find_by_user_id(user_id)
        if prefs:
            return _to_response(prefs, user_id)
        # Return defaults without persisting — first GET should be lightweight
        return UserPreferencesResponse(user_id=user_id, **_DEFAULTS, updated_at=None)

    def save_preferences(
        self, user_id: str, payload: UserPreferencesRequest
    ) -> UserPreferencesResponse:
        data = payload.model_dump()
        prefs = self._repo.upsert(user_id, data)
        logger.info("preferences_saved", extra={"user_id": user_id})
        return _to_response(prefs, user_id)

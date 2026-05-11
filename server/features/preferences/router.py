"""
Preferences router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in PreferencesService.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.user_repo import PreferencesRepository
from server.features.auth.dependencies import get_current_user
from server.features.preferences.schemas import (
    UserPreferencesRequest,
    UserPreferencesResponse,
)
from server.features.preferences.service import PreferencesService

preferences_router = APIRouter(prefix="/users/preferences", tags=["preferences"])


def _get_service(db: Session = Depends(get_db)) -> PreferencesService:
    return PreferencesService(repo=PreferencesRepository(db))


@preferences_router.get("", response_model=UserPreferencesResponse)
def get_preferences(
    current_user: dict = Depends(get_current_user),
    service: PreferencesService = Depends(_get_service),
) -> UserPreferencesResponse:
    """Return the authenticated user's accessibility preferences (or defaults)."""
    return service.get_preferences(current_user["user_id"])


@preferences_router.put("", response_model=UserPreferencesResponse)
def save_preferences(
    payload: UserPreferencesRequest,
    current_user: dict = Depends(get_current_user),
    service: PreferencesService = Depends(_get_service),
) -> UserPreferencesResponse:
    """Persist accessibility preferences for the authenticated user."""
    return service.save_preferences(current_user["user_id"], payload)

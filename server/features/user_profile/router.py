"""
User Profile router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in UserProfileService.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.analysis_repo import AnalysisRepository
from server.db.repositories.user_repo import (
    DoctorRepository,
    RelationshipRepository,
    UserRepository,
)
from server.features.auth.dependencies import get_current_user
from server.features.user_profile.schemas import (
    ConnectDoctorRequest,
    UserProfileRequest,
    UserProfileResponse,
    UserProfileStats,
    ConnectedDoctorResponse,
)
from server.features.user_profile.service import UserProfileService
from server.features.notifications.service import NotificationService
from server.db.repositories.notification_repo import NotificationRepository

user_profile_router = APIRouter(prefix="/user-profile", tags=["user-profile"])


def _get_service(db: Session = Depends(get_db)) -> UserProfileService:
    return UserProfileService(
        user_repo=UserRepository(db),
        doctor_repo=DoctorRepository(db),
        rel_repo=RelationshipRepository(db),
        analysis_repo=AnalysisRepository(db),
        notification_svc=NotificationService(repo=NotificationRepository(db)),
    )


@user_profile_router.get("", response_model=UserProfileResponse)
def get_user_profile(
    current_user: dict = Depends(get_current_user),
    service: UserProfileService = Depends(_get_service),
) -> UserProfileResponse:
    """Return the authenticated user's profile with stats."""
    return service.get_profile(current_user["user_id"])


@user_profile_router.get("/stats", response_model=UserProfileStats)
def get_user_profile_stats(
    current_user: dict = Depends(get_current_user),
    service: UserProfileService = Depends(_get_service),
) -> UserProfileStats:
    """Return per-modality analysis counts and most frequent emotion."""
    return service.get_profile_stats(current_user["user_id"])


@user_profile_router.post("", response_model=UserProfileResponse)
def save_user_profile(
    payload: UserProfileRequest,
    current_user: dict = Depends(get_current_user),
    service: UserProfileService = Depends(_get_service),
) -> UserProfileResponse:
    """Create or update the authenticated user's profile fields."""
    return service.save_profile(current_user["user_id"], payload)


@user_profile_router.post("/connect-doctor", response_model=UserProfileResponse)
def connect_doctor(
    payload: ConnectDoctorRequest,
    current_user: dict = Depends(get_current_user),
    service: UserProfileService = Depends(_get_service),
) -> UserProfileResponse:
    """Connect the user to a doctor using the doctor's 6-character code."""
    return service.connect_doctor(current_user["user_id"], payload)


@user_profile_router.get("/doctor", response_model=ConnectedDoctorResponse)
def get_connected_doctor(
    current_user: dict = Depends(get_current_user),
    service: UserProfileService = Depends(_get_service),
) -> ConnectedDoctorResponse:
    """Return the user's connected doctor."""
    return service.get_connected_doctor(current_user["user_id"])


@user_profile_router.delete("/disconnect", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_doctor(
    current_user: dict = Depends(get_current_user),
    service: UserProfileService = Depends(_get_service),
) -> None:
    """Sever the active user–doctor relationship."""
    service.disconnect_doctor(current_user["user_id"])

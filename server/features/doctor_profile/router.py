"""
Doctor Profile router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in DoctorProfileService.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.user_repo import (
    DoctorRepository,
    RelationshipRepository,
    UserRepository,
)
from server.features.auth.dependencies import get_current_doctor
from server.features.doctor_profile.schemas import (
    DoctorProfileResponse,
    PatientInfo,
    UpdateDoctorProfileRequest,
)
from server.features.doctor_profile.service import DoctorProfileService
from server.features.dashboard.service import DashboardService
from server.features.dashboard.schemas import DoctorDashboardStats
from server.utils.pagination import PaginatedResponse

doctor_profile_router = APIRouter(prefix="/doctors", tags=["doctor-profile"])


def _get_service(db: Session = Depends(get_db)) -> DoctorProfileService:
    return DoctorProfileService(
        doctor_repo=DoctorRepository(db),
        rel_repo=RelationshipRepository(db),
        user_repo=UserRepository(db),
    )


@doctor_profile_router.get("/profile", response_model=DoctorProfileResponse)
def get_doctor_profile(
    current_doctor: dict = Depends(get_current_doctor),
    service: DoctorProfileService = Depends(_get_service),
) -> DoctorProfileResponse:
    """Return the authenticated doctor's profile with patient count."""
    return service.get_profile(current_doctor["doctor_id"])

def _get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(db=db)

@doctor_profile_router.get("/profile/stats", response_model=DoctorDashboardStats)
def get_doctor_profile_stats(
    current_doctor: dict = Depends(get_current_doctor),
    dashboard_svc: DashboardService = Depends(_get_dashboard_service),
) -> DoctorDashboardStats:
    """Return doctor stats, proxying to the dashboard service."""
    return dashboard_svc.get_doctor_stats(current_doctor["doctor_id"])


@doctor_profile_router.put("/profile", response_model=DoctorProfileResponse)
def update_doctor_profile(
    payload: UpdateDoctorProfileRequest,
    current_doctor: dict = Depends(get_current_doctor),
    service: DoctorProfileService = Depends(_get_service),
) -> DoctorProfileResponse:
    """Update mutable fields of the authenticated doctor's profile."""
    return service.update_profile(current_doctor["doctor_id"], payload)


@doctor_profile_router.get("/patients", response_model=PaginatedResponse[PatientInfo])
def list_patients(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_doctor: dict = Depends(get_current_doctor),
    service: DoctorProfileService = Depends(_get_service),
) -> PaginatedResponse[PatientInfo]:
    """Return a paginated list of patients connected to the authenticated doctor."""
    return service.list_patients(current_doctor["doctor_id"], page, size)


@doctor_profile_router.post("/code/regenerate", response_model=DoctorProfileResponse)
def regenerate_doctor_code(
    current_doctor: dict = Depends(get_current_doctor),
    service: DoctorProfileService = Depends(_get_service),
) -> DoctorProfileResponse:
    """Generate a new unique 6-character doctor code (invalidates the old one)."""
    return service.regenerate_code(current_doctor["doctor_id"])

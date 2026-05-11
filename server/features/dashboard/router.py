"""
Dashboard router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in DashboardService.

Routes:
  GET /users/dashboard/stats
  GET /users/dashboard/recent-analyses
  GET /doctors/dashboard/stats
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.features.auth.dependencies import get_current_doctor, get_current_user
from server.features.dashboard.schemas import (
    DoctorDashboardStats,
    RecentAnalysis,
    UserDashboardStats,
    RecentFormSummary,
)
from server.features.dashboard.service import DashboardService

dashboard_router = APIRouter(tags=["dashboard"])


def _get_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(db=db)


@dashboard_router.get("/users/dashboard/stats", response_model=UserDashboardStats)
def get_user_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    service: DashboardService = Depends(_get_service),
) -> UserDashboardStats:
    """Aggregated statistics for the authenticated patient's dashboard."""
    return service.get_user_stats(current_user["user_id"])


@dashboard_router.get(
    "/users/dashboard/recent-analyses", response_model=list[RecentAnalysis]
)
def get_user_recent_analyses(
    limit: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
    service: DashboardService = Depends(_get_service),
) -> list[RecentAnalysis]:
    """Most recent analyses for the authenticated patient (max 20)."""
    return service.get_recent_analyses(current_user["user_id"], limit)


@dashboard_router.get("/doctors/dashboard/stats", response_model=DoctorDashboardStats)
def get_doctor_dashboard_stats(
    current_doctor: dict = Depends(get_current_doctor),
    service: DashboardService = Depends(_get_service),
) -> DoctorDashboardStats:
    """Aggregated statistics for the authenticated doctor's dashboard."""
    return service.get_doctor_stats(current_doctor["doctor_id"])

@dashboard_router.get("/doctors/dashboard/recent-forms", response_model=list[RecentFormSummary])
def get_doctor_recent_forms(
    limit: int = Query(5, ge=1, le=20),
    current_doctor: dict = Depends(get_current_doctor),
    service: DashboardService = Depends(_get_service),
) -> list[RecentFormSummary]:
    """Most recent wellness forms for the authenticated doctor."""
    return service.get_recent_forms(current_doctor["doctor_id"], limit)

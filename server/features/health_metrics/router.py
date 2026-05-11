"""
Health Metrics router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in HealthMetricsService.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.config.settings import settings
from server.db.session import get_db
from server.db.repositories.health_metrics_repo import HealthMetricsRepository
from server.features.auth.dependencies import get_current_user
from server.features.health_metrics.schemas import (
    HealthMetricsEntryRequest,
    HealthMetricsEntryResponse,
)
from server.features.health_metrics.service import HealthMetricsService
from server.infra.openai.client import generate_completion

health_metrics_router = APIRouter(prefix="/health-metrics", tags=["health-metrics"])


class _OpenAIAdapter:
    """Thin adapter so HealthMetricsService can call generate_completion via injection."""

    async def generate_completion(self, messages, **kwargs):
        return await generate_completion(messages, **kwargs)


_openai_adapter = _OpenAIAdapter()


def _get_service(db: Session = Depends(get_db)) -> HealthMetricsService:
    return HealthMetricsService(
        repo=HealthMetricsRepository(db),
        openai_client=_openai_adapter,
        model=settings.openai_model,
    )


@health_metrics_router.post("", response_model=HealthMetricsEntryResponse, status_code=201)
async def create_health_entry(
    payload: HealthMetricsEntryRequest,
    current_user: dict = Depends(get_current_user),
    service: HealthMetricsService = Depends(_get_service),
) -> HealthMetricsEntryResponse:
    """Record a new health metrics entry with AI interpretation."""
    return await service.create_entry(current_user["user_id"], payload)


@health_metrics_router.get("", response_model=list[HealthMetricsEntryResponse])
def list_health_entries(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: HealthMetricsService = Depends(_get_service),
) -> list[HealthMetricsEntryResponse]:
    """List health metric entries with optional date range and pagination."""
    return service.list_entries(current_user["user_id"], start, end, page, size)


@health_metrics_router.get("/latest", response_model=Optional[HealthMetricsEntryResponse])
def get_latest_entry(
    current_user: dict = Depends(get_current_user),
    service: HealthMetricsService = Depends(_get_service),
) -> Optional[HealthMetricsEntryResponse]:
    """Return the most recent health metrics entry for the user."""
    return service.get_latest(current_user["user_id"])


@health_metrics_router.delete("/{entry_id}", status_code=204)
def delete_health_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    service: HealthMetricsService = Depends(_get_service),
) -> None:
    """Delete a health metrics entry (owner only)."""
    service.delete_entry(current_user["user_id"], entry_id)

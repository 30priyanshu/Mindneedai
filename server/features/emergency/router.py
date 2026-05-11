"""
Emergency router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in EmergencyService / EmergencyAlertManager.

Routes:
  POST   /emergency-contacts
  GET    /emergency-contacts
  DELETE /emergency-contacts
  GET    /emergency-contacts/alerts/history
  GET    /emergency-contacts/cooldown
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.emergency_repo import (
    AlertLogRepository,
    EmergencyContactRepository,
)
from server.features.auth.dependencies import get_current_user
from server.features.emergency.schemas import (
    AlertHistoryResponse,
    CooldownStatusResponse,
    EmergencyContactRequest,
    EmergencyContactResponse,
)
from server.features.emergency.service import EmergencyService

from pydantic import BaseModel

emergency_router = APIRouter(
    prefix="/emergency-contacts", tags=["emergency"]
)


def _get_service(db: Session = Depends(get_db)) -> EmergencyService:
    return EmergencyService(
        contact_repo=EmergencyContactRepository(db),
        log_repo=AlertLogRepository(db),
    )


@emergency_router.post(
    "",
    response_model=EmergencyContactResponse,
    status_code=status.HTTP_200_OK,
)
def upsert_emergency_contact(
    payload: EmergencyContactRequest,
    current_user: dict = Depends(get_current_user),
    service: EmergencyService = Depends(_get_service),
) -> EmergencyContactResponse:
    """Create or update the emergency contact configuration for the authenticated user."""
    return service.upsert_contact(current_user["user_id"], payload)


@emergency_router.get("", response_model=EmergencyContactResponse)
def get_emergency_contact(
    current_user: dict = Depends(get_current_user),
    service: EmergencyService = Depends(_get_service),
) -> EmergencyContactResponse:
    """Retrieve the emergency contact configuration for the authenticated user."""
    return service.get_contact(current_user["user_id"])


@emergency_router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_emergency_contact(
    current_user: dict = Depends(get_current_user),
    service: EmergencyService = Depends(_get_service),
) -> None:
    """Delete the emergency contact configuration for the authenticated user."""
    service.delete_contact(current_user["user_id"])


@emergency_router.get(
    "/alerts/history", response_model=list[AlertHistoryResponse]
)
def get_alert_history(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: EmergencyService = Depends(_get_service),
) -> list[AlertHistoryResponse]:
    """Paginated emergency alert log for the authenticated user."""
    return service.get_alert_history(current_user["user_id"], page=page, size=size)


@emergency_router.get("/cooldown", response_model=CooldownStatusResponse)
def get_cooldown_status(
    current_user: dict = Depends(get_current_user),
    service: EmergencyService = Depends(_get_service),
) -> CooldownStatusResponse:
    """Return the current cooldown window status for the authenticated user."""
    return service.get_cooldown_status(current_user["user_id"])


class TestEmailRequest(BaseModel):
    email: str

@emergency_router.post("/test/email")
def test_email(
    payload: TestEmailRequest,
    current_user: dict = Depends(get_current_user),
    service: EmergencyService = Depends(_get_service),
) -> dict:
    """Test emergency email delivery."""
    return service.test_email_delivery(payload.email)

@emergency_router.get("/system/status")
def system_status(
    service: EmergencyService = Depends(_get_service),
) -> dict:
    """Get emergency system status."""
    return service.get_system_status()

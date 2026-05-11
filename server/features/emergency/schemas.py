"""
Emergency schemas.

Single responsibility: Pydantic request/response shapes for emergency contacts,
alert history, and cooldown status. No business logic.
"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class EmergencyContactRequest(BaseModel):
    """Payload to create or update a user's emergency contact configuration."""

    doctor_enabled: bool = Field(default=False)
    doctor_email: Optional[EmailStr] = Field(
        None, description="Email to notify when doctor_enabled is True"
    )
    loved_one_enabled: bool = Field(default=False)
    loved_one_email: Optional[EmailStr] = Field(
        None, description="Email to notify when loved_one_enabled is True"
    )


class EmergencyContactResponse(BaseModel):
    """Current configured emergency contact record for the authenticated user."""

    user_id: str
    doctor_enabled: bool
    doctor_email: Optional[str] = None
    loved_one_enabled: bool
    loved_one_email: Optional[str] = None

    class Config:
        from_attributes = True


class AlertHistoryResponse(BaseModel):
    """Single entry in the emergency alert log."""

    triggered_at: str
    alert_type: str
    emergency_condition: Optional[str] = None
    risk_score: Optional[float] = None
    doctor_notified: bool
    loved_one_notified: bool
    alert_status: str


class CooldownStatusResponse(BaseModel):
    """Current cooldown window status for the authenticated user."""

    in_cooldown: bool
    last_alert: Optional[str] = Field(
        None, description="ISO8601 timestamp of the last alert"
    )
    hours_remaining: Optional[float] = None
    message: str

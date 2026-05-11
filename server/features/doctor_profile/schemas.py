"""
Doctor Profile schemas.

Single responsibility: Pydantic input/output contracts for doctor-profile endpoints.
No business logic or DB access.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from server.utils.sanitize import normalize_input


class UpdateDoctorProfileRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    specialty: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    license_number: Optional[str] = Field(None, max_length=100)

    @field_validator("name", "specialty", "location", "license_number", mode="before")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        return normalize_input(v) if v else None


class DoctorProfileResponse(BaseModel):
    doctor_id: str
    email: str
    name: str
    specialty: Optional[str]
    location: Optional[str]
    license_number: Optional[str]
    doctor_code: str
    verification_status: str
    is_active: bool
    created_at: datetime
    # Stats (populated by service)
    total_patients: int = 0

    model_config = {"from_attributes": True}


class PatientInfo(BaseModel):
    user_id: str
    name: Optional[str]
    email: str
    connected_at: datetime

    model_config = {"from_attributes": True}

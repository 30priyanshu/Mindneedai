from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from server.utils.sanitize import normalize_input

GENDER_OPTIONS = ("male", "female", "non-binary", "prefer-not-to-say", "other")


class UserProfileRequest(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = Field(None, max_length=20)
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)

    @field_validator("first_name", "last_name", "name", "location", "emergency_contact_name", mode="before")
    @classmethod
    def _strip(cls, v: Optional[str]) -> Optional[str]:
        return normalize_input(v) if v else None


class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    location: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    total_analyses: int = 0
    connected_doctor_id: Optional[str] = None

    model_config = {"from_attributes": True}


class UserProfileStats(BaseModel):
    """Breakdown of analysis counts per modality + most frequent emotion."""
    total_analyses: int = 0
    text_count: int = 0
    video_count: int = 0
    audio_count: int = 0
    most_frequent_emotion: str = "N/A"


class ConnectDoctorRequest(BaseModel):
    doctor_code: Optional[str] = Field(None, min_length=6, max_length=6, pattern=r"^[A-Z0-9]{6}$")
    doctor_email: Optional[str] = None

    @model_validator(mode="after")
    def _check_identifiers(self) -> "ConnectDoctorRequest":
        if not self.doctor_code and not self.doctor_email:
            raise ValueError("Must provide either doctor_code or doctor_email")
        return self


class DoctorInfo(BaseModel):
    doctor_id: str
    name: str
    email: str
    specialty: Optional[str] = None
    license_number: Optional[str] = None


class ConnectedDoctorResponse(BaseModel):
    connected: bool
    doctor: Optional[DoctorInfo] = None

"""
Pydantic schemas for auth layer.
"""
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)
    location: str | None = None
    
    model_config = ConfigDict(extra="forbid")


class RegisterDoctorRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)
    license_number: str | None = None
    specialty: str | None = None
    location: str | None = None
    
    model_config = ConfigDict(extra="forbid")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    role: str = Field(..., pattern="^(user|doctor)$")

    model_config = ConfigDict(extra="forbid")


class AuthResponse(BaseModel):
    token: str
    role: str
    id: str
    email: EmailStr
    name: str
    doctor_code: str | None = None

    model_config = ConfigDict(extra="forbid")


class AuthMeResponse(BaseModel):
    role: str
    email: EmailStr
    name: str
    user_id: str | None = None
    doctor_id: str | None = None
    doctor_code: str | None = None

    model_config = ConfigDict(extra="forbid")


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

    model_config = ConfigDict(extra="forbid")

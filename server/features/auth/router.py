"""
Authentication endpoints.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.user_repo import DoctorRepository, UserRepository
from server.features.auth.dependencies import get_current_user_or_doctor
from server.features.auth.schemas import (AuthMeResponse, AuthResponse, ChangePasswordRequest,
                                          LoginRequest, RegisterDoctorRequest,
                                          RegisterUserRequest)
from server.features.auth.service import AuthService

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Dependency injection constructor for AuthService."""
    user_repo = UserRepository(db)
    doctor_repo = DoctorRepository(db)
    return AuthService(user_repo, doctor_repo)


@auth_router.post("/register/user", response_model=AuthResponse, status_code=201)
def register_user(
    req: RegisterUserRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return auth_service.register_user(req)


@auth_router.post("/register/doctor", response_model=AuthResponse, status_code=201)
def register_doctor(
    req: RegisterDoctorRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return auth_service.register_doctor(req)


@auth_router.post("/login", response_model=AuthResponse)
def login(
    req: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    return auth_service.login(req)


@auth_router.post("/logout", status_code=204)
def logout() -> None:
    return None


@auth_router.get("/me", response_model=AuthMeResponse)
def get_me(
    entity: Annotated[dict[str, str], Depends(get_current_user_or_doctor)],
) -> AuthMeResponse:
    return AuthMeResponse(
        role=entity["role"],
        email=entity["email"],
        name=entity["name"],
        user_id=entity.get("user_id"),
        doctor_id=entity.get("doctor_id"),
        doctor_code=entity.get("doctor_code"),
    )


@auth_router.post("/change-password", status_code=204)
def change_password(
    req: ChangePasswordRequest,
    entity: Annotated[dict[str, str], Depends(get_current_user_or_doctor)],
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    entity_id = entity.get("user_id") or entity.get("doctor_id")
    if not entity_id:
        from server.exceptions import UnauthorizedError
        raise UnauthorizedError("Unable to identify entity_id")
    auth_service.change_password(entity_id, entity["role"], req.old_password, req.new_password)

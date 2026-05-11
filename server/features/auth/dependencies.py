"""
FastAPI dependencies for authentication.
"""
from typing import Mapping

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.user_repo import DoctorRepository, UserRepository
from server.exceptions import ForbiddenError, UnauthorizedError
from server.features.auth.token_utils import verify_token

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise UnauthorizedError("Invalid or expired token")
        
    user_id = payload.get("sub")
    role = payload.get("role")
    
    if not user_id or role != "user":
        raise UnauthorizedError("Invalid token payload")
        
    repo = UserRepository(db)
    user = repo.find_by_user_id(user_id)
    
    if not user:
        raise UnauthorizedError("User not found")
    if not user.is_active:
        raise ForbiddenError("Account is inactive")
        
    return {
        "user_id": str(user.user_id),
        "email": str(user.email),
        "name": str(user.name),
        "role": "user",
    }


def get_current_doctor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise UnauthorizedError("Invalid or expired token")
        
    doctor_id = payload.get("sub")
    role = payload.get("role")
    
    if not doctor_id or role != "doctor":
        raise ForbiddenError("Doctor access required")
        
    repo = DoctorRepository(db)
    doctor = repo.find_by_doctor_id(doctor_id)
    
    if not doctor:
        raise UnauthorizedError("Doctor not found")
    if not doctor.is_active:
        raise ForbiddenError("Account is inactive")
        
    return {
        "doctor_id": str(doctor.doctor_id),
        "email": str(doctor.email),
        "name": str(doctor.name),
        "role": "doctor",
        "doctor_code": str(doctor.doctor_code),
    }


def get_current_user_or_doctor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise UnauthorizedError("Invalid or expired token")
        
    entity_id = payload.get("sub")
    role = payload.get("role")
    
    if not entity_id or role not in ["user", "doctor"]:
        raise UnauthorizedError("Invalid token payload")
        
    if role == "user":
        repo_user = UserRepository(db)
        entity = repo_user.find_by_user_id(entity_id)
    else:
        repo_doc = DoctorRepository(db)
        entity = repo_doc.find_by_doctor_id(entity_id)
        
    if not entity:
        raise UnauthorizedError(f"{role.capitalize()} not found")
    if not entity.is_active:
        raise ForbiddenError("Account is inactive")
        
    result = {
        "email": str(entity.email),
        "name": str(entity.name),
        "role": str(role),
    }
    
    if role == "user":
        result["user_id"] = str(entity.user_id)
    else:
        result["doctor_id"] = str(entity.doctor_id)
        result["doctor_code"] = str(entity.doctor_code)
        
    return result

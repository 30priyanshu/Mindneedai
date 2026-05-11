"""
Authentication service orchestration.
"""
import secrets
import string
import uuid

from loguru import logger

from server.db.models.user import Doctor, UserProfile
from server.db.repositories.user_repo import DoctorRepository, UserRepository
from server.exceptions import ConflictError, UnauthorizedError
from server.features.auth.login_guard import (check_login_allowed,
                                              record_failed_login,
                                              record_successful_login)
from server.features.auth.password_utils import (hash_password,
                                                 validate_strength,
                                                 verify_password)
from server.features.auth.schemas import (AuthResponse, LoginRequest,
                                          RegisterDoctorRequest,
                                          RegisterUserRequest)
from server.features.auth.token_utils import create_access_token


class AuthService:
    def __init__(self, user_repo: UserRepository, doctor_repo: DoctorRepository):
        self.user_repo = user_repo
        self.doctor_repo = doctor_repo

    def _build_auth_response(
        self,
        *,
        token: str,
        role: str,
        entity_id: str,
        email: str,
        name: str,
        doctor_code: str | None = None,
    ) -> AuthResponse:
        return AuthResponse(
            token=token,
            role=role,
            id=entity_id,
            email=email,
            name=name,
            doctor_code=doctor_code,
        )

    def _generate_doctor_code(self) -> str:
        """Generate a random 6-character alphanumeric code without look-alikes."""
        chars = string.ascii_uppercase + string.digits
        pool = chars.replace('0', '').replace('O', '').replace('I', '').replace('1', '')
        return "".join(secrets.choice(pool) for _ in range(6))

    def register_user(self, req: RegisterUserRequest) -> AuthResponse:
        if self.user_repo.find_by_email(req.email) or self.doctor_repo.find_by_email(req.email):
            raise ConflictError("Email already registered")

        validate_strength(req.password)
        hashed_pw = hash_password(req.password)
        user_id = str(uuid.uuid4())

        user = UserProfile(
            user_id=user_id,
            email=req.email,
            password_hash=hashed_pw,
            name=req.name,
            location=req.location,
            role="user",
        )
        self.user_repo.create(user)

        token = create_access_token({"sub": user_id, "email": req.email, "role": "user", "name": req.name})
        return self._build_auth_response(
            token=token,
            role="user",
            entity_id=user_id,
            email=req.email,
            name=req.name,
        )

    def register_doctor(self, req: RegisterDoctorRequest) -> AuthResponse:
        if self.user_repo.find_by_email(req.email) or self.doctor_repo.find_by_email(req.email):
            raise ConflictError("Email already registered")

        validate_strength(req.password)
        hashed_pw = hash_password(req.password)
        doctor_id = str(uuid.uuid4())
        
        doctor_code = self._generate_doctor_code()

        doctor = Doctor(
            doctor_id=doctor_id,
            email=req.email,
            password_hash=hashed_pw,
            name=req.name,
            license_number=req.license_number,
            specialty=req.specialty,
            location=req.location,
            doctor_code=doctor_code,
        )
        self.doctor_repo.create(doctor)

        token = create_access_token({"sub": doctor_id, "email": req.email, "role": "doctor", "name": req.name})
        return self._build_auth_response(
            token=token,
            role="doctor",
            entity_id=doctor_id,
            email=req.email,
            name=req.name,
            doctor_code=doctor_code,
        )

    def login(self, req: LoginRequest) -> AuthResponse:
        email = req.email.strip().lower()

        if not check_login_allowed(email):
            raise UnauthorizedError("Account is temporarily locked due to failed login attempts")

        user = self.user_repo.find_by_email(email)
        doctor = self.doctor_repo.find_by_email(email)
        entity = user or doctor

        if not entity or not verify_password(req.password, entity.password_hash):
            record_failed_login(email)
            raise UnauthorizedError("Invalid combination of credentials")

        if not entity.is_active:
            raise UnauthorizedError("Account has been deactivated")

        record_successful_login(email)
        
        role = "user" if user else "doctor"
        if req.role != role:
            record_failed_login(email)
            raise UnauthorizedError(f"No {req.role} account found for this email")
        sub = entity.user_id if role == "user" else entity.doctor_id

        token = create_access_token({"sub": sub, "email": entity.email, "role": role, "name": entity.name})
        doctor_code = getattr(entity, "doctor_code", None)
        return self._build_auth_response(
            token=token,
            role=role,
            entity_id=sub,
            email=entity.email,
            name=entity.name,
            doctor_code=doctor_code,
        )

    def change_password(self, entity_id: str, role: str, old_password: str, new_password: str) -> None:
        if role == "user":
            entity = self.user_repo.find_by_user_id(entity_id)
        else:
            entity = self.doctor_repo.find_by_doctor_id(entity_id)

        if not entity:
            raise UnauthorizedError("Entity not found")

        if not verify_password(old_password, entity.password_hash):
            raise UnauthorizedError("Incorrect current password")

        validate_strength(new_password)
        password_hash = hash_password(new_password)

        if role == "user":
            self.user_repo.update(entity.id, {"password_hash": password_hash})
        else:
            self.doctor_repo.update(entity.id, {"password_hash": password_hash})

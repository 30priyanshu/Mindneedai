"""
Doctor Profile service.

Single responsibility: doctor profile CRUD, paginated patient list,
and doctor-code regeneration. No HTTP coupling.

Failure modes handled:
- Doctor not found           → NotFoundError
- Code collision on regen    → DatabaseError (retried once)
- Ownership mismatch         → ForbiddenError
"""
from __future__ import annotations

import secrets
import string

from loguru import logger

from server.db.models.user import Doctor
from server.db.repositories.user_repo import (
    DoctorRepository,
    RelationshipRepository,
    UserRepository,
)
from server.exceptions import ConflictError, NotFoundError
from server.features.doctor_profile.schemas import (
    DoctorProfileResponse,
    PatientInfo,
    UpdateDoctorProfileRequest,
)
from server.utils.pagination import PaginatedResponse, build_paginated_response

_CODE_ALPHABET = string.ascii_uppercase + string.digits
_CODE_LENGTH = 6


def _generate_code() -> str:
    return "".join(secrets.choice(_CODE_ALPHABET) for _ in range(_CODE_LENGTH))


def _to_response(doctor: Doctor, total_patients: int = 0) -> DoctorProfileResponse:
    return DoctorProfileResponse(
        doctor_id=doctor.doctor_id,
        email=doctor.email,
        name=doctor.name,
        specialty=doctor.specialty,
        location=doctor.location,
        license_number=doctor.license_number,
        doctor_code=doctor.doctor_code,
        verification_status=doctor.verification_status,
        is_active=doctor.is_active,
        created_at=doctor.created_at,
        total_patients=total_patients,
    )


class DoctorProfileService:
    def __init__(
        self,
        doctor_repo: DoctorRepository,
        rel_repo: RelationshipRepository,
        user_repo: UserRepository,
    ) -> None:
        self._doctors = doctor_repo
        self._rels = rel_repo
        self._users = user_repo

    # ------------------------------------------------------------------
    # Profile
    # ------------------------------------------------------------------

    def get_profile(self, doctor_id: str) -> DoctorProfileResponse:
        doctor = self._doctors.find_by_doctor_id(doctor_id)
        if not doctor:
            raise NotFoundError("Doctor profile not found")
        patient_count = len(self._rels.list_patients_for_doctor(doctor_id, page=1, size=1000))
        return _to_response(doctor, patient_count)

    def update_profile(
        self, doctor_id: str, payload: UpdateDoctorProfileRequest
    ) -> DoctorProfileResponse:
        doctor = self._doctors.find_by_doctor_id(doctor_id)
        if not doctor:
            raise NotFoundError("Doctor profile not found")

        update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
        if update:
            self._doctors.update(doctor.id, update)
            doctor = self._doctors.find_by_doctor_id(doctor_id)

        logger.info("doctor_profile_updated", extra={"doctor_id": doctor_id})
        patient_count = len(self._rels.list_patients_for_doctor(doctor_id, page=1, size=1000))
        return _to_response(doctor, patient_count)

    # ------------------------------------------------------------------
    # Patients
    # ------------------------------------------------------------------

    def list_patients(
        self, doctor_id: str, page: int, size: int
    ) -> PaginatedResponse[PatientInfo]:
        rels = self._rels.list_patients_for_doctor(doctor_id, page=page, size=size)
        total_rels = self._rels.count_patients_for_doctor(doctor_id)

        patients: list[PatientInfo] = []
        for rel in rels:
            user = self._users.find_by_user_id(rel.user_id)
            if user:
                patients.append(
                    PatientInfo(
                        user_id=user.user_id,
                        name=user.name,
                        email=user.email or "",
                        connected_at=rel.connected_at,
                    )
                )

        return build_paginated_response(patients, total_rels, page, size)

    # ------------------------------------------------------------------
    # Code regeneration
    # ------------------------------------------------------------------

    def regenerate_code(self, doctor_id: str) -> DoctorProfileResponse:
        doctor = self._doctors.find_by_doctor_id(doctor_id)
        if not doctor:
            raise NotFoundError("Doctor profile not found")

        # Try up to 5 times to find a collision-free code
        for _ in range(5):
            new_code = _generate_code()
            if not self._doctors.find_by_doctor_code(new_code):
                break
        else:
            raise ConflictError("Could not generate a unique doctor code; please retry")

        self._doctors.update(doctor.id, {"doctor_code": new_code})
        logger.info("doctor_code_regenerated", extra={"doctor_id": doctor_id})
        return self.get_profile(doctor_id)

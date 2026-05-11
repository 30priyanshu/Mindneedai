"""
Assessment permissions guard.

Single responsibility: doctor-patient relationship verification only.
Raises typed domain exceptions — no HTTP coupling, no business logic.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from server.db.models.assessment import AssessmentRequest
from server.db.repositories.user_repo import RelationshipRepository
from server.db.repositories.assessment_repo import AssessmentRequestRepository
from server.exceptions import ForbiddenError, NotFoundError, ValidationError


def verify_doctor_patient_relationship(
    doctor_id: str, patient_id: str, db: Session
) -> None:
    """Raise ForbiddenError when no active relationship exists."""
    repo = RelationshipRepository(db)
    if not repo.find_active(patient_id, doctor_id):
        raise ForbiddenError("You are not connected to this patient")


def verify_assessment_request_ownership(
    request_id: str, user_id: str, db: Session
) -> AssessmentRequest:
    """
    Return the AssessmentRequest when all guards pass.

    Raises:
        NotFoundError  — request not found
        ForbiddenError — request belongs to different patient
        ValidationError — request not pending or already expired
    """
    repo = AssessmentRequestRepository(db)
    request = repo.find_by_request_id(request_id)
    if not request:
        raise NotFoundError("Assessment request not found")
    if request.patient_id != user_id:
        raise ForbiddenError("You can only access your own assessment requests")
    if request.status != "pending":
        raise ValidationError(f"Assessment request is already {request.status}")
    if request.expires_at and request.expires_at < datetime.utcnow():
        raise ValidationError("Assessment request has expired")
    return request

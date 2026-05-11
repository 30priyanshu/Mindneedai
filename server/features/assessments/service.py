"""
Assessments service.

Single responsibility: submission orchestration, scoring, idempotency,
request lifecycle, and result storage. No HTTP coupling.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from loguru import logger
from sqlalchemy.orm import Session

from server.db.models.assessment import Assessment, AssessmentRequest
from server.db.repositories.assessment_repo import (
    AssessmentRepository,
    AssessmentRequestRepository,
)
from server.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from server.features.assessments.permissions import (
    verify_assessment_request_ownership,
    verify_doctor_patient_relationship,
)
from server.features.assessments.scoring import GAD7ScoringService, PHQ9ScoringService
from server.features.assessments.schemas import (
    AssessmentRequestCreate,
    AssessmentRequestResponse,
    AssessmentResponse,
    AssessmentResultSummary,
    AssessmentSubmissionResponse,
    GAD7Submission,
    PHQ9Submission,
)

from server.db.models.user import UserDoctorRelationship, UserProfile
from sqlalchemy import select


def _to_assessment_response(e: Assessment) -> AssessmentResponse:
    return AssessmentResponse(
        assessment_id=e.assessment_id,
        user_id=e.user_id,
        assessment_type=e.assessment_type,
        score=e.score,
        severity_level=e.severity_level,
        severity_label=e.severity_label,
        treatment_recommendations=e.treatment_recommendations,
        responses=e.responses,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


def _build_request_response(
    r: AssessmentRequest, db: Session
) -> AssessmentRequestResponse:
    """Map ORM → schema, enriching with patient email and completed result."""
    # Resolve patient email via explicit query to avoid lazy-load N+1
    patient_email: str | None = None
    patient = db.scalar(
        select(UserProfile).where(UserProfile.user_id == r.patient_id).limit(1)
    )
    if patient:
        patient_email = patient.email

    # Resolve completed assessment result via the correct FK
    result: AssessmentResultSummary | None = None
    if r.status == "completed":
        completed = db.scalar(
            select(Assessment)
            .where(Assessment.assessment_request_id == r.request_id)
            .limit(1)
        )
        if completed:
            result = AssessmentResultSummary(
                score=completed.score,
                severity_level=completed.severity_level,
                severity_label=completed.severity_label,
            )

    return AssessmentRequestResponse(
        request_id=r.request_id,
        doctor_id=r.doctor_id,
        patient_id=r.patient_id,
        patient_email=patient_email,
        assessment_type=r.assessment_type,
        status=r.status,
        notes=r.notes,
        created_at=r.created_at,
        expires_at=r.expires_at,
        completed_at=r.completed_at,
        result=result,
    )


class AssessmentService:
    def __init__(
        self,
        assessment_repo: AssessmentRepository,
        request_repo: AssessmentRequestRepository,
        db: Session,
    ) -> None:
        self._repo = assessment_repo
        self._req_repo = request_repo
        self._db = db

    def _check_monthly_idempotency(
        self, user_id: str, assessment_type: str
    ) -> Assessment | None:
        """Return existing submission for the same calendar month, if any."""
        now = datetime.utcnow()
        return self._repo.find_by_user_month(
            user_id, assessment_type, month=now.month, year=now.year
        )

    def _submit(
        self,
        user_id: str,
        request_id: str,
        assessment_type: str,
        responses: dict[str, int],
        score: int,
        severity_level: str,
        severity_label: str,
        treatment_recommendations: dict,
        id_prefix: str,
    ) -> AssessmentSubmissionResponse:
        # Idempotency: one submission per assessment type per calendar month
        existing = self._check_monthly_idempotency(user_id, assessment_type)
        if existing:
            logger.info(
                "assessment_already_submitted",
                extra={"user_id": user_id, "type": assessment_type, "id": existing.assessment_id},
            )
            return AssessmentSubmissionResponse(
                assessment_id=existing.assessment_id,
                message="You have already submitted this assessment for the current month.",
                created_at=existing.created_at,
            )

        assessment_id = f"{id_prefix}_{uuid.uuid4().hex[:16]}"
        record = self._repo.create({
            "assessment_id": assessment_id,
            "user_id": user_id,
            "assessment_type": assessment_type,
            "assessment_request_id": request_id,
            "score": score,
            "severity_level": severity_level,
            "severity_label": severity_label,
            "treatment_recommendations": treatment_recommendations,
            "responses": responses,
        })

        # Mark the doctor request as completed atomically
        self._req_repo.update_by_request_id(
            request_id,
            {"status": "completed", "completed_at": datetime.utcnow()},
        )

        logger.info(
            "assessment_submitted",
            extra={"user_id": user_id, "type": assessment_type, "id": assessment_id, "score": score},
        )
        return AssessmentSubmissionResponse(
            assessment_id=assessment_id,
            message="Thank you for completing the assessment. Your doctor will review your responses.",
            created_at=record.created_at,
        )

    def submit_phq9(
        self, user_id: str, payload: PHQ9Submission
    ) -> AssessmentSubmissionResponse:
        request = verify_assessment_request_ownership(
            payload.assessment_request_id, user_id, self._db
        )
        if request.assessment_type != "PHQ9":
            raise ValidationError("Request type mismatch: expected PHQ9")

        score = PHQ9ScoringService.calculate_score(payload.responses)
        result = PHQ9ScoringService.get_severity_and_treatment(score)
        return self._submit(
            user_id, payload.assessment_request_id, "PHQ9",
            payload.responses, result.score, result.severity_level,
            result.severity_label, result.treatment_recommendations, "phq9",
        )

    def submit_gad7(
        self, user_id: str, payload: GAD7Submission
    ) -> AssessmentSubmissionResponse:
        request = verify_assessment_request_ownership(
            payload.assessment_request_id, user_id, self._db
        )
        if request.assessment_type != "GAD7":
            raise ValidationError("Request type mismatch: expected GAD7")

        score = GAD7ScoringService.calculate_score(payload.responses)
        result = GAD7ScoringService.get_severity_and_treatment(score)
        return self._submit(
            user_id, payload.assessment_request_id, "GAD7",
            payload.responses, result.score, result.severity_level,
            result.severity_label, result.treatment_recommendations, "gad7",
        )

    def list_for_doctor_patient(
        self,
        doctor_id: str,
        patient_id: str,
        assessment_type: str | None,
        page: int,
        size: int,
    ) -> list[AssessmentResponse]:
        verify_doctor_patient_relationship(doctor_id, patient_id, self._db)
        if assessment_type and assessment_type not in ("PHQ9", "GAD7"):
            raise ValidationError("assessment_type must be 'PHQ9' or 'GAD7'")
        records = self._repo.list_by_doctor_patient(
            doctor_id, patient_id, assessment_type, page, size
        )
        return [_to_assessment_response(r) for r in records]

    def list_for_patient(self, user_id: str, page: int, size: int) -> list[AssessmentResponse]:
        records = self._repo.list_by_user(user_id, page, size)
        return [_to_assessment_response(r) for r in records]

    def get_assessment(self, user_id: str, assessment_id: str) -> AssessmentResponse:
        record = self._repo.find_by_assessment_id(assessment_id)
        if not record or record.user_id != user_id:
            raise NotFoundError("Assessment not found")
        return _to_assessment_response(record)

    def get_available_requests(self, patient_id: str) -> list[AssessmentRequestResponse]:
        requests = self._req_repo.find_pending_for_patient(patient_id)
        return [_build_request_response(r, self._db) for r in requests]

    def create_request(
        self, doctor_id: str, patient_id: str, payload: AssessmentRequestCreate
    ) -> list[AssessmentRequestResponse]:
        verify_doctor_patient_relationship(doctor_id, patient_id, self._db)
        expires_at = (
            datetime.utcnow() + timedelta(days=payload.expires_in_days)
            if payload.expires_in_days
            else None
        )
        created: list[AssessmentRequest] = []
        for assessment_type in payload.assessment_types:
            if self._req_repo.has_pending_of_type(doctor_id, patient_id, assessment_type):
                logger.warning(
                    "assessment_request_duplicate",
                    extra={"doctor_id": doctor_id, "patient_id": patient_id, "type": assessment_type},
                )
                continue
            request = self._req_repo.create({
                "request_id": f"req_{uuid.uuid4().hex[:16]}",
                "doctor_id": doctor_id,
                "patient_id": patient_id,
                "assessment_type": assessment_type,
                "expires_at": expires_at,
                "notes": payload.notes,
            })
            created.append(request)
            logger.info(
                "assessment_request_created",
                extra={"doctor_id": doctor_id, "patient_id": patient_id, "type": assessment_type},
            )

        if not created:
            raise ConflictError("Pending assessment request(s) already exist for all specified types")
        return [_build_request_response(r, self._db) for r in created]

    def get_requests_for_patient(
        self, doctor_id: str, patient_id: str
    ) -> list[AssessmentRequestResponse]:
        verify_doctor_patient_relationship(doctor_id, patient_id, self._db)
        requests = self._req_repo.find_by_doctor_patient(doctor_id, patient_id)
        return [_build_request_response(r, self._db) for r in requests]

    def get_requests_for_doctor(self, doctor_id: str) -> list[AssessmentRequestResponse]:
        requests = self._req_repo.find_by_doctor(doctor_id)
        return [_build_request_response(r, self._db) for r in requests]

    def get_doctor_patient_options(self, doctor_id: str) -> list[dict]:
        stmt = select(UserProfile.user_id, UserProfile.name).select_from(UserDoctorRelationship).join(
            UserProfile, UserDoctorRelationship.user_id == UserProfile.user_id
        ).where(
            UserDoctorRelationship.doctor_id == doctor_id,
            UserDoctorRelationship.status == "active"
        )
        results = self._db.execute(stmt).all()
        return [{"id": r[0], "name": r[1] or "Unknown"} for r in results]

    def cancel_request(self, doctor_id: str, request_id: str) -> None:
        request = self._req_repo.find_by_request_id(request_id)
        if not request:
            raise NotFoundError("Assessment request not found")
        if request.doctor_id != doctor_id:
            raise ForbiddenError("You can only cancel your own requests")
        if request.status != "pending":
            raise ValidationError(f"Cannot cancel a request with status '{request.status}'")
        self._req_repo.update(request.id, {"status": "cancelled"})
        logger.info("assessment_request_cancelled", extra={"doctor_id": doctor_id, "request_id": request_id})

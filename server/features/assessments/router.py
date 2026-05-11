"""
Assessments router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in AssessmentService.

"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from server.db.session import get_db
from server.db.repositories.assessment_repo import (
    AssessmentRepository,
    AssessmentRequestRepository,
)
from server.features.assessments.questionnaires import get_gad7_questions, get_phq9_questions
from server.features.auth.dependencies import (
    get_current_doctor,
    get_current_user,
    get_current_user_or_doctor,
)
from server.features.assessments.schemas import (
    AssessmentRequestCreate,
    AssessmentRequestResponse,
    AssessmentResponse,
    AssessmentSubmissionResponse,
    GAD7Submission,
    PHQ9Submission,
)
from server.features.assessments.service import AssessmentService

assessments_router = APIRouter(prefix="/assessments", tags=["assessments"])


def _get_service(db: Session = Depends(get_db)) -> AssessmentService:
    return AssessmentService(
        assessment_repo=AssessmentRepository(db),
        request_repo=AssessmentRequestRepository(db),
        db=db,
    )


# ---------------------------------------------------------------------------
# 1. Fully-static metadata routes (no auth — public questionnaire definitions)
# ---------------------------------------------------------------------------

@assessments_router.get("/questionnaires/phq9")
def get_phq9() -> dict:
    """Return the PHQ-9 questionnaire definition."""
    return {
        "assessment_type": "PHQ9",
        "title": "Patient Health Questionnaire-9",
        "description": "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
        "questions": get_phq9_questions(),
        "score_range": "0–27",
        "scoring_guide": "0–4: None-minimal, 5–9: Mild, 10–14: Moderate, 15–19: Moderately Severe, 20–27: Severe",
    }


@assessments_router.get("/questionnaires/gad7")
def get_gad7() -> dict:
    """Return the GAD-7 questionnaire definition."""
    return {
        "assessment_type": "GAD7",
        "title": "Generalized Anxiety Disorder-7",
        "description": "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
        "questions": get_gad7_questions(),
        "score_range": "0–21",
        "scoring_guide": "0–4: Minimal, 5–9: Mild, 10–14: Moderate, 15–21: Severe",
    }


# ---------------------------------------------------------------------------
# 2. Static patient routes — MUST be before any dynamic segment that shares
#    the same first path word (e.g. /requests/available before /requests/{id})
# ---------------------------------------------------------------------------

@assessments_router.get(
    "/requests/available",
    response_model=list[AssessmentRequestResponse],
)
def get_available_requests(
    current_user: dict = Depends(get_current_user),
    service: AssessmentService = Depends(_get_service),
) -> list[AssessmentRequestResponse]:
    """List pending assessment requests assigned to the current patient."""
    return service.get_available_requests(current_user["user_id"])


@assessments_router.get("/history", response_model=list[AssessmentResponse])
def get_assessment_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: AssessmentService = Depends(_get_service),
) -> list[AssessmentResponse]:
    """List a patient's own completed assessments."""
    return service.list_for_patient(current_user["user_id"], page, size)


@assessments_router.post("/phq9", response_model=AssessmentSubmissionResponse, status_code=201)
def submit_phq9(
    payload: PHQ9Submission,
    current_user: dict = Depends(get_current_user),
    service: AssessmentService = Depends(_get_service),
) -> AssessmentSubmissionResponse:
    """Submit a PHQ-9 response set against a doctor-issued request."""
    return service.submit_phq9(current_user["user_id"], payload)


@assessments_router.post("/gad7", response_model=AssessmentSubmissionResponse, status_code=201)
def submit_gad7(
    payload: GAD7Submission,
    current_user: dict = Depends(get_current_user),
    service: AssessmentService = Depends(_get_service),
) -> AssessmentSubmissionResponse:
    """Submit a GAD-7 response set against a doctor-issued request."""
    return service.submit_gad7(current_user["user_id"], payload)


# ---------------------------------------------------------------------------
# 3. Static doctor routes — must be before /requests/{patient_id} wildcard
# ---------------------------------------------------------------------------

@assessments_router.get(
    "/doctor/requests",
    response_model=list[AssessmentRequestResponse],
)
def get_all_doctor_requests(
    current_doctor: dict = Depends(get_current_doctor),
    service: AssessmentService = Depends(_get_service),
) -> list[AssessmentRequestResponse]:
    """List all assessment requests created by the doctor."""
    return service.get_requests_for_doctor(current_doctor["doctor_id"])


@assessments_router.get("/doctor/patients", response_model=list[dict])
def get_doctor_patients_options(
    current_doctor: dict = Depends(get_current_doctor),
    service: AssessmentService = Depends(_get_service),
) -> list[dict]:
    """List all connected patients for the doctor to select."""
    return service.get_doctor_patient_options(current_doctor["doctor_id"])


# ---------------------------------------------------------------------------
# 4. Mixed static+dynamic doctor routes — after static doctor routes above
# ---------------------------------------------------------------------------

@assessments_router.post(
    "/requests/{patient_id}",
    response_model=list[AssessmentRequestResponse],
    status_code=201,
)
def create_assessment_request(
    patient_id: str,
    payload: AssessmentRequestCreate,
    current_doctor: dict = Depends(get_current_doctor),
    service: AssessmentService = Depends(_get_service),
) -> list[AssessmentRequestResponse]:
    """Create assessment request(s) for a patient (doctor only)."""
    return service.create_request(current_doctor["doctor_id"], patient_id, payload)


@assessments_router.get(
    "/requests/{patient_id}",
    response_model=list[AssessmentRequestResponse],
)
def list_patient_requests(
    patient_id: str,
    current_doctor: dict = Depends(get_current_doctor),
    service: AssessmentService = Depends(_get_service),
) -> list[AssessmentRequestResponse]:
    """List all assessment requests doctor has issued to a patient."""
    return service.get_requests_for_patient(current_doctor["doctor_id"], patient_id)


@assessments_router.delete("/requests/{request_id}", status_code=204)
def cancel_assessment_request(
    request_id: str,
    current_doctor: dict = Depends(get_current_doctor),
    service: AssessmentService = Depends(_get_service),
) -> None:
    """Cancel a pending assessment request (doctor only)."""
    service.cancel_request(current_doctor["doctor_id"], request_id)


@assessments_router.get(
    "/patient/{patient_id}",
    response_model=list[AssessmentResponse],
)
def list_patient_assessments(
    patient_id: str,
    assessment_type: Optional[str] = Query(None, description="PHQ9 | GAD7"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_doctor: dict = Depends(get_current_doctor),
    service: AssessmentService = Depends(_get_service),
) -> list[AssessmentResponse]:
    """List a patient's completed assessments visible to the requesting doctor."""
    return service.list_for_doctor_patient(
        current_doctor["doctor_id"], patient_id, assessment_type, page, size
    )


# ---------------------------------------------------------------------------
# 5. Bare list root — before /{assessment_id} wildcard
# ---------------------------------------------------------------------------

@assessments_router.get("", response_model=list[AssessmentResponse])
def get_all_assessments(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    service: AssessmentService = Depends(_get_service),
) -> list[AssessmentResponse]:
    """List the authenticated patient's completed assessments (alias for /history)."""
    return service.list_for_patient(current_user["user_id"], page, size)


# ---------------------------------------------------------------------------
# 6. Bare wildcard — MUST be absolutely last to avoid shadowing everything above
# ---------------------------------------------------------------------------

@assessments_router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: str,
    current_user: dict = Depends(get_current_user),
    service: AssessmentService = Depends(_get_service),
) -> AssessmentResponse:
    """Retrieve a single completed assessment by ID (patient must own it)."""
    return service.get_assessment(current_user["user_id"], assessment_id)

"""
Wellness Forms router.

Thin HTTP adapter: dependency wiring, auth, routing only.
All business logic lives in WellnessFormService.
Heavy AI generation is dispatched as BackgroundTask to prevent blocking responses.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session
from fastapi import HTTPException

from server.config.settings import settings
from server.db.session import get_db
from server.db.repositories.user_repo import DoctorRepository, RelationshipRepository, UserRepository
from server.db.repositories.wellness_form_repo import WellnessFormRepository
from server.features.auth.dependencies import (
    get_current_doctor,
    get_current_user_or_doctor,
)
from server.features.wellness_forms.ai_generator import WellnessFormAIGenerator
from server.features.wellness_forms.schemas import (
    AIInsightsResponse,
    SendAIReportRequest,
    WellnessFormCreate,
    WellnessFormResponse,
    WellnessFormUpdate,
)
from server.features.wellness_forms.service import WellnessFormService
from server.features.notifications.service import NotificationService
from server.db.repositories.notification_repo import NotificationRepository
from server.infra.openai.client import generate_completion

wellness_forms_router = APIRouter(prefix="/wellness-forms", tags=["wellness-forms"])


class _OpenAIAdapter:
    """Adapts the module-level generate_completion function to the interface
    expected by WellnessFormAIGenerator (client.generate_completion(messages, model=..., ...))."""

    async def generate_completion(self, messages, model: str = "gpt-4o-mini", **kwargs):
        return await generate_completion(messages, model=model, **kwargs)


_openai_adapter = _OpenAIAdapter()


def _get_ai_generator() -> WellnessFormAIGenerator:
    return WellnessFormAIGenerator(openai_client=_openai_adapter, model=settings.openai_model)


def _get_service(
    db: Session = Depends(get_db),
    ai_generator: WellnessFormAIGenerator = Depends(_get_ai_generator),
) -> WellnessFormService:
    return WellnessFormService(
        repo=WellnessFormRepository(db),
        user_repo=UserRepository(db),
        doctor_repo=DoctorRepository(db),
        rel_repo=RelationshipRepository(db),
        ai_generator=ai_generator,
        notification_svc=NotificationService(repo=NotificationRepository(db)),
    )


@wellness_forms_router.post("", response_model=WellnessFormResponse, status_code=201)
async def create_wellness_form(
    payload: WellnessFormCreate,
    bg_tasks: BackgroundTasks,
    current_doctor: dict = Depends(get_current_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> WellnessFormResponse:
    """
    Create a new wellness form (Doctor only).
    Doctor must be connected to the patient.
    AI insights generation is enqueued asynchronously.
    """
    form = service.create_form(current_doctor["doctor_id"], payload)
    if payload.status == "submitted":
        bg_tasks.add_task(service.trigger_ai_generation, form.form_id)
    return form


@wellness_forms_router.get("", response_model=list[WellnessFormResponse])
def list_wellness_forms(
    patient_id: Optional[str] = Query(None, description="Filter by patient user_id"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_doctor: dict = Depends(get_current_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> list[WellnessFormResponse]:
    """List wellness forms created by the current doctor, optionally filtered by patient."""
    return service.list_doctor_forms(current_doctor["doctor_id"], patient_id, page, size)


@wellness_forms_router.get("/mine", response_model=list[WellnessFormResponse])
def list_my_forms(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user_or_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> list[WellnessFormResponse]:
    """List wellness forms for the current patient (user role only)."""
    if current_user.get("role") == "doctor":
        return service.list_doctor_forms(current_user["doctor_id"], None, page, size)
    return service.list_user_forms(current_user["user_id"], page, size)


@wellness_forms_router.get("/user/{user_id}", response_model=list[WellnessFormResponse])
def list_forms_by_user(
    user_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user_or_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> list[WellnessFormResponse]:
    """List wellness forms for a specific patient. Users may only access their own forms."""
    role = current_user.get("role")
    if role == "user" and current_user.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access these records")
    return service.list_user_forms(user_id, page, size)


@wellness_forms_router.get("/{form_id}", response_model=WellnessFormResponse)
def get_wellness_form(
    form_id: str,
    current_user: dict = Depends(get_current_user_or_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> WellnessFormResponse:
    """Retrieve a specific wellness form. Users can view their own; doctors can view patients' forms."""
    return service.get_form(form_id, current_user)


@wellness_forms_router.put("/{form_id}", response_model=WellnessFormResponse)
async def update_wellness_form(
    form_id: str,
    payload: WellnessFormUpdate,
    bg_tasks: BackgroundTasks,
    current_doctor: dict = Depends(get_current_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> WellnessFormResponse:
    """
    Update a wellness form (owning doctor only).
    If form_data changed, re-enqueues AI insights generation.
    """
    form = service.update_form(current_doctor["doctor_id"], form_id, payload)
    if form.ai_generation_status == "pending":
        bg_tasks.add_task(service.trigger_ai_generation, form.form_id)
    return form


@wellness_forms_router.delete("/{form_id}", status_code=204)
def delete_wellness_form(
    form_id: str,
    current_doctor: dict = Depends(get_current_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> None:
    """Soft-delete a wellness form (owning doctor only)."""
    service.delete_form(current_doctor["doctor_id"], form_id)


@wellness_forms_router.get("/{form_id}/ai-summary", response_model=AIInsightsResponse)
def get_ai_summary(
    form_id: str,
    current_user: dict = Depends(get_current_user_or_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> AIInsightsResponse:
    """
    Get AI-generated insights for a wellness form.
    Users see patient-friendly summary only (once report sent).
    Doctors see both clinical and patient summaries.
    """
    return service.get_ai_summary(form_id, current_user)


@wellness_forms_router.delete("/{form_id}/ai-summary", status_code=204)
def delete_ai_summary(
    form_id: str,
    current_user: dict = Depends(get_current_user_or_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> None:
    """Clear the AI summary data for a wellness form (owning doctor or patient)."""
    service.delete_ai_summary(form_id, current_user)


@wellness_forms_router.post("/{form_id}/regenerate-ai", response_model=WellnessFormResponse)
async def regenerate_ai_insights(
    form_id: str,
    bg_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user_or_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> WellnessFormResponse:
    """Force re-generation of AI insights for an existing form."""
    form = service.start_regenerate_ai(form_id, current_user)
    bg_tasks.add_task(service.trigger_ai_generation, form_id)
    return form


@wellness_forms_router.post("/{form_id}/send-ai-report-to-patient", status_code=200)
def send_ai_report_to_patient(
    form_id: str,
    request: Optional[SendAIReportRequest] = None,
    current_doctor: dict = Depends(get_current_doctor),
    service: WellnessFormService = Depends(_get_service),
) -> dict[str, str]:
    """Send AI report to patient after doctor review (Doctor only)."""
    edited_summary = request.edited_patient_summary if request else None
    service.send_report_to_patient(current_doctor["doctor_id"], form_id, edited_summary)
    return {"message": "AI report sent to patient", "form_id": form_id, "status": "sent_to_patient"}

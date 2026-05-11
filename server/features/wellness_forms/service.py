"""
Wellness Forms service.

Single responsibility: form CRUD + AI insights orchestration.
Dependency direction: Service → Repository, Service → AI generator.
Heavy AI generation is offloaded to BackgroundTasks — never blocks HTTP.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from loguru import logger

from server.db.models.user import Doctor
from server.db.models.wellness_form import MentalWellnessForm
from server.db.repositories.user_repo import DoctorRepository, RelationshipRepository, UserRepository
from server.db.repositories.wellness_form_repo import WellnessFormRepository
from server.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from server.features.notifications.service import NotificationService
from server.features.wellness_forms.ai_generator import WellnessFormAIGenerator
from server.features.wellness_forms.schemas import (
    AIInsightsResponse,
    WellnessFormCreate,
    WellnessFormResponse,
    WellnessFormUpdate,
)


def _fmt_dt(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def _to_response(form: MentalWellnessForm, doctor: Optional[Doctor] = None) -> WellnessFormResponse:
    return WellnessFormResponse(
        form_id=form.form_id,
        user_id=form.user_id,
        doctor_id=form.doctor_id,
        doctor_name=doctor.name if doctor else None,
        doctor_email=doctor.email if doctor else None,
        doctor_specialty=doctor.specialty if doctor else None,
        client_name=form.client_name,
        form_date=form.form_date.isoformat(),
        form_data=form.form_data,
        status=form.status,
        ai_generation_status=form.ai_generation_status,
        ai_summary_clinical=form.ai_summary_clinical,
        ai_summary_patient=form.ai_summary_patient,
        ai_patterns_detected=form.ai_patterns_detected,
        ai_generated_at=_fmt_dt(form.ai_generated_at),
        ai_model_version=form.ai_model_version,
        ai_report_status=form.ai_report_status,
        ai_report_sent_at=_fmt_dt(form.ai_report_sent_at),
        ai_error_message=form.ai_error_message,
        submitted_at=_fmt_dt(form.submitted_at),
        created_at=form.created_at.isoformat(),
        updated_at=form.updated_at.isoformat(),
    )


class WellnessFormService:
    def __init__(
        self,
        repo: WellnessFormRepository,
        user_repo: UserRepository,
        doctor_repo: DoctorRepository,
        rel_repo: RelationshipRepository,
        ai_generator: WellnessFormAIGenerator,
        notification_svc: NotificationService,
    ) -> None:
        self._repo = repo
        self._user_repo = user_repo
        self._doctor_repo = doctor_repo
        self._rel_repo = rel_repo
        self._ai = ai_generator
        self._notif = notification_svc

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def create_form(self, doctor_id: str, payload: WellnessFormCreate) -> WellnessFormResponse:
        user = self._user_repo.find_by_user_id(payload.user_id)
        if not user:
            raise NotFoundError(f"User not found: {payload.user_id}")

        rel = self._rel_repo.find_active(payload.user_id, doctor_id)
        if not rel:
            raise ForbiddenError(
                "You are not connected to this user. The user must connect to you first."
            )

        form_id = str(uuid.uuid4())
        form_date = datetime.fromisoformat(payload.form_date).date()
        status = payload.status or "submitted"
        data_hash = self._ai.form_data_hash(payload.form_data)

        form = self._repo.create({
            "form_id": form_id,
            "user_id": payload.user_id,
            "doctor_id": doctor_id,
            "client_name": payload.client_name.strip(),
            "form_date": form_date,
            "form_data": payload.form_data,
            "form_data_hash": data_hash,
            "status": status,
            "ai_generation_status": "pending" if status == "submitted" else "pending",
            "ai_summary_version": 0,
            "ai_report_status": "pending_review",
            "submitted_at": datetime.utcnow() if status == "submitted" else None,
        })
        logger.info("wellness_form_created", extra={"doctor_id": doctor_id, "form_id": form_id})

        doctor = self._doctor_repo.find_by_doctor_id(doctor_id)
        self._notif.notify_wellness_form_created(
            user_id=payload.user_id,
            doctor_name=doctor.name if doctor else "Your doctor",
            form_id=form_id,
            client_name=payload.client_name.strip(),
        )
        return _to_response(form, doctor)

    def update_form(
        self, doctor_id: str, form_id: str, payload: WellnessFormUpdate
    ) -> WellnessFormResponse:
        form = self._get_owned_form(form_id, doctor_id)
        update_data: dict[str, Any] = {}

        if payload.client_name is not None:
            update_data["client_name"] = payload.client_name.strip()
        if payload.form_date is not None:
            update_data["form_date"] = datetime.fromisoformat(payload.form_date).date()
        if payload.status is not None:
            update_data["status"] = payload.status
            if payload.status == "submitted" and not form.submitted_at:
                update_data["submitted_at"] = datetime.utcnow()

        if payload.form_data is not None:
            new_hash = self._ai.form_data_hash(payload.form_data)
            if new_hash != form.form_data_hash:
                update_data["form_data"] = payload.form_data
                update_data["form_data_hash"] = new_hash
                update_data["ai_generation_status"] = "pending"

        if not update_data:
            doctor = self._doctor_repo.find_by_doctor_id(doctor_id)
            return _to_response(form, doctor)

        updated = self._repo.update(form.id, update_data)
        logger.info("wellness_form_updated", extra={"doctor_id": doctor_id, "form_id": form_id})
        doctor = self._doctor_repo.find_by_doctor_id(doctor_id)
        return _to_response(updated, doctor)

    def delete_form(self, doctor_id: str, form_id: str) -> None:
        form = self._get_owned_form(form_id, doctor_id)
        self._repo.update(form.id, {"status": "deleted"})
        logger.info("wellness_form_deleted", extra={"doctor_id": doctor_id, "form_id": form_id})

    def get_form(self, form_id: str, requester: dict) -> WellnessFormResponse:
        form = self._repo.find_by_form_id(form_id)
        if not form or form.status == "deleted":
            raise NotFoundError("Wellness form not found")

        role = requester.get("role")
        if role == "user":
            if form.user_id != requester.get("user_id"):
                raise ForbiddenError("You can only view your own wellness forms")
        elif role == "doctor":
            doctor_id = requester.get("doctor_id", "")
            if form.doctor_id != doctor_id:
                rel = self._rel_repo.find_active(form.user_id, doctor_id)
                if not rel:
                    raise ForbiddenError("You can only view wellness forms for your connected patients")

        doctor = self._doctor_repo.find_by_doctor_id(form.doctor_id)
        return _to_response(form, doctor)

    def list_doctor_forms(
        self, doctor_id: str, patient_id: Optional[str], page: int, size: int
    ) -> list[WellnessFormResponse]:
        if patient_id:
            forms = self._repo.list_by_doctor_patient(doctor_id, patient_id, page, size)
        else:
            forms = self._repo.list_by_doctor(doctor_id, page, size)
        doctor = self._doctor_repo.find_by_doctor_id(doctor_id)
        return [_to_response(f, doctor) for f in forms if f.status != "deleted"]

    def list_user_forms(self, user_id: str, page: int, size: int) -> list[WellnessFormResponse]:
        forms = self._repo.list_by_user(user_id, page, size)
        results = []
        for form in forms:
            if form.status == "deleted":
                continue
            doctor = self._doctor_repo.find_by_doctor_id(form.doctor_id)
            results.append(_to_response(form, doctor))
        return results

    # ------------------------------------------------------------------
    # AI insights
    # ------------------------------------------------------------------

    async def trigger_ai_generation(self, form_id: str) -> None:
        """Background task: generate AI insights and persist results."""
        form = self._repo.find_by_form_id(form_id)
        if not form or form.status == "deleted":
            logger.warning("wellness_ai_bg_form_missing", extra={"form_id": form_id})
            return

        # Guard: don't double-process
        if form.ai_generation_status == "processing":
            logger.warning("wellness_ai_already_processing", extra={"form_id": form_id})
            return

        self._repo.update(form.id, {"ai_generation_status": "processing"})

        # Verify connection still active
        rel = self._rel_repo.find_active(form.user_id, form.doctor_id)
        if not rel:
            self._repo.update(form.id, {
                "ai_generation_status": "failed",
                "ai_error_message": "Doctor-patient connection no longer active",
            })
            return

        previous = self._repo.list_by_doctor_patient(form.doctor_id, form.user_id, page=1, size=5)
        prev_data = [
            {"form_date": str(p.form_date), "form_data": p.form_data}
            for p in previous
            if p.form_id != form_id and p.status != "deleted"
        ]

        result = await self._ai.generate_insights(form.form_data, prev_data)
        if not result:
            self._repo.update(form.id, {
                "ai_generation_status": "failed",
                "ai_error_message": "AI generation returned empty result",
            })
            logger.error("wellness_ai_insights_empty", extra={"form_id": form_id})
            return

        self._repo.update(form.id, {
            "ai_summary_clinical": result.clinical_summary,
            "ai_summary_patient": result.patient_summary,
            "ai_patterns_detected": {
                "mood_trend": result.patterns.mood_trend,
                "severity_change": result.patterns.severity_change,
                "correlations": result.patterns.correlations,
                "risk_indicators": result.patterns.risk_indicators,
                "protective_factors": result.patterns.protective_factors,
                "progression": result.patterns.progression,
                "severity_score": result.patterns.severity_score,
            },
            "ai_generated_at": result.generated_at,
            "ai_model_version": result.model_version,
            "ai_generation_status": "completed",
            "ai_summary_version": (form.ai_summary_version or 0) + 1,
            "ai_error_message": None,
        })
        logger.info("wellness_ai_insights_completed", extra={"form_id": form_id})

    def get_ai_summary(self, form_id: str, requester: dict) -> AIInsightsResponse:
        form = self._repo.find_by_form_id(form_id)
        if not form or form.status == "deleted":
            raise NotFoundError("Wellness form not found")

        role = requester.get("role")
        if role == "user":
            if form.user_id != requester.get("user_id"):
                raise ForbiddenError("You can only view your own wellness forms")
        elif role == "doctor":
            doctor_id = requester.get("doctor_id", "")
            if form.doctor_id != doctor_id:
                rel = self._rel_repo.find_active(form.user_id, doctor_id)
                if not rel:
                    raise ForbiddenError("You can only view wellness forms for your connected patients")

        is_doctor = role == "doctor"
        ai_report_status = form.ai_report_status or "pending_review"
        report_sent = ai_report_status == "sent_to_patient"

        # Patients only see patient summary once report is sent
        patient_summary = form.ai_summary_patient if (is_doctor or report_sent) else None
        clinical_summary = form.ai_summary_clinical if is_doctor else None
        patterns = form.ai_patterns_detected if (is_doctor or report_sent) else None

        return AIInsightsResponse(
            form_id=form.form_id,
            ai_generation_status=form.ai_generation_status or "pending",
            clinical_summary=clinical_summary,
            patient_summary=patient_summary,
            patterns_detected=patterns,
            generated_at=_fmt_dt(form.ai_generated_at),
            model_version=form.ai_model_version,
            error_message=form.ai_error_message,
            client_name=form.client_name,
            form_date=form.form_date.isoformat() if form.form_date else None,
            ai_report_status=ai_report_status,
            ai_report_sent_at=_fmt_dt(form.ai_report_sent_at),
        )

    def delete_ai_summary(self, form_id: str, requester: dict) -> None:
        form = self._repo.find_by_form_id(form_id)
        if not form or form.status == "deleted":
            raise NotFoundError("Wellness form not found")

        role = requester.get("role")
        if role == "doctor" and form.doctor_id != requester.get("doctor_id"):
            raise ForbiddenError("You can only delete AI summaries for your own forms")
        if role == "user" and form.user_id != requester.get("user_id"):
            raise ForbiddenError("You can only delete AI summaries for your own forms")

        self._repo.update(form.id, {
            "ai_summary_clinical": None,
            "ai_summary_patient": None,
            "ai_patterns_detected": None,
            "ai_generation_status": "pending",
            "ai_generated_at": None,
            "ai_model_version": None,
            "ai_error_message": None,
        })
        logger.info("wellness_ai_summary_deleted", extra={"form_id": form_id, "role": role})

    def send_report_to_patient(
        self, doctor_id: str, form_id: str, edited_patient_summary: Optional[str] = None
    ) -> None:
        form = self._get_owned_form(form_id, doctor_id)
        if form.ai_generation_status != "completed":
            raise ValidationError("AI insights must be generated before sending to patient")

        update_data: dict[str, Any] = {
            "ai_report_status": "sent_to_patient",
            "ai_report_sent_at": datetime.utcnow(),
            "ai_report_sent_by": doctor_id,
        }
        if edited_patient_summary:
            update_data["ai_summary_patient"] = edited_patient_summary

        self._repo.update(form.id, update_data)
        doctor = self._doctor_repo.find_by_doctor_id(doctor_id)
        self._notif.notify_ai_report_sent(
            user_id=form.user_id,
            doctor_name=doctor.name if doctor else "Your doctor",
            form_id=form_id,
            client_name=form.client_name,
        )
        logger.info("wellness_ai_report_sent", extra={
            "doctor_id": doctor_id, "form_id": form_id, "patient_id": form.user_id
        })

    def start_regenerate_ai(self, form_id: str, requester: dict) -> WellnessFormResponse:
        form = self._repo.find_by_form_id(form_id)
        if not form or form.status == "deleted":
            raise NotFoundError("Wellness form not found")

        role = requester.get("role")
        if role == "doctor" and form.doctor_id != requester.get("doctor_id"):
            raise ForbiddenError("You can only regenerate AI for your own forms")
        if role == "user" and form.user_id != requester.get("user_id"):
            raise ForbiddenError("You can only regenerate AI for your own forms")

        if form.ai_generation_status == "processing":
            raise ConflictError("AI generation is already in progress. Please wait for it to complete.")

        updated = self._repo.update(form.id, {"ai_generation_status": "pending"})
        doctor = self._doctor_repo.find_by_doctor_id(form.doctor_id)
        return _to_response(updated, doctor)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _get_owned_form(self, form_id: str, doctor_id: str) -> MentalWellnessForm:
        form = self._repo.find_by_form_id(form_id)
        if not form or form.status == "deleted":
            raise NotFoundError("Wellness form not found")
        if form.doctor_id != doctor_id:
            raise ForbiddenError("You can only manage wellness forms you created")
        return form

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select, union_all
from loguru import logger

from server.db.models.analysis import AnalysisRecord
from server.db.models.audio_analysis import AudioAnalysisSession
from server.db.models.video_analysis import VideoAnalysisSession
from server.db.models.user import UserDoctorRelationship, UserProfile
from server.db.repositories.analysis_repo import AnalysisRepository
from server.db.repositories.user_repo import (
    DoctorRepository,
    RelationshipRepository,
    UserRepository,
)
from server.exceptions import ConflictError, ForbiddenError, NotFoundError
from server.features.notifications.service import NotificationService
from server.features.user_profile.schemas import (
    ConnectDoctorRequest,
    UserProfileRequest,
    UserProfileResponse,
    UserProfileStats,
    ConnectedDoctorResponse,
    DoctorInfo,
)


_PROFILE_WRITE_FIELDS = frozenset({
    "name", "location", "first_name", "last_name",
    "phone", "date_of_birth", "gender",
    "emergency_contact_name", "emergency_contact_phone",
})


def _to_response(
    user: UserProfile,
    total_analyses: int = 0,
    connected_doctor_id: str | None = None,
) -> UserProfileResponse:
    dob = user.date_of_birth
    dob_str = dob.isoformat() if isinstance(dob, date) else dob
    return UserProfileResponse(
        user_id=user.user_id,
        email=user.email or "",
        name=user.name,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        date_of_birth=dob_str,
        gender=user.gender,
        emergency_contact_name=user.emergency_contact_name,
        emergency_contact_phone=user.emergency_contact_phone,
        location=user.location,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        total_analyses=total_analyses,
        connected_doctor_id=connected_doctor_id,
    )


class UserProfileService:
    def __init__(
        self,
        user_repo: UserRepository,
        doctor_repo: DoctorRepository,
        rel_repo: RelationshipRepository,
        analysis_repo: AnalysisRepository,
        notification_svc: NotificationService,
    ) -> None:
        self._users = user_repo
        self._doctors = doctor_repo
        self._rels = rel_repo
        self._analyses = analysis_repo
        self._db = analysis_repo.db
        self._notif = notification_svc

    def get_profile_stats(self, user_id: str) -> UserProfileStats:
        """Return per-modality counts and most frequent emotion across all modalities."""
        text_count: int = self._db.execute(
            select(func.count()).select_from(AnalysisRecord).where(AnalysisRecord.user_id == user_id)
        ).scalar_one() or 0

        speech_count: int = self._db.execute(
            select(func.count()).select_from(AudioAnalysisSession).where(AudioAnalysisSession.user_id == user_id)
        ).scalar_one() or 0

        video_count: int = self._db.execute(
            select(func.count()).select_from(VideoAnalysisSession).where(VideoAnalysisSession.user_id == user_id)
        ).scalar_one() or 0

        # Most frequent emotion: union all prediction labels across modalities
        emotion_union = union_all(
            select(AnalysisRecord.prediction_label.label("emotion")).where(AnalysisRecord.user_id == user_id),
            select(func.coalesce(AudioAnalysisSession.dominant_emotion, "neutral").label("emotion")).where(AudioAnalysisSession.user_id == user_id),
            select(func.coalesce(VideoAnalysisSession.dominant_emotion, "neutral").label("emotion")).where(VideoAnalysisSession.user_id == user_id),
        ).subquery()

        top_row = self._db.execute(
            select(emotion_union.c.emotion, func.count().label("cnt"))
            .group_by(emotion_union.c.emotion)
            .order_by(func.count().desc())
            .limit(1)
        ).first()

        most_frequent = top_row[0] if top_row else "N/A"

        return UserProfileStats(
            total_analyses=text_count + speech_count + video_count,
            text_count=text_count,
            video_count=video_count,
            audio_count=speech_count,
            most_frequent_emotion=most_frequent,
        )

    def get_profile(self, user_id: str) -> UserProfileResponse:
        user = self._users.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User profile not found")
        analyses_count = self._analyses.count_by_user(user_id)
        active_rel = self._rels.find_any_active_for_user(user_id)
        doctor_id = active_rel.doctor_id if active_rel else None
        return _to_response(user, analyses_count, doctor_id)

    def save_profile(self, user_id: str, payload: UserProfileRequest) -> UserProfileResponse:
        user = self._users.find_by_user_id(user_id)
        if not user:
            raise NotFoundError("User profile not found")

        update: dict = {}
        raw = payload.model_dump(exclude_unset=True)
        for key, val in raw.items():
            if key in _PROFILE_WRITE_FIELDS and val is not None:
                update[key] = val

        if update:
            self._users.update(user.id, update)
            user = self._users.find_by_user_id(user_id)

        logger.info("user_profile_saved", extra={"user_id": user_id})
        analyses_count = self._analyses.count_by_user(user_id)
        active_rel = self._rels.find_any_active_for_user(user_id)
        doctor_id = active_rel.doctor_id if active_rel else None
        return _to_response(user, analyses_count, doctor_id)

    def get_connected_doctor(self, user_id: str) -> ConnectedDoctorResponse:
        active_rel = self._rels.find_any_active_for_user(user_id)
        if not active_rel:
            return ConnectedDoctorResponse(connected=False)
        doctor = self._doctors.find_by_doctor_id(active_rel.doctor_id)
        if not doctor:
            return ConnectedDoctorResponse(connected=False)
        return ConnectedDoctorResponse(
            connected=True,
            doctor=DoctorInfo(
                doctor_id=doctor.doctor_id,
                name=doctor.name,
                email=doctor.email,
                specialty=getattr(doctor, "specialty", None),
                license_number=getattr(doctor, "license_number", None),
            )
        )

    def connect_doctor(self, user_id: str, payload: ConnectDoctorRequest) -> UserProfileResponse:
        if payload.doctor_code:
            doctor = self._doctors.find_by_doctor_code(payload.doctor_code)
            connection_method = "code"
        else:
            doctor = self._doctors.find_by_email(payload.doctor_email)
            connection_method = "email"

        if not doctor:
            cause = "code" if payload.doctor_code else "email"
            raise NotFoundError(f"Doctor {cause} not found")

        existing = self._rels.find_by_user_and_doctor(user_id, doctor.doctor_id)
        if existing:
            if existing.status == "active":
                raise ConflictError("Already connected to this doctor")
            self._rels.update(existing.id, {
                "status": "active",
                "connection_method": connection_method,
            })
        else:
            self._rels.create(
                UserDoctorRelationship(
                    user_id=user_id,
                    doctor_id=doctor.doctor_id,
                    status="active",
                    connection_method=connection_method,
                )
            )
        logger.info("user_connected_doctor", extra={"user_id": user_id, "doctor_id": doctor.doctor_id})
        user = self._users.find_by_user_id(user_id)
        self._notif.notify_user_connected_to_doctor(
            user_id=user_id, doctor_name=doctor.name or "your doctor"
        )
        self._notif.notify_doctor_user_connected(
            doctor_id=doctor.doctor_id,
            user_name=user.name if user else "A patient",
        )
        return self.get_profile(user_id)

    def disconnect_doctor(self, user_id: str) -> None:
        active_rel = self._rels.find_any_active_for_user(user_id)
        if not active_rel:
            raise NotFoundError("No active doctor connection found")
        if active_rel.user_id != user_id:
            raise ForbiddenError("Cannot disconnect another user's relationship")

        active_doctor = self._doctors.find_by_doctor_id(active_rel.doctor_id)
        self._rels.update(active_rel.id, {"status": "inactive"})
        logger.info("user_disconnected_doctor", extra={"user_id": user_id})
        user = self._users.find_by_user_id(user_id)
        self._notif.notify_user_disconnected(
            user_id=user_id,
            doctor_name=active_doctor.name if active_doctor else "your doctor",
        )
        self._notif.notify_doctor_user_disconnected(
            doctor_id=active_rel.doctor_id,
            user_name=user.name if user else "A patient",
        )

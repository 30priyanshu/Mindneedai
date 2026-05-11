"""
Dashboard service.

Single responsibility: aggregate stats queries for user and doctor dashboards.
Multi-repo; all DB calls are batched to avoid N+1.

Failure modes handled:
- Any repo call returns empty / zero  → graceful zero-value response (never 500)
- MoodEntry table has no entries      → weekly_avg_mood returned as None
"""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from server.db.models.analysis import AnalysisRecord
from server.db.models.mood import MoodEntry
from server.db.models.user import UserDoctorRelationship
from server.db.models.wellness_form import MentalWellnessForm
from server.features.dashboard.schemas import (
    DoctorDashboardStats,
    RecentAnalysis,
    UserDashboardStats,
    RecentFormSummary,
)


class DashboardService:
    """
    Owns all dashboard read-only aggregations.
    Receives a raw Session so it can compose multi-table queries efficiently.
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # ── User ─────────────────────────────────────────────────────────────────

    def get_user_stats(self, user_id: str) -> UserDashboardStats:
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)

        # Query 1: all-time total
        total: int = self._db.execute(
            select(func.count(AnalysisRecord.id)).where(
                AnalysisRecord.user_id == user_id
            )
        ).scalar_one() or 0

        # Query 2: this-week count
        this_week: int = self._count_week_analyses(user_id, week_ago)

        # Query 3: streak (single distinct-date scan)
        streak: int = self._compute_streak(user_id, now)

        # Query 4: weekly avg mood
        avg_mood: float | None = self._weekly_avg_mood(user_id, week_ago)

        return UserDashboardStats(
            total_analyses=total,
            this_week_count=this_week,
            streak_days=streak,
            weekly_avg_mood=avg_mood,
        )


    def _count_week_analyses(self, user_id: str, week_ago: datetime) -> int:
        result = self._db.execute(
            select(func.count(AnalysisRecord.id)).where(
                AnalysisRecord.user_id == user_id,
                AnalysisRecord.created_at >= week_ago,
            )
        ).scalar_one()
        return result or 0

    def _compute_streak(self, user_id: str, now: datetime) -> int:
        """
        Streak = consecutive calendar days (going backwards from today) on which
        the user has at least one analysis record.  Single query: fetch distinct
        dates for the last 365 days, then count the leading run.
        """
        cutoff = now - timedelta(days=365)
        rows = self._db.execute(
            select(func.date(AnalysisRecord.created_at).label("day"))
            .where(
                AnalysisRecord.user_id == user_id,
                AnalysisRecord.created_at >= cutoff,
            )
            .distinct()
            .order_by(func.date(AnalysisRecord.created_at).desc())
        ).scalars().all()

        if not rows:
            return 0

        today = now.date()
        streak = 0
        for day in rows:
            expected = today - timedelta(days=streak)
            if day == expected:
                streak += 1
            else:
                break
        return streak

    def _weekly_avg_mood(self, user_id: str, week_ago: datetime) -> float | None:
        result = self._db.execute(
            select(func.avg(MoodEntry.score)).where(
                MoodEntry.user_id == user_id,
                MoodEntry.date >= week_ago.date(),
            )
        ).scalar_one()
        return float(round(float(result), 2)) if result is not None else None


    def get_recent_analyses(self, user_id: str, limit: int = 5) -> list[RecentAnalysis]:
        limit = max(1, min(limit, 20))
        rows = self._db.execute(
            select(
                AnalysisRecord.request_id,
                AnalysisRecord.prediction_label,
                AnalysisRecord.confidence,
                AnalysisRecord.created_at,
                AnalysisRecord.analysis_metadata,
            )
            .where(AnalysisRecord.user_id == user_id)
            .order_by(AnalysisRecord.created_at.desc())
            .limit(limit)
        ).all()

        return [
            RecentAnalysis(
                id=r.request_id,
                type=self._resolve_type(r.analysis_metadata),
                emotion=r.prediction_label,
                confidence=r.confidence,
                timestamp=r.created_at.isoformat() if r.created_at else None,
            )
            for r in rows
        ]

    def _resolve_type(self, metadata: dict | None) -> str:
        if not metadata:
            return "text"
        return metadata.get("analysis_type", "text")

    # ── Doctor ────────────────────────────────────────────────────────────────

    def get_doctor_stats(self, doctor_id: str) -> DoctorDashboardStats:
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        # 2 queries: patient counts + form counts (batched, no N+1)
        total_patients, recent_patients = self._patient_counts(
            doctor_id, thirty_days_ago
        )
        total_forms, recent_forms = self._form_counts(doctor_id, seven_days_ago)

        return DoctorDashboardStats(
            total_patients=total_patients,
            recent_patients_count=recent_patients,
            total_forms=total_forms,
            recent_forms_count=recent_forms,
        )

    def _patient_counts(
        self, doctor_id: str, cutoff: datetime
    ) -> tuple[int, int]:
        total = self._db.execute(
            select(func.count(UserDoctorRelationship.id)).where(
                UserDoctorRelationship.doctor_id == doctor_id,
                UserDoctorRelationship.status == "active",
            )
        ).scalar_one() or 0

        recent = self._db.execute(
            select(func.count(UserDoctorRelationship.id)).where(
                UserDoctorRelationship.doctor_id == doctor_id,
                UserDoctorRelationship.status == "active",
                UserDoctorRelationship.connected_at >= cutoff,
            )
        ).scalar_one() or 0

        return total, recent

    def _form_counts(
        self, doctor_id: str, cutoff: datetime
    ) -> tuple[int, int]:
        total = self._db.execute(
            select(func.count(MentalWellnessForm.id)).where(
                MentalWellnessForm.doctor_id == doctor_id
            )
        ).scalar_one() or 0

        recent = self._db.execute(
            select(func.count(MentalWellnessForm.id)).where(
                MentalWellnessForm.doctor_id == doctor_id,
                MentalWellnessForm.created_at >= cutoff,
            )
        ).scalar_one() or 0

        return total, recent

    def get_recent_forms(self, doctor_id: str, limit: int = 5) -> list[RecentFormSummary]:
        limit = max(1, min(limit, 20))
        rows = self._db.execute(
            select(
                MentalWellnessForm.form_id,
                MentalWellnessForm.client_name,
                MentalWellnessForm.form_date,
                MentalWellnessForm.status,
                MentalWellnessForm.ai_generation_status,
            )
            .where(MentalWellnessForm.doctor_id == doctor_id)
            .order_by(MentalWellnessForm.created_at.desc())
            .limit(limit)
        ).all()

        return [
            RecentFormSummary(
                id=r.form_id,
                client_name=r.client_name,
                form_date=r.form_date.isoformat() if r.form_date else None,
                status=r.status,
                ai_status=r.ai_generation_status,
            )
            for r in rows
        ]

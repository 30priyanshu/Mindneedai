from datetime import datetime
from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from server.db.models.assessment import Assessment, AssessmentRequest
from server.db.repositories.base import BaseRepository


class AssessmentRepository(BaseRepository[Assessment]):
    def __init__(self, db: Session):
        super().__init__(Assessment, db)

    def find_by_assessment_id(self, assessment_id: str) -> Assessment | None:
        stmt = select(Assessment).where(Assessment.assessment_id == assessment_id).limit(1)
        return self.db.scalar(stmt)

    def find_by_user_month(
        self, user_id: str, assessment_type: str, month: int, year: int
    ) -> Assessment | None:
        stmt = (
            select(Assessment)
            .where(
                Assessment.user_id == user_id,
                Assessment.assessment_type == assessment_type,
                extract("year", Assessment.created_at) == year,
                extract("month", Assessment.created_at) == month,
            )
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_doctor_patient(
        self,
        doctor_id: str,
        patient_id: str,
        assessment_type: str | None = None,
        page: int = 1,
        size: int = 50,
    ) -> list[Assessment]:
        skip = (page - 1) * size
        filters = [
            Assessment.user_id == patient_id,
            Assessment.assessment_request_id.in_(
                select(AssessmentRequest.request_id).where(
                    AssessmentRequest.doctor_id == doctor_id,
                    AssessmentRequest.patient_id == patient_id,
                )
            ),
        ]
        if assessment_type:
            filters.append(Assessment.assessment_type == assessment_type)
        stmt = (
            select(Assessment)
            .where(*filters)
            .order_by(Assessment.created_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def list_by_user(self, user_id: str, page: int, size: int) -> list[Assessment]:
        skip = (page - 1) * size
        stmt = (
            select(Assessment)
            .where(Assessment.user_id == user_id)
            .order_by(Assessment.created_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def get_user_assessments(
        self, user_id: str, assessment_type: str | None = None, page: int = 1, size: int = 50
    ) -> list[Assessment]:
        skip = (page - 1) * size
        stmt = select(Assessment).where(Assessment.user_id == user_id)
        if assessment_type:
            stmt = stmt.where(Assessment.assessment_type == assessment_type)
        stmt = stmt.order_by(Assessment.created_at.desc()).offset(skip).limit(size)
        return list(self.db.scalars(stmt).all())


class AssessmentRequestRepository(BaseRepository[AssessmentRequest]):
    def __init__(self, db: Session):
        super().__init__(AssessmentRequest, db)

    def find_by_request_id(self, request_id: str) -> AssessmentRequest | None:
        stmt = select(AssessmentRequest).where(AssessmentRequest.request_id == request_id).limit(1)
        return self.db.scalar(stmt)

    def find_pending_for_patient(self, patient_id: str) -> list[AssessmentRequest]:
        now = datetime.utcnow()
        stmt = (
            select(AssessmentRequest)
            .where(
                AssessmentRequest.patient_id == patient_id,
                AssessmentRequest.status == "pending",
                (AssessmentRequest.expires_at == None) | (AssessmentRequest.expires_at > now),  # noqa: E711
            )
            .order_by(AssessmentRequest.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def find_by_doctor_patient(
        self, doctor_id: str, patient_id: str
    ) -> list[AssessmentRequest]:
        stmt = (
            select(AssessmentRequest)
            .where(
                AssessmentRequest.doctor_id == doctor_id,
                AssessmentRequest.patient_id == patient_id,
            )
            .order_by(AssessmentRequest.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def has_pending_of_type(
        self, doctor_id: str, patient_id: str, assessment_type: str
    ) -> bool:
        stmt = (
            select(AssessmentRequest.id)
            .where(
                AssessmentRequest.doctor_id == doctor_id,
                AssessmentRequest.patient_id == patient_id,
                AssessmentRequest.assessment_type == assessment_type,
                AssessmentRequest.status == "pending",
            )
            .limit(1)
        )
        return self.db.scalar(stmt) is not None

    def find_by_doctor(self, doctor_id: str) -> list[AssessmentRequest]:
        """Return all assessment requests created by this doctor, newest first."""
        stmt = (
            select(AssessmentRequest)
            .where(AssessmentRequest.doctor_id == doctor_id)
            .order_by(AssessmentRequest.created_at.desc())
        )
        return list(self.db.scalars(stmt).all())

    def update_by_request_id(self, request_id: str, data: dict) -> AssessmentRequest | None:
        """Update a request matched by its business-key (request_id), not PK."""
        record = self.find_by_request_id(request_id)
        if not record:
            return None
        for key, value in data.items():
            if hasattr(record, key):
                setattr(record, key, value)
        self.db.commit()
        self.db.refresh(record)
        return record

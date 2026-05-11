from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from server.db.models.wellness_form import MentalWellnessForm
from server.db.repositories.base import BaseRepository


class WellnessFormRepository(BaseRepository[MentalWellnessForm]):
    def __init__(self, db: Session):
        super().__init__(MentalWellnessForm, db)

    def find_by_form_id(self, form_id: str) -> MentalWellnessForm | None:
        stmt = (
            select(MentalWellnessForm)
            .where(MentalWellnessForm.form_id == form_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_user(
        self, user_id: str, page: int = 1, size: int = 50
    ) -> list[MentalWellnessForm]:
        skip = (page - 1) * size
        stmt = (
            select(MentalWellnessForm)
            .where(MentalWellnessForm.user_id == user_id)
            .order_by(MentalWellnessForm.created_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def list_by_doctor(
        self, doctor_id: str, page: int = 1, size: int = 50
    ) -> list[MentalWellnessForm]:
        skip = (page - 1) * size
        stmt = (
            select(MentalWellnessForm)
            .where(MentalWellnessForm.doctor_id == doctor_id)
            .order_by(MentalWellnessForm.created_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def list_by_doctor_patient(
        self, doctor_id: str, patient_id: str, page: int = 1, size: int = 50
    ) -> list[MentalWellnessForm]:
        skip = (page - 1) * size
        stmt = (
            select(MentalWellnessForm)
            .where(
                MentalWellnessForm.doctor_id == doctor_id,
                MentalWellnessForm.user_id == patient_id,
            )
            .order_by(MentalWellnessForm.created_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def verify_hash(self, form_id: str, expected_hash: str) -> bool:
        stmt = select(MentalWellnessForm.form_data_hash).where(
            MentalWellnessForm.form_id == form_id
        )
        actual = self.db.scalar(stmt)
        return actual == expected_hash if actual else False

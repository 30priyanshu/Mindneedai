from sqlalchemy import func, select
from sqlalchemy.orm import Session

from server.db.models.user import Doctor, UserDoctorRelationship, UserPreferences, UserProfile
from server.db.repositories.base import BaseRepository


class UserRepository(BaseRepository[UserProfile]):
    def __init__(self, db: Session):
        super().__init__(UserProfile, db)

    def find_by_email(self, email: str) -> UserProfile | None:
        stmt = select(UserProfile).where(UserProfile.email == email).limit(1)
        return self.db.scalar(stmt)

    def find_by_user_id(self, user_id: str) -> UserProfile | None:
        stmt = select(UserProfile).where(UserProfile.user_id == user_id).limit(1)
        return self.db.scalar(stmt)


class DoctorRepository(BaseRepository[Doctor]):
    def __init__(self, db: Session):
        super().__init__(Doctor, db)

    def find_by_email(self, email: str) -> Doctor | None:
        stmt = select(Doctor).where(Doctor.email == email).limit(1)
        return self.db.scalar(stmt)

    def find_by_doctor_id(self, doctor_id: str) -> Doctor | None:
        stmt = select(Doctor).where(Doctor.doctor_id == doctor_id).limit(1)
        return self.db.scalar(stmt)

    def find_by_doctor_code(self, doctor_code: str) -> Doctor | None:
        stmt = select(Doctor).where(Doctor.doctor_code == doctor_code).limit(1)
        return self.db.scalar(stmt)


class RelationshipRepository(BaseRepository[UserDoctorRelationship]):
    def __init__(self, db: Session):
        super().__init__(UserDoctorRelationship, db)

    def find_active(self, user_id: str, doctor_id: str) -> UserDoctorRelationship | None:
        stmt = (
            select(UserDoctorRelationship)
            .where(
                UserDoctorRelationship.user_id == user_id,
                UserDoctorRelationship.doctor_id == doctor_id,
                UserDoctorRelationship.status == "active",
            )
            .limit(1)
        )
        return self.db.scalar(stmt)

    def find_by_user_and_doctor(self, user_id: str, doctor_id: str) -> UserDoctorRelationship | None:
        stmt = (
            select(UserDoctorRelationship)
            .where(
                UserDoctorRelationship.user_id == user_id,
                UserDoctorRelationship.doctor_id == doctor_id,
            )
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_patients_for_doctor(
        self, doctor_id: str, page: int = 1, size: int = 50
    ) -> list[UserDoctorRelationship]:
        skip = (page - 1) * size
        stmt = (
            select(UserDoctorRelationship)
            .where(
                UserDoctorRelationship.doctor_id == doctor_id,
                UserDoctorRelationship.status == "active",
            )
            .order_by(UserDoctorRelationship.connected_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def count_patients_for_doctor(self, doctor_id: str) -> int:
        stmt = (
            select(func.count())
            .select_from(UserDoctorRelationship)
            .where(
                UserDoctorRelationship.doctor_id == doctor_id,
                UserDoctorRelationship.status == "active",
            )
        )
        return self.db.scalar(stmt) or 0

    def find_any_active_for_user(self, user_id: str) -> UserDoctorRelationship | None:
        stmt = (
            select(UserDoctorRelationship)
            .where(
                UserDoctorRelationship.user_id == user_id,
                UserDoctorRelationship.status == "active",
            )
            .limit(1)
        )
        return self.db.scalar(stmt)


class PreferencesRepository(BaseRepository[UserPreferences]):
    def __init__(self, db: Session):
        super().__init__(UserPreferences, db)

    def find_by_user_id(self, user_id: str) -> UserPreferences | None:
        stmt = select(UserPreferences).where(UserPreferences.user_id == user_id).limit(1)
        return self.db.scalar(stmt)

    def upsert(self, user_id: str, data: dict) -> UserPreferences:
        existing = self.find_by_user_id(user_id)
        if existing:
            return self.update(existing.id, data)
        return self.create({"user_id": user_id, **data})

from datetime import date

from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from server.db.models.mood import MoodEntry
from server.db.repositories.base import BaseRepository


class MoodRepository(BaseRepository[MoodEntry]):
    def __init__(self, db: Session):
        super().__init__(MoodEntry, db)

    def find_by_entry_id(self, entry_id: str) -> MoodEntry | None:
        stmt = select(MoodEntry).where(MoodEntry.entry_id == entry_id).limit(1)
        return self.db.scalar(stmt)

    def find_by_user_date(self, user_id: str, entry_date: date) -> MoodEntry | None:
        stmt = (
            select(MoodEntry)
            .where(MoodEntry.user_id == user_id, MoodEntry.date == entry_date)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def find_in_range(self, user_id: str, start: date, end: date) -> list[MoodEntry]:
        stmt = (
            select(MoodEntry)
            .where(
                MoodEntry.user_id == user_id,
                MoodEntry.date >= start,
                MoodEntry.date <= end,
            )
            .order_by(MoodEntry.date.asc())
        )
        return list(self.db.scalars(stmt).all())

    def list_by_month(self, user_id: str, year: int, month: int) -> list[MoodEntry]:
        stmt = (
            select(MoodEntry)
            .where(
                MoodEntry.user_id == user_id,
                extract("year", MoodEntry.date) == year,
                extract("month", MoodEntry.date) == month,
            )
            .order_by(MoodEntry.date.asc())
        )
        return list(self.db.scalars(stmt).all())

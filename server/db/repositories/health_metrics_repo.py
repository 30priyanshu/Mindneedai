from datetime import date
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from server.db.models.health_metrics import HealthMetricsEntry
from server.db.repositories.base import BaseRepository


class HealthMetricsRepository(BaseRepository[HealthMetricsEntry]):
    def __init__(self, db: Session):
        super().__init__(HealthMetricsEntry, db)

    def find_by_entry_id(self, entry_id: str) -> Optional[HealthMetricsEntry]:
        stmt = (
            select(HealthMetricsEntry)
            .where(HealthMetricsEntry.entry_id == entry_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def get_latest(self, user_id: str) -> Optional[HealthMetricsEntry]:
        stmt = (
            select(HealthMetricsEntry)
            .where(HealthMetricsEntry.user_id == user_id)
            .order_by(HealthMetricsEntry.timestamp.desc())
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_recent(self, user_id: str, limit: int = 5) -> list[HealthMetricsEntry]:
        stmt = (
            select(HealthMetricsEntry)
            .where(HealthMetricsEntry.user_id == user_id)
            .order_by(HealthMetricsEntry.timestamp.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def list_by_user(
        self,
        user_id: str,
        start: Optional[date],
        end: Optional[date],
        page: int = 1,
        size: int = 50,
    ) -> list[HealthMetricsEntry]:
        size = min(size, 100)
        skip = (page - 1) * size
        stmt = select(HealthMetricsEntry).where(HealthMetricsEntry.user_id == user_id)
        if start:
            stmt = stmt.where(HealthMetricsEntry.date >= start)
        if end:
            stmt = stmt.where(HealthMetricsEntry.date <= end)
        stmt = stmt.order_by(HealthMetricsEntry.timestamp.desc()).offset(skip).limit(size)
        return list(self.db.scalars(stmt).all())

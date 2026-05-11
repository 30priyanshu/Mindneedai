from sqlalchemy import select
from sqlalchemy.orm import Session

from server.db.models.emergency import EmergencyAlertLog, EmergencyContact
from server.db.repositories.base import BaseRepository


class EmergencyContactRepository(BaseRepository[EmergencyContact]):
    def __init__(self, db: Session):
        super().__init__(EmergencyContact, db)

    def find_by_user(self, user_id: str) -> EmergencyContact | None:
        stmt = (
            select(EmergencyContact)
            .where(EmergencyContact.user_id == user_id)
            .limit(1)
        )
        return self.db.scalar(stmt)


class AlertLogRepository(BaseRepository[EmergencyAlertLog]):
    def __init__(self, db: Session):
        super().__init__(EmergencyAlertLog, db)

    def get_last_alert(self, user_id: str) -> EmergencyAlertLog | None:
        stmt = (
            select(EmergencyAlertLog)
            .where(EmergencyAlertLog.user_id == user_id)
            .order_by(EmergencyAlertLog.triggered_at.desc())
            .limit(1)
        )
        return self.db.scalar(stmt)

    def list_by_user(
        self, user_id: str, page: int = 1, size: int = 50
    ) -> list[EmergencyAlertLog]:
        skip = (page - 1) * size
        stmt = (
            select(EmergencyAlertLog)
            .where(EmergencyAlertLog.user_id == user_id)
            .order_by(EmergencyAlertLog.triggered_at.desc())
            .offset(skip)
            .limit(size)
        )
        return list(self.db.scalars(stmt).all())

    def get_emergency_alert_history(self, user_id: str, days_back: int = 30) -> list[EmergencyAlertLog]:
        from datetime import datetime, timedelta
        cutoff = datetime.utcnow() - timedelta(days=days_back)
        stmt = (
            select(EmergencyAlertLog)
            .where(
                EmergencyAlertLog.user_id == user_id,
                EmergencyAlertLog.triggered_at >= cutoff
            )
            .order_by(EmergencyAlertLog.triggered_at.desc())
        )
        return list(self.db.scalars(stmt).all())

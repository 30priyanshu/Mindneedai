from sqlalchemy import func, or_, select, update, and_, delete
from sqlalchemy.orm import Session

from server.db.models.notification import Notification
from server.db.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session):
        super().__init__(Notification, db)

    def find_by_notification_id(self, notification_id: str) -> Notification | None:
        stmt = (
            select(Notification)
            .where(Notification.notification_id == notification_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def paginate(
        self,
        *,
        user_id: str | None,
        doctor_id: str | None,
        skip: int,
        limit: int,
        unread_only: bool = False,
    ) -> tuple[list[Notification], int]:
        filters = [self._owner_filter(user_id, doctor_id)]
        if unread_only:
            filters.append(Notification.read.is_(False))
        
        where = and_(*filters)
        total = self.db.scalar(
            select(func.count(Notification.id)).where(where)
        ) or 0
        items = list(
            self.db.scalars(
                select(Notification)
                .where(where)
                .order_by(Notification.created_at.desc())
                .offset(skip)
                .limit(limit)
            ).all()
        )
        return items, total

    def count_unread(
        self,
        *,
        user_id: str | None = None,
        doctor_id: str | None = None,
    ) -> int:
        where = self._owner_filter(user_id, doctor_id)
        return (
            self.db.scalar(
                select(func.count(Notification.id)).where(
                    where, Notification.read.is_(False)
                )
            )
            or 0
        )

    def mark_all_read(
        self,
        *,
        user_id: str | None = None,
        doctor_id: str | None = None,
    ) -> int:
        where = self._owner_filter(user_id, doctor_id)
        result = self.db.execute(
            update(Notification)
            .where(where, Notification.read.is_(False))
            .values(read=True)
        )
        self.db.commit()
        return result.rowcount

    def mark_one_read(self, notification_id: str) -> bool:
        result = self.db.execute(
            update(Notification)
            .where(Notification.notification_id == notification_id)
            .values(read=True)
        )
        self.db.commit()
        return result.rowcount > 0

    def clear_all(
        self,
        *,
        user_id: str | None = None,
        doctor_id: str | None = None,
    ) -> int:
        where = self._owner_filter(user_id, doctor_id)
        result = self.db.execute(delete(Notification).where(where))
        self.db.commit()
        return result.rowcount

    @staticmethod
    def _owner_filter(user_id: str | None, doctor_id: str | None):
        if user_id and doctor_id:
            return or_(
                Notification.user_id == user_id,
                Notification.doctor_id == doctor_id,
            )
        if user_id:
            return Notification.user_id == user_id
        if doctor_id:
            return Notification.doctor_id == doctor_id
        return Notification.id.is_(None)

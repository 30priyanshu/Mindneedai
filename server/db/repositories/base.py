from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

T = TypeVar("T")

MAX_PAGE_SIZE = 100


class BaseRepository(Generic[T]):

    def __init__(self, model: type[T], db: Session) -> None:
        self.model = model
        self.db = db

    def get(self, id: Any) -> T | None:
        return self.db.get(self.model, id)

    def list(self, page: int = 1, size: int = 50) -> list[T]:
        size = min(size, MAX_PAGE_SIZE)
        skip = (page - 1) * size
        stmt = select(self.model).offset(skip).limit(size)
        return list(self.db.scalars(stmt).all())

    def count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        return self.db.scalar(stmt) or 0

    def create(self, obj: dict[str, Any] | T) -> T:
        db_obj = self.model(**obj) if isinstance(obj, dict) else obj
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, id: Any, data: dict[str, Any]) -> T | None:
        db_obj = self.get(id)
        if not db_obj:
            return None

        for key, value in data.items():
            if hasattr(db_obj, key):
                setattr(db_obj, key, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, id: Any) -> bool:
        db_obj = self.get(id)
        if not db_obj:
            return False

        self.db.delete(db_obj)
        self.db.commit()
        return True

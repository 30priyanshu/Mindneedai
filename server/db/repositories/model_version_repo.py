from sqlalchemy import select, update
from sqlalchemy.orm import Session
from typing import Optional, List

from server.db.models.analysis import ModelVersion
from server.db.repositories.base import BaseRepository

class ModelVersionRepository(BaseRepository[ModelVersion]):
    def __init__(self, db: Session):
        super().__init__(ModelVersion, db)

    def find_by_version_id(self, version_id: str) -> Optional[ModelVersion]:
        stmt = select(ModelVersion).where(ModelVersion.version_id == version_id)
        return self.db.execute(stmt).scalar_one_or_none()
    
    def get_active_version(self, prefix: str = "") -> Optional[ModelVersion]:
        # Prefix could be 'text_', 'speech_', 'facial_'
        stmt = select(ModelVersion).where(
            ModelVersion.is_active == True,
            ModelVersion.version_id.startswith(prefix)
        ).order_by(ModelVersion.created_at.desc()).limit(1)
        return self.db.execute(stmt).scalar_one_or_none()
    
    def set_active_version(self, version_id: str, prefix: str = "") -> bool:
        # Deactivate all others with this prefix
        stmt = update(ModelVersion).where(
            ModelVersion.version_id.startswith(prefix),
            ModelVersion.is_active == True
        ).values(is_active=False)
        self.db.execute(stmt)
        
        # Activate the specified one
        stmt2 = update(ModelVersion).where(
            ModelVersion.version_id == version_id
        ).values(is_active=True)
        res = self.db.execute(stmt2)
        
        self.db.commit()
        return res.rowcount > 0

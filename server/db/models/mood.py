from datetime import datetime
from sqlalchemy import Column, Date, DateTime, Integer, String, Text, Index, UniqueConstraint

from server.db.base import Base

class MoodEntry(Base):
    __tablename__ = "mood_entries"
    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_mood_user_date'),
        Index('idx_mood_user_date', 'user_id', 'date'),
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    entry_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    score = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

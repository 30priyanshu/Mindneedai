from typing import Generator
from sqlalchemy.orm import sessionmaker, Session

from server.config.settings import settings
from server.db.base import create_engine_from_settings

# Module-level singleton instance of the database engine
engine = create_engine_from_settings(settings)

# SessionLocal configured safely for production use
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for isolated database transactions per request.
    Automatically closes the session afterwards, returning the connection
    to the pool reliably.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

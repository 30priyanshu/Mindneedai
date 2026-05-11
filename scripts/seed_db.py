import logging
import json
from pathlib import Path
import sys

# Add server directory to path for absolute imports
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from server.db.session import SessionLocal
from server.db.repositories.recommendation_repo import RecommendationPlayHistoryRepository, SessionCacheRepository

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

ROOT_DIR = BASE_DIR.parent

MODELS_MAP = {
    "music": "music_recommendation",
    "video": "video_recommendation",
    "youtube": "youtube_recommendation"
}

def migrate_play_history(db, media_type: str, folder_name: str) -> int:
    """Migrates a specific media type's play history to the relational database."""
    path = ROOT_DIR / "src" / "multimodel" / folder_name / "play_history.json"
    if not path.exists():
        logger.warning(f"File not found: {path}")
        return 0
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        logger.warning(f"Failed to decode JSON from {path}")
        return 0

    repo = RecommendationPlayHistoryRepository(db)
    count = 0
    
    for user_id, emotions in data.items():
        if not isinstance(emotions, dict):
            continue
            
        for emotion, keys in emotions.items():
            if not isinstance(keys, list):
                continue
                
            for key in keys:
                if not isinstance(key, str):
                    continue
                    
                try:
                    repo.upsert(
                        user_id=user_id,
                        emotion_category=emotion,
                        media_type=media_type,
                        media_key=key
                    )
                    count += 1
                except Exception as e:
                    logger.error(f"Failed to upsert history for {user_id} - {key}: {e}")
                    
    return count

def migrate_session_cache(db, media_type: str, folder_name: str) -> int:
    """Migrates a specific media type's session cache to the relational database."""
    path = ROOT_DIR / "src" / "multimodel" / folder_name / "session_cache.json"
    if not path.exists():
        logger.warning(f"File not found: {path}")
        return 0
    
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        logger.warning(f"Failed to decode JSON from {path}")
        return 0

    repo = SessionCacheRepository(db)
    count = 0
    
    for session_id, key in data.items():
        if not isinstance(key, str):
            continue
            
        user_id = "legacy_user"
        emotion_category = "Unknown"
        
        # In music/video, the key often looks like "Happy/file.mp4"
        if "/" in key:
            emotion_category = key.split("/")[0]

        try:
            repo.upsert(
                user_id=user_id,
                session_id=session_id,
                emotion_category=emotion_category,
                media_type=media_type,
                chosen_key=key
            )
            count += 1
        except Exception as e:
            logger.error(f"Failed to upsert cache for {session_id} - {key}: {e}")
            
    return count

def main() -> None:
    """Executes the one-shot JSON to DB migration for recommendations."""
    db = SessionLocal()
    
    try:
        total_history = 0
        total_cache = 0
        
        for media_type, folder_name in MODELS_MAP.items():
            logger.info(f"Starting migration for {media_type} ({folder_name})...")
            
            hist_count = migrate_play_history(db, media_type, folder_name)
            cache_count = migrate_session_cache(db, media_type, folder_name)
            
            total_history += hist_count
            total_cache += cache_count
            
            logger.info(f"Finished {media_type}: {hist_count} history rows, {cache_count} cache rows.")
            
        logger.info(f"Migration complete. Total history: {total_history}, Total cache: {total_cache}.")
        
    except Exception as e:
        logger.error(f"Migration failed unexpectedly: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    main()

import logging
from typing import Optional
import json
from pathlib import Path
from datetime import datetime

from server.analysis.shared.base_model_manager import BaseModelManager
from server.db.session import SessionLocal
from server.db.repositories.model_version_repo import ModelVersionRepository
from server.db.models.analysis import ModelVersion

logger = logging.getLogger(__name__)

class SpeechModelManager(BaseModelManager):
    """
    Speech Modality Model Manager.
    Responsibility: Manage Wav2Vec2 model versioning and rollout operations with JSON + DB registry.
    """

    def __init__(self, cache_dir: str = "./model_cache/speech_analysis", initial_version: str = "Dpngtm/wav2vec2-emotion-recognition"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.registry_file = self.cache_dir / "model_registry.json"
        self._active_version: str = initial_version
        self._previous_version: Optional[str] = None
        self.versions = {}
        self._load_registry()

    def _load_registry(self) -> None:
        if self.registry_file.exists():
            try:
                data = json.loads(self.registry_file.read_text())
                self.versions = data.get("versions", {})
                self._active_version = data.get("active_version", self._active_version)
            except Exception as e:
                logger.error(f"Failed to load registry: {e}")
        else:
            self.versions = {
                self._active_version: {
                    "version_id": self._active_version,
                    "model_path": self._active_version,
                    "is_active": True,
                    "fine_tuned": False,
                    "created_at": datetime.utcnow().isoformat()
                }
            }
            self._save_registry()
            self._sync_db(self._active_version, self._active_version, True, False)

    def _save_registry(self) -> None:
        try:
            data = {
                "active_version": self._active_version,
                "versions": self.versions,
                "last_updated": datetime.utcnow().isoformat()
            }
            self.registry_file.write_text(json.dumps(data, indent=2))
        except Exception as e:
            logger.error(f"Failed to save registry: {e}")

    def _sync_db(self, version_id: str, model_path: str, is_active: bool, fine_tuned: bool) -> None:
        try:
            with SessionLocal() as db:
                repo = ModelVersionRepository(db)
                record = repo.find_by_version_id(version_id)
                if not record:
                    repo.create({
                        "version_id": version_id,
                        "model_path": model_path,
                        "is_active": is_active,
                        "fine_tuned": fine_tuned,
                        "created_at": datetime.utcnow()
                    })
                if is_active:
                    repo.set_active_version(version_id, "spc_")
        except Exception as e:
            logger.error(f"Failed DB sync for model registry: {e}")

    def get_active_version(self) -> str:
        return self._active_version

    def activate_version(self, version_id: str) -> None:
        if not version_id or version_id not in self.versions:
            raise ValueError("Version ID not found in speech registry.")
        logger.info(f"Activating new speech model version: {version_id}")
        self._previous_version = self._active_version
        self._active_version = version_id
        for v in self.versions.values():
            v["is_active"] = False
        self.versions[version_id]["is_active"] = True
        self._save_registry()
        self._sync_db(version_id, self.versions[version_id]["model_path"], True, self.versions[version_id].get("fine_tuned", False))

    def rollback(self) -> None:
        if not self._previous_version:
            raise RuntimeError("No previous speech model version to rollback to.")
        self.activate_version(self._previous_version)

    def register_new_version(self, version_id: str, model_path: str, fine_tuned: bool = True) -> None:
        self.versions[version_id] = {
            "version_id": version_id,
            "model_path": model_path,
            "is_active": False,
            "fine_tuned": fine_tuned,
            "created_at": datetime.utcnow().isoformat()
        }
        self._save_registry()
        self._sync_db(version_id, model_path, False, fine_tuned)

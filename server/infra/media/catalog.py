"""
Local media catalog utilities.

Single responsibility: validate local media keys and scan emotion folders for
streamable files without exposing filesystem details to feature services.
"""
import time
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

from loguru import logger

from server.exceptions import ValidationError


@dataclass(frozen=True)
class MediaCatalogConfig:
    media_type: str
    root: Path
    extensions: frozenset[str]
    emotions: tuple[str, ...]
    ttl_seconds: float = 300.0


class LocalMediaCatalog:
    """Filesystem-backed media catalog with TTL cache and failed-key exclusion."""

    def __init__(self, config: MediaCatalogConfig) -> None:
        self._config = config
        self._cache: dict[str, list[str]] = {}
        self._failed: set[str] = set()
        self._fetched_at = 0.0

    def get(self) -> dict[str, list[str]]:
        if time.monotonic() - self._fetched_at < self._config.ttl_seconds:
            return self._cache
        catalog = {e: files for e in self._config.emotions if (files := self._scan(e))}
        self._cache = catalog
        self._fetched_at = time.monotonic()
        logger.info(
            "media_catalog_refreshed",
            extra={"media_type": self._config.media_type, "total": sum(map(len, catalog.values()))},
        )
        return catalog

    def mark_failed(self, key: str, user_id: str) -> None:
        valid_key = validate_media_key(key)
        self._failed.add(valid_key)
        self.invalidate()
        logger.warning(
            "media_file_failed",
            extra={
                "media_type": self._config.media_type,
                "user_id": user_id,
                "media_key": valid_key,
            },
        )

    def invalidate(self) -> None:
        self._fetched_at = 0.0

    def exists(self, key: str) -> bool:
        valid_key = validate_media_key(key)
        return valid_key not in self._failed and _is_streamable(self._config.root / valid_key)

    def _scan(self, emotion: str) -> list[str]:
        folder = self._config.root / emotion
        if not folder.is_dir():
            return []
        try:
            return sorted(
                self._key(emotion, f)
                for f in folder.iterdir()
                if self._include(emotion, f)
            )
        except OSError as exc:
            logger.error(
                "media_scan_failed",
                extra={
                    "media_type": self._config.media_type,
                    "emotion": emotion,
                    "error": str(exc),
                },
            )
            return []

    def _include(self, emotion: str, path: Path) -> bool:
        key = self._key(emotion, path)
        return (
            key not in self._failed
            and path.is_file()
            and path.suffix.lower() in self._config.extensions
            and _is_streamable(path)
        )

    @staticmethod
    def _key(emotion: str, path: Path) -> str:
        return f"{emotion}/{path.name}"


def validate_media_key(key: str) -> str:
    path = PurePosixPath(key.strip())
    parts = path.parts
    if len(parts) != 2 or any(part in {"", ".", ".."} for part in parts):
        raise ValidationError("Invalid media file key")
    if path.is_absolute() or "\\" in key:
        raise ValidationError("Invalid media file key")
    return f"{parts[0]}/{parts[1]}"


def _is_streamable(path: Path) -> bool:
    try:
        return path.is_file() and path.stat().st_size > 0
    except OSError:
        return False

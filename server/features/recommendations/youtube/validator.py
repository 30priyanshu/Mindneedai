"""
YouTube video health validator.

Single responsibility: in-memory tracking of which videos are currently
healthy vs. failed so the service can avoid recommending broken links.

State lives in a module-level singleton; no file I/O.
Failure thresholds and retry windows match the original implementation.
"""
import threading
from datetime import datetime
from typing import Optional

_FAILURE_THRESHOLD = 3       # failures before treating video as permanently blocked
_RETRY_AFTER_SECONDS = 604_800  # 7 days before re-attempting a permanently-blocked video
_RECENT_FAILURE_SECONDS = 3_600  # 1 hour cooldown after a transient failure


class YouTubeVideoValidator:
    """Thread-safe in-memory health tracker for YouTube video IDs."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        # video_id -> {first_failed, last_failed, failure_count, error_codes}
        self._failed: dict[str, dict] = {}
        # video_id -> verified_at timestamp (float)
        self._verified: dict[str, float] = {}
        # per-process session failures (cleared on restart)
        self._session_failures: set[str] = set()

    def mark_failed(self, video_id: str, error_code: Optional[int] = None) -> None:
        now = datetime.now().timestamp()
        with self._lock:
            if video_id not in self._failed:
                self._failed[video_id] = {
                    "first_failed": now, "last_failed": now,
                    "failure_count": 1, "error_codes": [],
                }
            else:
                self._failed[video_id]["last_failed"] = now
                self._failed[video_id]["failure_count"] += 1
            if error_code and error_code not in self._failed[video_id]["error_codes"]:
                self._failed[video_id]["error_codes"].append(error_code)
            self._session_failures.add(video_id)
            self._verified.pop(video_id, None)

    def mark_success(self, video_id: str) -> None:
        with self._lock:
            self._verified[video_id] = datetime.now().timestamp()
            self._failed.pop(video_id, None)
            self._session_failures.discard(video_id)

    def is_available(self, video_id: str) -> bool:
        if video_id in self._session_failures:
            return False
        if video_id not in self._failed:
            return True
        return self._evaluate_failed(video_id)

    def _evaluate_failed(self, video_id: str) -> bool:
        info = self._failed[video_id]
        now = datetime.now().timestamp()
        if info["failure_count"] >= _FAILURE_THRESHOLD:
            if now - info.get("last_failed", 0) > _RETRY_AFTER_SECONDS:
                with self._lock:
                    self._failed.pop(video_id, None)
                return True
            return False
        return now - info.get("last_failed", 0) >= _RECENT_FAILURE_SECONDS

    def get_health_score(self, video_id: str) -> float:
        if video_id in self._verified:
            age_hours = (datetime.now().timestamp() - self._verified[video_id]) / 3600
            if age_hours < 24:
                return 1.0
            if age_hours < 168:
                return 0.8
            return 0.6
        if video_id in self._failed:
            return max(0.0, 1.0 - self._failed[video_id]["failure_count"] * 0.4)
        return 0.5

    def filter_available(self, videos: list[dict], id_key: str = "youtube_video_id") -> list[dict]:
        return [v for v in videos if self.is_available(v.get(id_key, ""))]

    def get_best(
        self, videos: list[dict], id_key: str = "youtube_video_id", limit: Optional[int] = None
    ) -> list[dict]:
        scored = sorted(
            videos,
            key=lambda v: self.get_health_score(v.get(id_key, "")),
            reverse=True,
        )
        result = [v for v in scored if self.get_health_score(v.get(id_key, "")) > 0.2]
        return result[:limit] if limit else result


# Module-level singleton — shared across all per-request service instances.
youtube_validator = YouTubeVideoValidator()

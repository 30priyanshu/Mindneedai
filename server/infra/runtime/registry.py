"""App-state analyzer registry + isolated per-video-session state.

A single ``AnalyzerRegistry`` instance is created during FastAPI lifespan and
attached to ``app.state.analyzers``. Routers and services depend on it via
``request.app.state.analyzers`` rather than module-level globals, so analyzers
have a deterministic lifecycle and tests can replace them per-app.

Per-session video state (LSTM window, smoothing buffer, last box, frame
counter) lives in ``VideoSessionState`` keyed by ``session_id``. Each entry
owns its own ``asyncio.Lock`` to serialise frame analyses within one session
without blocking other sessions.
"""
from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from server.analysis.facial.analyzer import FacialAnalyzer, FacialTemporalState
from server.analysis.shared.inference_runner import (
    InferenceRunner,
    facial_runner,
    speech_runner,
    text_runner,
)
from server.analysis.speech.analyzer import SpeechAnalyzer
from server.analysis.text.analyzer import TextAnalyzer


@dataclass
class VideoSessionState:
    user_id: str
    created_mono: float
    last_activity_mono: float = 0.0
    frame_count: int = 0
    last_frame_number: int = 0
    last_box: Optional[Tuple[int, int, int, int]] = None
    prev_box: Optional[Tuple[int, int, int, int]] = None
    last_emotion: str = "Neutral"
    last_confidence: float = 0.0
    frame_width: Optional[int] = None
    frame_height: Optional[int] = None
    frame_emotions: List[Dict[str, Any]] = field(default_factory=list)
    temporal: FacialTemporalState = field(default_factory=FacialTemporalState)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)


class AnalyzerRegistry:
    SESSION_TTL_SECONDS = 30 * 60

    def __init__(self) -> None:
        self.text: Optional[TextAnalyzer] = None
        self.speech: Optional[SpeechAnalyzer] = None
        self.facial: Optional[FacialAnalyzer] = None
        self.text_runner: InferenceRunner = text_runner
        self.speech_runner: InferenceRunner = speech_runner
        self.facial_runner: InferenceRunner = facial_runner
        self._video_sessions: Dict[str, VideoSessionState] = {}
        self._video_lock = asyncio.Lock()
        self._ready = False

    @property
    def ready(self) -> bool:
        return (
            self._ready
            and self.text is not None
            and self.text.is_loaded
            and self.speech is not None
            and self.speech.is_loaded
            and self.facial is not None
            and self.facial.is_loaded
        )

    def mark_ready(self) -> None:
        self._ready = True

    async def register_video_session(
        self, session_id: str, user_id: str, max_per_user: int, max_total: int,
    ) -> VideoSessionState:
        async with self._video_lock:
            self._evict_stale_locked()
            if len(self._video_sessions) >= max_total:
                raise RuntimeError("Maximum concurrent video sessions reached")
            user_count = sum(1 for s in self._video_sessions.values() if s.user_id == user_id)
            if user_count >= max_per_user:
                raise RuntimeError("Maximum concurrent video sessions per user reached")
            now = time.monotonic()
            state = VideoSessionState(user_id=user_id, created_mono=now, last_activity_mono=now)
            self._video_sessions[session_id] = state
            return state

    def get_video_session(self, session_id: str) -> Optional[VideoSessionState]:
        return self._video_sessions.get(session_id)

    async def pop_video_session(self, session_id: str) -> Optional[VideoSessionState]:
        async with self._video_lock:
            return self._video_sessions.pop(session_id, None)

    def _evict_stale_locked(self) -> None:
        cutoff = time.monotonic() - self.SESSION_TTL_SECONDS
        stale = [sid for sid, s in self._video_sessions.items() if s.last_activity_mono and s.last_activity_mono < cutoff]
        for sid in stale:
            self._video_sessions.pop(sid, None)

    def video_session_count(self) -> int:
        return len(self._video_sessions)

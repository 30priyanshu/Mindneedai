"""Facial analysis service.

Per-session temporal state lives in the ``AnalyzerRegistry``; every
``analyze_frame`` call serialises against the session's own ``asyncio.Lock``
to keep the LSTM window and smoothing buffer race-free without blocking
other sessions. All inference is dispatched through ``facial_runner`` so
work runs off the event loop with bounded GPU/CPU concurrency, a hard
timeout, and metrics.
"""
from __future__ import annotations

import asyncio
import base64
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np
from fastapi import BackgroundTasks
from loguru import logger

from server.analysis.facial.analyzer import FacialAnalyzer
from server.analysis.facial.reasoner import FacialReasoner
from server.analysis.shared.inference_runner import facial_runner
from server.config.settings import settings
from server.db.repositories.video_repo import (
    VideoAnalysisReviewRepository, VideoFrameRepository, VideoSessionRepository,
)
from server.exceptions import InferenceTimeoutError, NotFoundError, ValidationError
from server.features.auth.ownership import require_owner
from server.features.facial_analysis.schemas import (
    EndSessionRequest, FrameAnalysisRequest, SessionResponse,
)
from server.features.notifications.service import NotificationService
from server.infra.runtime.registry import AnalyzerRegistry, VideoSessionState
from server.security.audit import AuditEventType, AuditLogger
from server.utils.timezone import to_utc

_FACE_DETECT_INTERVAL = 2
_INFERENCE_INTERVAL = 1
_BOX_SMOOTH_FACTOR = 0.3


def _smooth_box(
    new_box: Tuple[int, int, int, int],
    prev_box: Optional[Tuple[int, int, int, int]],
    factor: float = _BOX_SMOOTH_FACTOR,
) -> Tuple[int, int, int, int]:
    if prev_box is None:
        return new_box
    return tuple(int(prev_box[i] * (1 - factor) + new_box[i] * factor) for i in range(4))  # type: ignore[return-value]


def _decode_base64_frame(frame_data: str) -> Optional[np.ndarray]:
    try:
        raw = frame_data.split(",", 1)[1] if "," in frame_data else frame_data
        decoded = base64.b64decode(raw, validate=False)
        nparr = np.frombuffer(decoded, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR | cv2.IMREAD_IGNORE_ORIENTATION)
        if frame is None or frame.size == 0:
            return None
        return frame
    except Exception:
        return None


def _no_face_response(req: FrameAnalysisRequest, state: Optional[VideoSessionState]) -> dict:
    if state is None:
        return {
            "frame_number": req.frame_number, "face_detected": False,
            "emotion": "Neutral", "confidence": 0.0, "box_coords": None,
            "requires_review": False,
        }
    return {
        "frame_number": req.frame_number,
        "face_detected": bool(state.last_box),
        "emotion": state.last_emotion,
        "confidence": state.last_confidence,
        "box_coords": list(state.last_box) if state.last_box else None,
        "requires_review": False,
    }


class FacialAnalysisService:
    def __init__(
        self,
        registry: AnalyzerRegistry,
        analyzer: FacialAnalyzer,
        reasoner: FacialReasoner,
        video_session_repo: VideoSessionRepository,
        video_frame_repo: VideoFrameRepository,
        review_repo: VideoAnalysisReviewRepository,
        notification_svc: NotificationService,
        audit_logger: AuditLogger,
    ) -> None:
        self.registry = registry
        self.analyzer = analyzer
        self.reasoner = reasoner
        self.video_session_repo = video_session_repo
        self.video_frame_repo = video_frame_repo
        self.review_repo = review_repo
        self.notification_svc = notification_svc
        self.audit_logger = audit_logger

    async def start_session(
        self, user_id: str, bg_tasks: BackgroundTasks,
    ) -> SessionResponse:
        session_id = f"video_session_{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc)

        try:
            await self.registry.register_video_session(
                session_id, user_id,
                max_per_user=settings.max_video_sessions_per_user,
                max_total=settings.max_active_video_sessions,
            )
        except RuntimeError as exc:
            raise ValidationError(str(exc))

        record = self.video_session_repo.create({
            "session_id": session_id, "user_id": user_id,
            "status": "active", "start_time": now,
        })

        bg_tasks.add_task(
            self.audit_logger.log, AuditEventType.VIDEO_ANALYSIS_START,
            user_id=user_id, action="start_video_session",
            status="success", duration_ms=0.0, request_id=session_id,
        )
        return SessionResponse(
            session_id=record.session_id, status=record.status, start_time=record.start_time,
        )

    async def analyze_frame(
        self, request: FrameAnalysisRequest, user_id: str, bg_tasks: BackgroundTasks,
    ) -> dict:
        state = self.registry.get_video_session(request.session_id)
        if state is None:
            return _no_face_response(request, None)
        require_owner(state.user_id, user_id)

        if len(request.frame_data) > settings.max_frame_b64_bytes:
            return _no_face_response(request, state)

        async with state.lock:
            if request.frame_number <= state.last_frame_number:
                return _no_face_response(request, state)
            state.last_frame_number = request.frame_number
            state.last_activity_mono = time.monotonic()

            frame = _decode_base64_frame(request.frame_data)
            if frame is None:
                return _no_face_response(request, state)

            h, w = frame.shape[:2]
            if state.frame_width is None:
                state.frame_width, state.frame_height = w, h
            state.frame_count += 1

            run_detection = state.frame_count % _FACE_DETECT_INTERVAL == 0
            run_inference = state.frame_count % _INFERENCE_INTERVAL == 0
            face_detected = False
            current_box = state.last_box

            if run_detection:
                try:
                    box = await facial_runner.run(
                        self.analyzer.detect_face, frame, request_id=request.session_id,
                    )
                except InferenceTimeoutError:
                    return _no_face_response(request, state)

                if box is not None:
                    current_box = _smooth_box(box, state.prev_box)
                    state.last_box = current_box
                    state.prev_box = current_box

                    if run_inference:
                        face_detected = await self._infer_and_record(frame, current_box, state, request)
                elif state.frame_count % (_FACE_DETECT_INTERVAL * 3) == 0:
                    state.last_box = None
                    state.prev_box = None
                    current_box = None

        return {
            "frame_number": request.frame_number,
            "face_detected": bool(current_box),
            "emotion": state.last_emotion,
            "confidence": state.last_confidence,
            "box_coords": list(current_box) if current_box else None,
            "requires_review": face_detected and state.last_confidence < 0.5,
        }

    async def _infer_and_record(
        self, frame: np.ndarray, box: Tuple[int, int, int, int],
        state: VideoSessionState, request: FrameAnalysisRequest,
    ) -> bool:
        sx, sy, ex, ey = box
        full_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_crop = full_rgb[sy:ey, sx:ex]
        if face_crop.size == 0:
            return False

        try:
            emotion, confidence = await facial_runner.run(
                self.analyzer.infer_emotion, face_crop, state.temporal,
                request_id=request.session_id,
            )
        except InferenceTimeoutError:
            return False
        except Exception as exc:
            logger.warning("facial_inference_failed", extra={"session": request.session_id, "error": str(exc)})
            return False

        state.last_emotion = emotion
        state.last_confidence = confidence

        try:
            self.video_frame_repo.create({
                "frame_id": f"{request.session_id}_frame_{request.frame_number}",
                "session_id": request.session_id,
                "frame_number": request.frame_number,
                "timestamp": request.timestamp,
                "emotion_detected": emotion,
                "confidence": confidence,
                "face_detected": True,
                "created_at": datetime.now(timezone.utc),
            })
        except Exception as exc:
            logger.warning("video_frame_persist_failed", extra={"session": request.session_id, "error": str(exc)})

        state.frame_emotions.append({
            "frame_number": request.frame_number,
            "timestamp": request.timestamp,
            "emotion": emotion,
            "confidence": confidence,
            "face_detected": True,
        })
        return True

    async def end_session(
        self, request: EndSessionRequest, user_id: str, bg_tasks: BackgroundTasks,
    ) -> dict:
        start_ms = time.perf_counter()
        record = self.video_session_repo.find_by_session_id(request.session_id)
        if not record:
            await self.registry.pop_video_session(request.session_id)
            raise NotFoundError(f"Video session '{request.session_id}' not found")
        require_owner(record.user_id, user_id)

        state = await self.registry.pop_video_session(request.session_id)
        frame_emotions = state.frame_emotions if state else self._frames_from_db(request.session_id)

        valid = [f for f in frame_emotions if f.get("face_detected")]
        total_frames = len(frame_emotions)
        dominant_emotion, avg_confidence, distribution = self._aggregate(valid)

        end_time = datetime.now(timezone.utc)
        duration = (end_time - to_utc(record.start_time)).total_seconds()

        session_data = {
            "session_id": request.session_id, "user_id": record.user_id,
            "duration_seconds": duration, "total_frames": total_frames,
            "valid_frames": len(valid), "dominant_emotion": dominant_emotion,
            "average_confidence": avg_confidence,
            "emotion_distribution": distribution, "frame_emotions": frame_emotions,
        }

        agentic_analysis = (
            await self._run_agentic_analysis(session_data) if (self.reasoner.is_available() and valid) else None
        )

        requires_review = self._determine_review_requirement(session_data, agentic_analysis)
        review_request_id = (
            self._create_review(request.session_id, record.user_id, session_data, agentic_analysis)
            if requires_review else None
        )

        self.video_session_repo.update(record.id, {
            "status": "completed", "end_time": end_time,
            "total_frames": total_frames, "dominant_emotion": dominant_emotion,
            "average_confidence": avg_confidence,
            "requires_human_review": requires_review,
            "review_request_id": review_request_id,
            "analysis_metadata": {
                "analysis_type": "video",
                "distribution": distribution, "valid_frames": len(valid),
            },
        })

        duration_ms = (time.perf_counter() - start_ms) * 1000
        bg_tasks.add_task(
            self.audit_logger.log, AuditEventType.VIDEO_ANALYSIS_COMPLETE,
            user_id=record.user_id, action="end_video_session", status="success",
            duration_ms=duration_ms, request_id=request.session_id,
        )
        bg_tasks.add_task(
            self.notification_svc.notify_analysis_complete,
            user_id=record.user_id, analysis_type="video",
        )

        response: Dict[str, Any] = {
            "session_id": record.session_id, "status": "completed",
            "total_frames": total_frames, "valid_frames": len(valid),
            "duration_seconds": duration, "dominant_emotion": dominant_emotion,
            "average_confidence": avg_confidence,
            "emotion_distribution": distribution,
            "requires_human_review": requires_review,
            "review_request_id": review_request_id,
        }
        if agentic_analysis:
            response["agentic_analysis"] = agentic_analysis
        return response

    def _frames_from_db(self, session_id: str) -> list:
        rows = self.video_frame_repo.list_by_session(session_id)
        return [
            {"emotion": r.emotion_detected, "confidence": r.confidence, "face_detected": r.face_detected}
            for r in rows
        ]

    @staticmethod
    def _aggregate(valid: list) -> tuple[str, float, dict]:
        if not valid:
            return "Unknown", 0.0, {}
        counts: Dict[str, int] = {}
        total_conf = 0.0
        for f in valid:
            em = f.get("emotion")
            if not em:
                continue
            counts[em] = counts.get(em, 0) + 1
            total_conf += f.get("confidence", 0.0)
        if not counts:
            return "Unknown", 0.0, {}
        dominant = max(counts, key=lambda k: counts[k])
        avg_conf = total_conf / len(valid)
        distribution = {e: round(c / len(valid), 4) for e, c in counts.items()}
        return dominant, avg_conf, distribution

    async def _run_agentic_analysis(self, session_data: dict) -> Optional[Dict[str, Any]]:
        try:
            prompt = self.reasoner.build_prompt(session_data)
            raw = await asyncio.wait_for(self.reasoner.call_llm(prompt), timeout=30)
            parsed = self.reasoner.parse_response(raw)
            return {
                "overall_sentiment": parsed.get("overall_sentiment", session_data["dominant_emotion"]),
                "emotional_stability": parsed.get("emotional_stability", 0.5),
                "detailed_summary": parsed.get("summary") or parsed.get("clinical_insight") or parsed.get("insight", ""),
                "recommendations": parsed.get("recommendations", []),
                "concerning_patterns": parsed.get("concerning_patterns", []),
                "quick_actions": parsed.get("quick_actions", []),
                "mood_trajectory": parsed.get("mood_trajectory", "stable"),
                "confidence_score": parsed.get("confidence_score", session_data["average_confidence"]),
                "clinical_risk": {
                    "protective_factors": parsed.get("protective_factors", []),
                    "depression_risk_score": parsed.get("depression_risk_score", 0),
                    "anxiety_manifestation_score": parsed.get("anxiety_manifestation_score", 0),
                },
            }
        except Exception as exc:
            logger.warning("facial_agentic_fallback", extra={"error": str(exc)})
            return None

    def _determine_review_requirement(
        self, session_data: dict, agentic: Optional[Dict[str, Any]],
    ) -> bool:
        if agentic and agentic.get("requires_human_review"):
            return True
        if session_data.get("average_confidence", 0) < 0.5:
            return True
        dist = session_data.get("emotion_distribution", {})
        return sum(dist.get(e, 0) for e in ("Sadness", "Fear", "Anger", "Disgust")) > 0.6

    def _create_review(
        self, session_id: str, user_id: str, session_data: dict,
        agentic: Optional[Dict[str, Any]],
    ) -> Optional[str]:
        try:
            review_id = f"vid_rev_{uuid.uuid4().hex[:16]}"
            summary = agentic.get("detailed_summary") if agentic else None
            self.review_repo.create({
                "review_id": review_id, "session_id": session_id, "user_id": user_id,
                "reviewer_id": "pending",
                "dominant_emotion_ai": session_data.get("dominant_emotion", "Unknown"),
                "ai_summary": summary,
                "emotional_patterns": session_data.get("emotion_distribution"),
                "status": "pending", "created_at": datetime.now(timezone.utc),
            })
            return review_id
        except Exception as exc:
            logger.error("video_review_create_failed", extra={"error": str(exc)})
            return None

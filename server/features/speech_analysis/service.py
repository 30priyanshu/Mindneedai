"""Speech analysis service.

Audio is held in memory (``BytesIO``) end-to-end; no temp-file disk churn.
Inference dispatched through ``speech_runner`` for bounded concurrency,
event-loop offload, and timeout enforcement. Ownership of every session is
verified at the router boundary.
"""
from __future__ import annotations

import asyncio
import io
import os
import subprocess
import tempfile
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import soundfile as sf
from loguru import logger

from server.analysis.shared.inference_runner import speech_runner
from server.analysis.speech.analyzer import SpeechAnalyzer
from server.analysis.speech.reasoner import SpeechReasoner
from server.db.repositories.audio_repo import AudioAnalysisReviewRepository, AudioSessionRepository
from server.exceptions import NotFoundError, ValidationError
import imageio_ffmpeg
from server.features.auth.ownership import require_owner
from server.features.notifications.service import NotificationService
from server.features.speech_analysis.schemas import (
    AudioAnalysisRequest, AudioAnalysisResult, AudioFileAnalysisResponse,
    AudioSessionRequest, AudioSessionResponse,
)
from server.security.audit import AuditEventType, AuditLogger
from server.utils.timezone import to_utc

_NEGATIVE = {"sad", "fearful", "angry", "disgust"}
_POSITIVE = {"happy", "calm", "surprised"}


def _compute_insights(emotion: str, confidence: float, quality: float) -> Dict[str, Any]:
    indicators: list[dict] = []
    if emotion == "sad" and confidence > 0.6:
        indicators.append({
            "type": "depression_risk",
            "severity": "high" if confidence > 0.8 else "moderate",
            "evidence": f"High sadness ({confidence:.1%})",
            "recommendation": "Consider depression screening",
        })
    if emotion == "fearful" and confidence > 0.5:
        indicators.append({
            "type": "anxiety_risk", "severity": "moderate",
            "evidence": f"Fear detected ({confidence:.1%})",
            "recommendation": "Monitor anxiety symptoms",
        })
    if emotion in _POSITIVE and confidence > 0.4:
        indicators.append({
            "type": "positive_engagement", "severity": "low",
            "evidence": "Positive emotions present",
            "recommendation": "Maintain current activities",
        })
    valence = "negative" if emotion in _NEGATIVE else "positive" if emotion in _POSITIVE else "neutral"
    return {
        "emotional_valence": valence,
        "clinical_indicators": indicators,
        "audio_quality_adequate": quality >= 0.4,
    }


def _needs_review(emotion: str, confidence: float, quality: float) -> bool:
    return confidence < 0.4 or quality < 0.4 or (emotion in _NEGATIVE and confidence > 0.7)


def _session_to_dict(r) -> dict:
    return {
        "session_id": r.session_id, "user_id": r.user_id, "status": r.status,
        "start_time": r.start_time.isoformat() if r.start_time else None,
        "end_time": r.end_time.isoformat() if r.end_time else None,
        "duration_seconds": r.duration_seconds, "dominant_emotion": r.dominant_emotion,
        "average_confidence": r.average_confidence, "audio_quality_score": r.audio_quality_score,
        "requires_human_review": r.requires_human_review, "review_request_id": r.review_request_id,
        "audio_source": r.audio_source,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


async def _convert_audio_bytes(file_bytes: bytes) -> bytes:
    if not file_bytes:
        raise ValidationError("Audio file is empty")

    logger.debug(f"Starting FFmpeg conversion for audio bytes ({len(file_bytes)} bytes)")
    
    fd_in, path_in = tempfile.mkstemp(suffix=".webm")
    fd_out, path_out = tempfile.mkstemp(suffix=".wav")
    os.close(fd_in)
    os.close(fd_out)
    
    try:
        with open(path_in, "wb") as f:
            f.write(file_bytes)
            
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        
        def run_ffmpeg():
            return subprocess.run(
                [
                    ffmpeg_exe,
                    '-y',
                    '-i', path_in,
                    '-ac', '1',
                    '-ar', '16000',
                    '-f', 'wav',
                    path_out,
                ],
                capture_output=True,
                check=False
            )
            
        process = await asyncio.to_thread(run_ffmpeg)
        
        if process.returncode != 0:
            logger.error(f"FFmpeg conversion failed: {process.stderr.decode(errors='replace')}")
            raise ValidationError("Failed to process audio file format. File may be corrupted or unsupported.")
            
        with open(path_out, "rb") as f:
            out_bytes = f.read()
            
        logger.debug(f"FFmpeg conversion successful, new size: {len(out_bytes)} bytes")
        return out_bytes
    except Exception as exc:
        if isinstance(exc, ValidationError):
            raise
        logger.exception(f"Exception during FFmpeg conversion: {repr(exc)}")
        raise ValidationError("Internal error during audio format conversion")
    finally:
        try:
            os.remove(path_in)
        except OSError:
            pass
        try:
            os.remove(path_out)
        except OSError:
            pass


class SpeechAnalysisService:
    def __init__(
        self,
        analyzer: SpeechAnalyzer,
        reasoner: SpeechReasoner,
        audio_repo: AudioSessionRepository,
        review_repo: AudioAnalysisReviewRepository,
        notification_svc: NotificationService,
        audit_logger: AuditLogger,
    ):
        self.analyzer = analyzer
        self.reasoner = reasoner
        self.audio_repo = audio_repo
        self.review_repo = review_repo
        self.notification_svc = notification_svc
        self.audit_logger = audit_logger

    def start_session(self, user_id: str, audio_source: str, bg_tasks) -> AudioSessionResponse:
        session_id = f"aud_{uuid.uuid4().hex}"
        now = datetime.now(timezone.utc)
        record = self.audio_repo.create({
            "session_id": session_id, "user_id": user_id, "status": "active",
            "audio_source": audio_source, "start_time": now, "created_at": now,
        })
        bg_tasks.add_task(
            self.audit_logger.log, AuditEventType.AUDIO_ANALYSIS_START,
            user_id=user_id, action="start_audio_session",
            status="success", duration_ms=0.0, request_id=session_id,
        )
        return AudioSessionResponse(
            session_id=record.session_id, user_id=record.user_id,
            status=record.status, start_time=record.start_time,
        )

    async def analyze_file(
        self, session_id: str, user_id: str, file_bytes: bytes, filename: str, bg_tasks,
    ) -> AudioFileAnalysisResponse:
        logger.info(f"analyze_file started for session: {session_id}, filename: {filename}, size: {len(file_bytes)}")
        
        if not file_bytes or len(file_bytes) < 100:
            logger.error(f"Audio file is empty or too small: {len(file_bytes)} bytes")
            raise ValidationError("Audio file is empty or invalid")

        converted_bytes = await _convert_audio_bytes(file_bytes)

        start_t = time.perf_counter()

        record = self.audio_repo.find_by_session_id(session_id)
        if not record:
            logger.error(f"Audio session not found: {session_id}")
            raise NotFoundError(f"Audio session '{session_id}' not found")
        require_owner(record.user_id, user_id)

        request_id = f"audreq_{uuid.uuid4().hex[:12]}"
        logger.debug(f"Dispatching inference for request_id: {request_id}")
        prediction = await speech_runner.run(
            self.analyzer.predict, converted_bytes, request_id=request_id,
        )
        logger.debug(f"Inference completed for request_id: {request_id}")

        emotion = prediction["dominant_emotion"]
        confidence = prediction["confidence"]
        duration = float(prediction.get("duration_seconds", 0.0))
        quality = float(prediction.get("audio_quality_score", 0.0))
        if duration <= 0.0:
            duration = await asyncio.to_thread(_safe_duration, converted_bytes)

        insights = _compute_insights(emotion, confidence, quality)
        agentic = await self._run_agentic(prediction)
        requires_review = _needs_review(emotion, confidence, quality)
        review_id = (
            self._create_review(session_id, user_id, emotion, confidence, quality, agentic)
            if requires_review else None
        )
        now = datetime.now(timezone.utc)

        self._persist_analysis(
            session_id, emotion, confidence, prediction["distribution"],
            duration, quality, requires_review, review_id, insights, filename,
        )

        duration_ms = (time.perf_counter() - start_t) * 1000
        bg_tasks.add_task(
            self.audit_logger.log, AuditEventType.AUDIO_ANALYSIS_COMPLETE,
            user_id=user_id, action="analyze_audio_file", status="success",
            duration_ms=duration_ms, request_id=session_id,
            extra={"dominant_emotion": emotion, "requires_review": requires_review},
        )
        bg_tasks.add_task(
            self.notification_svc.notify_analysis_complete,
            user_id=user_id, analysis_type="audio",
        )

        return AudioFileAnalysisResponse(
            session_id=session_id, audio_file=filename, duration_seconds=duration,
            dominant_emotion=emotion, confidence=confidence,
            emotion_distribution=prediction["distribution"], audio_quality_score=quality,
            requires_human_review=requires_review, review_request_id=review_id,
            clinical_insights=insights, agentic_analysis=agentic, timestamp=now,
        )

    async def analyze_chunk(
        self, request: AudioAnalysisRequest, user_id: str, file_bytes: bytes, bg_tasks,
    ) -> AudioAnalysisResult:
        logger.info(f"analyze_chunk started for session: {request.session_id}, chunk_index: {request.chunk_index}, size: {len(file_bytes)}")
        
        if not file_bytes or len(file_bytes) < 100:
            logger.error(f"Audio chunk is empty or too small: {len(file_bytes)} bytes")
            raise ValidationError("Audio chunk is empty or invalid")

        converted_bytes = await _convert_audio_bytes(file_bytes)

        record = self.audio_repo.find_by_session_id(request.session_id)
        if not record:
            logger.error(f"Audio session not found: {request.session_id}")
            raise NotFoundError(f"Audio session '{request.session_id}' not found")
        require_owner(record.user_id, user_id)

        start_t = time.perf_counter()
        request_id = f"chunk_{uuid.uuid4().hex[:12]}"
        logger.debug(f"Dispatching inference for chunk request_id: {request_id}")
        prediction = await speech_runner.run(
            self.analyzer.predict, converted_bytes, request_id=request_id,
        )
        logger.debug(f"Inference completed for chunk request_id: {request_id}")
        emotion = prediction["dominant_emotion"]
        confidence = prediction["confidence"]

        clinical_insight: Optional[str] = None
        if self.reasoner.is_available():
            try:
                raw = await self.reasoner.call_llm(self.reasoner.build_prompt(prediction))
                parsed = self.reasoner.parse_response(raw)
                insights_list = parsed.get("prosodic_insights", [])
                clinical_insight = insights_list[0] if insights_list else (parsed.get("clinical_flags") or [""])[0]
            except Exception as exc:
                logger.warning("speech_chunk_reasoner_fallback", extra={"error": str(exc)})

        self._append_chunk_metadata(request.session_id, emotion, confidence)
        duration_ms = (time.perf_counter() - start_t) * 1000
        bg_tasks.add_task(
            self.audit_logger.log, AuditEventType.AUDIO_ANALYSIS_COMPLETE,
            user_id=user_id, action="analyze_speech_chunk", status="success",
            duration_ms=duration_ms, request_id=request.session_id,
        )
        return AudioAnalysisResult(
            session_id=request.session_id, chunk_index=request.chunk_index,
            emotion=emotion, confidence=confidence, quality_score=1.0,
            clinical_insight=clinical_insight,
        )

    async def analyze_stream(
        self, user_id: str, chunks: list[bytes], bg_tasks,
    ) -> AudioFileAnalysisResponse:
        session_resp = self.start_session(user_id, "stream", bg_tasks)
        merged = b"".join(chunks)
        return await self.analyze_file(session_resp.session_id, user_id, merged, "stream.wav", bg_tasks)

    def _persist_analysis(
        self, session_id: str, emotion: str, confidence: float, distribution: dict,
        duration: float, quality: float, requires_review: bool, review_id: Optional[str],
        insights: dict, filename: str,
    ) -> None:
        record = self.audio_repo.find_by_session_id(session_id)
        if not record:
            return
        self.audio_repo.update(record.id, {
            "status": "completed", "end_time": datetime.now(timezone.utc),
            "duration_seconds": duration, "dominant_emotion": emotion,
            "average_confidence": confidence, "audio_quality_score": quality,
            "requires_human_review": requires_review, "review_request_id": review_id,
            "analysis_metadata": {
                "analysis_type": "audio",
                "distribution": distribution,
                "clinical_insights": insights,
                "filename": filename,
            },
        })

    def _append_chunk_metadata(self, session_id: str, emotion: str, confidence: float) -> None:
        record = self.audio_repo.find_by_session_id(session_id)
        if not record:
            return
        meta = record.analysis_metadata or {}
        chunks = meta.get("chunks", [])
        chunks.append({"emotion": emotion, "confidence": float(confidence)})
        meta["chunks"] = chunks
        self.audio_repo.update(record.id, {"analysis_metadata": meta})

    def end_session(self, session_id: str, user_id: str, bg_tasks) -> AudioSessionResponse:
        record = self.audio_repo.find_by_session_id(session_id)
        if not record:
            raise NotFoundError(f"Audio session '{session_id}' not found")
        require_owner(record.user_id, user_id)

        end_time = datetime.now(timezone.utc)
        duration = (end_time - to_utc(record.start_time)).total_seconds()
        chunks = (record.analysis_metadata or {}).get("chunks", [])
        if chunks:
            emotions = [c.get("emotion", "neutral") for c in chunks]
            dominant = max(set(emotions), key=emotions.count)
            avg_conf = sum(c.get("confidence", 0.0) for c in chunks) / len(chunks)
        else:
            dominant = record.dominant_emotion or "neutral"
            avg_conf = record.average_confidence or 0.0
        self.audio_repo.update(record.id, {
            "status": "completed", "end_time": end_time,
            "duration_seconds": duration, "dominant_emotion": dominant,
            "average_confidence": avg_conf,
        })
        bg_tasks.add_task(
            self.notification_svc.notify_analysis_complete,
            user_id=record.user_id, analysis_type="audio",
        )
        return AudioSessionResponse(
            session_id=record.session_id, user_id=record.user_id, status="completed",
            start_time=record.start_time, duration_seconds=duration,
            dominant_emotion=dominant, average_confidence=avg_conf,
        )

    def get_session(self, session_id: str, user_id: str) -> AudioSessionResponse:
        record = self.audio_repo.find_by_session_id(session_id)
        if not record:
            raise NotFoundError(f"Audio session '{session_id}' not found")
        require_owner(record.user_id, user_id)
        return AudioSessionResponse(
            session_id=record.session_id, user_id=record.user_id,
            status=record.status, start_time=record.start_time,
            duration_seconds=record.duration_seconds,
            dominant_emotion=record.dominant_emotion,
            average_confidence=record.average_confidence,
            requires_human_review=bool(record.requires_human_review),
            review_request_id=record.review_request_id,
        )

    def list_sessions(
        self, user_id: str, status: Optional[str], limit: int, offset: int,
    ) -> dict:
        page = max(1, offset // max(limit, 1) + 1)
        records = self.audio_repo.list_by_user(user_id, page=page, size=limit)
        if status:
            records = [r for r in records if r.status == status]
        return {
            "sessions": [_session_to_dict(r) for r in records],
            "total": len(records), "limit": limit, "offset": offset,
        }

    def save_feedback(self, session_id: str, user_id: str, feedback: dict) -> None:
        record = self.audio_repo.find_by_session_id(session_id)
        if not record:
            raise NotFoundError(f"Audio session '{session_id}' not found")
        require_owner(record.user_id, user_id)
        meta = record.analysis_metadata or {}
        meta["feedback"] = feedback
        self.audio_repo.update(record.id, {"analysis_metadata": meta})

    async def _run_agentic(self, prediction: dict) -> Optional[Dict[str, Any]]:
        if self.reasoner.is_available():
            try:
                raw = await asyncio.wait_for(
                    self.reasoner.call_llm(self.reasoner.build_prompt(prediction)),
                    timeout=30,
                )
                return self.reasoner.parse_response(raw)
            except Exception as exc:
                logger.warning("speech_agentic_fallback", extra={"error": str(exc)})
        return self.reasoner.build_fallback(prediction)

    def _create_review(
        self, session_id: str, user_id: str, emotion: str, confidence: float,
        quality: float, agentic: Optional[dict],
    ) -> Optional[str]:
        try:
            review_id = f"aud_rev_{uuid.uuid4().hex[:16]}"
            priority = "high" if emotion in {"sad", "fearful"} and confidence > 0.7 else "medium"
            summary = None
            if agentic:
                insights = agentic.get("prosodic_insights", [])
                summary = insights[0] if insights else None
            self.review_repo.create({
                "review_id": review_id, "session_id": session_id, "user_id": user_id,
                "reviewer_id": "pending", "dominant_emotion_ai": emotion,
                "ai_confidence": confidence, "audio_quality_score": quality,
                "ai_summary": summary, "priority": priority,
                "status": "pending", "created_at": datetime.now(timezone.utc),
            })
            return review_id
        except Exception as exc:
            logger.error("audio_review_create_failed", extra={"error": str(exc)})
            return None


def _safe_duration(file_bytes: bytes) -> float:
    try:
        info = sf.info(io.BytesIO(file_bytes))
        return float(info.duration)
    except Exception:
        return 0.0

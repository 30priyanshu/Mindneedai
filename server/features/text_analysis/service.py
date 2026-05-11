import asyncio
import hashlib
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import BackgroundTasks
from loguru import logger

from server.analysis.shared.inference_runner import text_runner
from server.analysis.text.analyzer import TextAnalyzer
from server.analysis.text.reasoner import TextReasoner
from server.db.repositories.analysis_repo import AnalysisRepository
from server.features.notifications.service import NotificationService
from server.features.text_analysis.schemas import (
    AnalysisResponse, PredictionModel, ReasonerAnalysisModel, TextAnalysisRequest,
)
from server.security.audit import AuditEventType, AuditLogger
from server.security.privacy import PrivacyManager

_NEGATIVE_LABELS = {"negative", "sad", "depressed", "fearful", "angry"}
_HIGH_RISK_TERMS = {"suicide", "self-harm", "end my life", "kill myself"}

_FALLBACK_RECOMMENDATIONS: dict[str, list[str]] = {
    "sad": [
        "Consider speaking with a mental health professional",
        "Stay connected with loved ones",
        "Practice gratitude journaling daily",
    ],
    "depressed": [
        "Consider speaking with a mental health professional",
        "Stay connected with loved ones",
        "Practice gratitude journaling daily",
    ],
    "fearful": [
        "Practice deep breathing exercises",
        "Engage in physical activity",
        "Try progressive muscle relaxation",
    ],
    "angry": [
        "Practice deep breathing exercises",
        "Engage in physical activity",
        "Try mindfulness meditation for emotional regulation",
    ],
}
_FALLBACK_DEFAULT = [
    "Continue regular self-care routines",
    "Stay hydrated and maintain sleep schedule",
    "Practice mindfulness or meditation",
]


class TextAnalysisService:
    def __init__(
        self,
        analyzer: TextAnalyzer,
        reasoner: TextReasoner,
        analysis_repo: AnalysisRepository,
        notification_svc: NotificationService,
        audit_logger: AuditLogger,
        privacy_manager: PrivacyManager,
    ):
        self.analyzer = analyzer
        self.reasoner = reasoner
        self.analysis_repo = analysis_repo
        self.notification_svc = notification_svc
        self.audit_logger = audit_logger
        self.privacy_manager = privacy_manager

    def _determine_review_requirement(self, confidence: float, is_negative: bool) -> bool:
        if confidence < 0.60:
            return True
        if is_negative and confidence > 0.80:
            return True
        return False

    def _categorize_confidence(self, confidence: float) -> str:
        if confidence >= 0.9:
            return "Very High"
        if confidence >= 0.75:
            return "High"
        if confidence >= 0.6:
            return "Moderate"
        return "Low"

    def _contains_high_risk(self, text: str, clinical_insight: str) -> bool:
        combined = (text + " " + clinical_insight).lower()
        return any(term in combined for term in _HIGH_RISK_TERMS)

    def _fallback_recommendations(self, label: str) -> list[str]:
        return _FALLBACK_RECOMMENDATIONS.get(label.lower(), _FALLBACK_DEFAULT)

    def _fallback_personalized_response(self, label: str, confidence: float) -> str:
        sentiment = label.capitalize()
        level = self._categorize_confidence(confidence).lower()
        return (
            f"Your text reflects a {sentiment.lower()} sentiment detected with {level} confidence. "
            "Remember that emotional awareness is an important step in self-care. "
            "Take a moment to reflect on your feelings and consider reaching out to someone you trust."
        )

    async def analyze(
        self, request: TextAnalysisRequest, user_id: str, bg_tasks: BackgroundTasks,
    ) -> AnalysisResponse:
        start_time = time.perf_counter()
        request_id = f"txt_{uuid.uuid4().hex}"

        analysis_result = await text_runner.run_async(self.analyzer.predict_async, request.text, request_id=request_id)
        primary_label = analysis_result["primary_label"]
        confidence = analysis_result["confidence"]
        is_negative = primary_label.lower() in _NEGATIVE_LABELS

        agentic_response, personalized_response, care_recommendations = await self._run_agentic(
            analysis_result, primary_label, confidence
        )

        requires_review = self._determine_review_requirement(confidence, is_negative)
        review_request_id = f"rev_{uuid.uuid4().hex}" if requires_review else None

        clinical_insight = agentic_response.clinical_insight if agentic_response else ""
        if self._contains_high_risk(request.text, clinical_insight):
            bg_tasks.add_task(self._dispatch_emergency, user_id, request_id)
            bg_tasks.add_task(self.notification_svc.notify_emergency, user_id=user_id)

        text_hash = hashlib.sha256(request.text.encode()).hexdigest()
        encrypted_text = getattr(self.privacy_manager, "encrypt_data", lambda x: None)(request.text)

        record = self.analysis_repo.create({
            "request_id": request_id, "user_id": user_id,
            "text_hash": text_hash, "encrypted_text": encrypted_text,
            "prediction_label": primary_label, "confidence": confidence,
            "requires_human_review": requires_review, "review_request_id": review_request_id,
            "consent_token": request.consent_token,
            "training_eligible": bool(request.consent_token),
            "created_at": datetime.now(timezone.utc),
            "analysis_metadata": {"char_count": len(request.text), "analysis_type": "text"},
        })

        duration_ms = (time.perf_counter() - start_time) * 1000
        anon_id = getattr(self.privacy_manager, "anonymise_user_id", lambda i: i)(user_id)

        bg_tasks.add_task(
            self.audit_logger.log, AuditEventType.TEXT_ANALYSIS,
            user_id=anon_id, action="analyze_text", status="success",
            duration_ms=duration_ms, request_id=request_id,
            extra={"requires_review": requires_review, "confidence": confidence},
        )
        bg_tasks.add_task(self.notification_svc.notify_analysis_complete,
                         user_id=user_id, analysis_type="text")

        return AnalysisResponse(
            request_id=request_id, user_id=user_id,
            prediction=PredictionModel(label=primary_label, confidence=confidence),
            all_predictions=[
                PredictionModel(label=k, confidence=v)
                for k, v in analysis_result.get("raw_scores", {}).items()
            ],
            requires_human_review=requires_review,
            confidence_level=self._categorize_confidence(confidence),
            review_request_id=review_request_id,
            timestamp=record.created_at,
            agentic_analysis=agentic_response,
            care_recommendations=care_recommendations,
            personalized_response=personalized_response,
        )

    async def _run_agentic(
        self,
        analysis_result: dict,
        primary_label: str,
        confidence: float,
    ) -> tuple[Optional[ReasonerAnalysisModel], str, List[str]]:
        if not self.reasoner.is_available():
            return (
                None,
                self._fallback_personalized_response(primary_label, confidence),
                self._fallback_recommendations(primary_label),
            )
        try:
            prompt = self.reasoner.build_prompt(analysis_result)
            raw_llm = await asyncio.wait_for(
                self.reasoner.call_llm(prompt),
                timeout=30,
            )
            parsed = self.reasoner.parse_response(raw_llm)

            agentic = ReasonerAnalysisModel(
                clinical_insight=parsed.get("clinical_insight", ""),
                cognitive_distortions=parsed.get("cognitive_distortions", []),
                grounding_techniques=parsed.get("grounding_techniques", []),
            )

            personalized = parsed.get("personalized_response") or self._fallback_personalized_response(
                primary_label, confidence
            )
            recommendations = parsed.get("care_recommendations") or self._fallback_recommendations(primary_label)
            if not isinstance(recommendations, list):
                recommendations = self._fallback_recommendations(primary_label)

            return agentic, personalized, recommendations
        except Exception as exc:
            logger.warning("text_reasoner_fallback", extra={"label": primary_label, "error": str(exc)})
            return (
                None,
                self._fallback_personalized_response(primary_label, confidence),
                self._fallback_recommendations(primary_label),
            )

    def _dispatch_emergency(self, user_id: str, request_id: str) -> None:
        self.audit_logger.log(
            AuditEventType.EMERGENCY_ALERT, user_id=user_id,
            action="emergency_text_trigger", status="triggered",
            duration_ms=0.0, request_id=request_id,
        )

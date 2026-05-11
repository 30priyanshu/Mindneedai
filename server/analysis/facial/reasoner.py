import json
import logging
from typing import Any, Dict

from ..shared.base_reasoner import BaseReasoner
from server.infra.openai.client import openai_client, generate_completion
from server.config.settings import settings

logger = logging.getLogger(__name__)

_MAX_PROMPT_CHARS = 6000

_SYSTEM_PROMPT = (
    "You are an expert clinical psychologist skilled in analyzing facial emotion data "
    "from real-time video sessions. You provide empathetic, actionable insights. "
    "Respond strictly with valid JSON."
)

_VIDEO_SESSION_TEMPLATE = """\
Analyze the following real-time facial emotion session data.

Session Overview:
- Duration: {duration_seconds:.1f}s
- Total Frames: {total_frames}
- Valid Frames (face detected): {valid_frames}
- Dominant Emotion: {dominant_emotion} ({avg_confidence:.1f}% avg confidence)

Emotion Distribution:
{distribution_text}

Provide a JSON response with exactly these keys:
- "overall_sentiment": one-word overall sentiment label
- "emotional_stability": float between 0 and 1 (1 = very stable)
- "mood_trajectory": one of "improving", "declining", "stable", "volatile"
- "summary": 2-3 sentence clinical summary
- "recommendations": array of 2-4 actionable wellness recommendations
- "concerning_patterns": array of 0-3 patterns worth noting (empty if none)
- "quick_actions": array of 1-3 things the user can try right now
- "protective_factors": array of 0-3 positive indicators
- "confidence_score": float between 0 and 1 indicating analysis confidence
- "depression_risk_score": float between 0 and 1
- "anxiety_manifestation_score": float between 0 and 1
- "requires_human_review": boolean
"""


class FacialReasoner(BaseReasoner):

    def __init__(self):
        super().__init__(openai_client=openai_client)

    def build_prompt(self, analysis_result: Dict[str, Any]) -> str:
        distribution = analysis_result.get("emotion_distribution", {})
        dist_lines = "\n".join(
            f"  {em}: {pct * 100:.1f}%" for em, pct in sorted(distribution.items(), key=lambda x: -x[1])
        ) or "  (no distribution data)"

        prompt = _VIDEO_SESSION_TEMPLATE.format(
            duration_seconds=analysis_result.get("duration_seconds", 0),
            total_frames=analysis_result.get("total_frames", 0),
            valid_frames=analysis_result.get("valid_frames", 0),
            dominant_emotion=analysis_result.get("dominant_emotion", "Unknown"),
            avg_confidence=analysis_result.get("average_confidence", 0) * 100,
            distribution_text=dist_lines,
        )
        return prompt[:_MAX_PROMPT_CHARS]

    async def call_llm(self, prompt: str) -> str:
        messages = [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]
        response = await generate_completion(
            messages=messages,
            model=settings.openai_model,
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=800,
        )
        return response.choices[0].message.content or "{}"

    def parse_response(self, raw_response: str) -> Dict[str, Any]:
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [line for line in lines if not line.strip().startswith("```")]
            cleaned = "\n".join(lines)
        try:
            data = json.loads(cleaned)
            return self._normalise(data)
        except json.JSONDecodeError:
            logger.warning("facial_reasoner_parse_failed")
            return self._fallback()

    @staticmethod
    def _clamp(val: Any, lo: float = 0.0, hi: float = 1.0) -> float:
        try:
            return max(lo, min(hi, float(val)))
        except (TypeError, ValueError):
            return 0.0

    @classmethod
    def _normalise(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "summary": str(data.get("summary", "")),
            "overall_sentiment": str(data.get("overall_sentiment", "Neutral")),
            "emotional_stability": cls._clamp(data.get("emotional_stability", 0.5)),
            "mood_trajectory": data.get("mood_trajectory", "stable"),
            "recommendations": list(data.get("recommendations", [])),
            "concerning_patterns": list(data.get("concerning_patterns", [])),
            "quick_actions": list(data.get("quick_actions", [])),
            "protective_factors": list(data.get("protective_factors", [])),
            "confidence_score": cls._clamp(data.get("confidence_score", 0.3)),
            "depression_risk_score": cls._clamp(data.get("depression_risk_score", 0)),
            "anxiety_manifestation_score": cls._clamp(data.get("anxiety_manifestation_score", 0)),
            "requires_human_review": bool(data.get("requires_human_review", True)),
        }

    @staticmethod
    def _fallback() -> Dict[str, Any]:
        return {
            "summary": "Unable to generate detailed analysis.",
            "overall_sentiment": "Neutral",
            "emotional_stability": 0.5,
            "mood_trajectory": "stable",
            "recommendations": ["Take a moment to breathe and relax."],
            "concerning_patterns": [],
            "quick_actions": ["Try a short breathing exercise"],
            "protective_factors": [],
            "confidence_score": 0.3,
            "depression_risk_score": 0,
            "anxiety_manifestation_score": 0,
            "requires_human_review": True,
        }

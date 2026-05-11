import json
import logging
from typing import Any, Dict, List

from ..shared.base_reasoner import BaseReasoner
from server.infra.openai.client import openai_client, generate_completion
from server.config.settings import settings

logger = logging.getLogger(__name__)

_NEGATIVE = {"sad", "fearful", "angry", "disgust"}

_MAX_PROMPT_CHARS = 6000


class SpeechReasoner(BaseReasoner):

    def __init__(self):
        super().__init__(openai_client=openai_client)

    def build_prompt(self, analysis_result: Dict[str, Any]) -> str:
        emotion = analysis_result.get("dominant_emotion", "neutral")
        confidence = analysis_result.get("confidence", 0.0)
        distribution = analysis_result.get("distribution", {})

        negative_ratio = sum(distribution.get(e, 0.0) for e in _NEGATIVE)
        positive_ratio = distribution.get("happy", 0.0) + distribution.get("calm", 0.0)
        active_count = len([v for v in distribution.values() if v > 0.1])

        dist_lines = "\n".join(
            f"- {e.title()}: {v * 100:.1f}%"
            for e, v in distribution.items()
            if v > 0.05
        )

        prompt = (
            "Analyze the following speech emotion data and provide supportive, "
            "user-focused insights.\n\n"
            f"Dominant Emotion: {emotion} ({confidence * 100:.1f}% confidence)\n"
            f"Emotion Distribution:\n{dist_lines}\n\n"
            f"Positive emotions: {positive_ratio * 100:.1f}%\n"
            f"Challenging emotions: {negative_ratio * 100:.1f}%\n"
            f"Emotional variety: {active_count} distinct emotions\n\n"
            "Respond with a JSON object containing EXACTLY these keys:\n"
            "{\n"
            '  "overall_sentiment": "A warm one-sentence assessment of their emotional tone",\n'
            '  "emotional_stability": 0.0-1.0,\n'
            '  "detailed_summary": "An encouraging 2-3 sentence paragraph highlighting '
            'vocal strengths first, then gentle observations. Use supportive language.",\n'
            '  "recommendations": ["3-5 user-actionable wellness suggestions"],\n'
            '  "concerning_patterns": ["ONLY if negative_ratio > 0.65, otherwise empty array"],\n'
            '  "quick_actions": ["2-4 immediate 1-minute activities they can try right now"],\n'
            '  "prosodic_insights": ["2-3 observations about their voice patterns"],\n'
            '  "clinical_flags": ["Only genuine clinical concerns, otherwise empty"]\n'
            "}\n\n"
            "Guidelines:\n"
            "- Start with strengths and positives\n"
            "- Frame concerns as growth opportunities\n"
            "- Suggestions should be activities, not medical referrals\n"
            "- Use warm, conversational language\n"
            "- Only flag concerning_patterns when negative_ratio > 0.65"
        )
        return prompt[:_MAX_PROMPT_CHARS]

    async def call_llm(self, prompt: str) -> str:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a supportive mental wellness companion analyzing speech emotion data. "
                    "Respond strictly with valid JSON. Be encouraging and strength-based."
                ),
            },
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
        try:
            start = raw_response.find("{")
            end = raw_response.rfind("}") + 1
            if start >= 0 and end > start:
                parsed = json.loads(raw_response[start:end])
            else:
                parsed = json.loads(raw_response)
            return self._normalise(parsed)
        except (json.JSONDecodeError, ValueError):
            logger.warning("speech_reasoner_parse_failed")
            return self._fallback()

    def build_fallback(self, analysis_result: Dict[str, Any]) -> Dict[str, Any]:
        emotion = analysis_result.get("dominant_emotion", "neutral")
        confidence = analysis_result.get("confidence", 0.0)
        distribution = analysis_result.get("distribution", {})

        negative_ratio = sum(distribution.get(e, 0.0) for e in _NEGATIVE)
        positive_ratio = distribution.get("happy", 0.0) + distribution.get("calm", 0.0)
        active_count = len([v for v in distribution.values() if v > 0.1])

        stability = max(0.3, 1.0 - negative_ratio)

        if positive_ratio > 0.4:
            sentiment = "Your voice is full of positive energy and warmth."
            summary = (
                f"Your voice reflects genuine {emotion} with strong positive expression. "
                "This shows healthy emotional engagement. "
                "Keep nurturing what brings you joy!"
            )
        elif negative_ratio > 0.65:
            sentiment = "Your voice suggests you may be experiencing some emotional challenges."
            summary = (
                f"Your voice primarily conveys {emotion}, which tells us you may be going through "
                "a difficult time. It's okay to feel this way. "
                "Consider reaching out to someone you trust."
            )
        else:
            sentiment = "Your voice shows a balanced emotional state."
            summary = (
                f"Your voice reflects {emotion} as the primary tone, with a natural range of "
                "emotional expressions. This variety in your voice shows healthy emotional awareness."
            )

        recommendations: List[str] = []
        if positive_ratio > 0.4:
            recommendations.extend([
                "Keep engaging in activities that bring you joy",
                "Share your positive energy with others",
            ])
        if negative_ratio > 0.5:
            recommendations.extend([
                "Try activities that usually lift your mood, like listening to music",
                "Gentle movement or deep breathing can help ease tension",
            ])
        if active_count >= 3:
            recommendations.append("Your emotional expressiveness is a strength — keep being authentic")
        if confidence < 0.4:
            recommendations.append("Try recording in a quieter space for better analysis")
        if not recommendations:
            recommendations.extend([
                "Keep expressing yourself — your voice matters",
                "Consider regular check-ins through voice recordings",
            ])

        concerning: List[str] = []
        if negative_ratio > 0.65:
            concerning.append("You seem to be experiencing significant emotional challenges")
        if negative_ratio > 0.75:
            concerning.append("Consider reaching out to a trusted friend or counselor")

        quick_actions = [
            "Take 3 slow, deep breaths",
            "Stretch your arms above your head",
            "Hum your favorite tune for 30 seconds",
        ]
        if negative_ratio > 0.5:
            quick_actions.append("Place your hand on your heart and take a calming moment")

        return {
            "overall_sentiment": sentiment,
            "emotional_stability": round(stability, 2),
            "detailed_summary": summary,
            "recommendations": recommendations,
            "concerning_patterns": concerning,
            "quick_actions": quick_actions,
            "prosodic_insights": [],
            "clinical_flags": [],
        }

    @staticmethod
    def _normalise(data: Dict[str, Any]) -> Dict[str, Any]:
        stability = data.get("emotional_stability", 0.5)
        try:
            stability = max(0.0, min(1.0, float(stability)))
        except (TypeError, ValueError):
            stability = 0.5
        return {
            "overall_sentiment": str(data.get("overall_sentiment", "")),
            "emotional_stability": stability,
            "detailed_summary": str(data.get("detailed_summary", "")),
            "recommendations": list(data.get("recommendations", [])),
            "concerning_patterns": list(data.get("concerning_patterns", [])),
            "quick_actions": list(data.get("quick_actions", [])),
            "prosodic_insights": list(data.get("prosodic_insights", [])),
            "clinical_flags": list(data.get("clinical_flags", [])),
        }

    @staticmethod
    def _fallback() -> Dict[str, Any]:
        return {
            "overall_sentiment": "Analysis unavailable — please try again.",
            "emotional_stability": 0.5,
            "detailed_summary": "We couldn't process the agentic insights this time. "
                                "Your basic emotion analysis is still available above.",
            "recommendations": ["Try recording again in a quiet environment"],
            "concerning_patterns": [],
            "quick_actions": ["Take a moment to breathe deeply"],
            "prosodic_insights": [],
            "clinical_flags": [],
        }

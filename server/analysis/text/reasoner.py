import json
import logging
from typing import Any, Dict

from server.analysis.shared.base_reasoner import BaseReasoner
from server.infra.openai.client import openai_client, generate_completion
from server.config.settings import settings

logger = logging.getLogger(__name__)

_MAX_PROMPT_CHARS = 6000


class TextReasoner(BaseReasoner):

    def __init__(self):
        super().__init__(openai_client=openai_client)

    def build_prompt(self, analysis_result: Dict[str, Any]) -> str:
        primary_label = analysis_result.get("primary_label", "Unknown")
        confidence = analysis_result.get("confidence", 0.0)
        raw_scores = analysis_result.get("raw_scores", {})

        scores_summary = ", ".join(
            f"{label}: {score:.2f}" for label, score in sorted(raw_scores.items(), key=lambda x: -x[1])
        )

        prompt = (
            f"A local NLP model detected a primary sentiment of '{primary_label}' "
            f"with confidence {confidence:.2f}. Full score distribution: [{scores_summary}].\n\n"
            "Analyze from a clinical psychology perspective. Respond ONLY with valid JSON:\n"
            "{\n"
            '  "clinical_insight": "<2-3 sentence clinical interpretation>",\n'
            '  "cognitive_distortions": ["<distortion 1>", ...],\n'
            '  "grounding_techniques": ["<technique 1>", ...],\n'
            '  "personalized_response": "<empathetic 2-4 sentence message to the user>",\n'
            '  "care_recommendations": ["<recommendation 1>", "<recommendation 2>", ...]\n'
            "}"
        )
        return prompt[:_MAX_PROMPT_CHARS]

    async def call_llm(self, prompt: str) -> str:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert clinical psychologist AI. Provide evidence-based, "
                    "empathetic analysis. Always respond with valid JSON only."
                ),
            },
            {"role": "user", "content": prompt},
        ]
        try:
            response = await generate_completion(
                messages=messages,
                model=settings.openai_model,
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=600,
            )
            return response.choices[0].message.content or "{}"
        except Exception as e:
            logger.error("TextReasoner LLM invocation failed: %s", e)
            raise RuntimeError(f"Text reasoning LLM generation failed: {e}") from e

    def parse_response(self, raw_response: str) -> Dict[str, Any]:
        try:
            data = json.loads(raw_response)
        except json.JSONDecodeError as e:
            logger.error("text_reasoner_parse_failed")
            raise ValueError("Malformed JSON response from text LLM.") from e
        return {
            "clinical_insight": str(data.get("clinical_insight", "")),
            "cognitive_distortions": list(data.get("cognitive_distortions", [])),
            "grounding_techniques": list(data.get("grounding_techniques", [])),
            "personalized_response": str(data.get("personalized_response", "")),
            "care_recommendations": list(data.get("care_recommendations", [])),
        }

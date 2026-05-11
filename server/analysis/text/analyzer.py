"""Text emotion analyzer using Google Gemini API."""
from __future__ import annotations

import json
from typing import Any, Dict, Optional

from google import genai
from google.genai import types
from loguru import logger

from server.config.settings import settings
from server.exceptions import ModelNotLoadedError

from ..shared.base_analyzer import BaseAnalyzer


class TextAnalyzer(BaseAnalyzer):
    def __init__(
        self,
        model_name: str = "gemini-2.5-flash",
        cache_dir: Optional[str] = None,
    ) -> None:
        self.model_name = model_name
        self._is_loaded = False
        self.client: Optional[genai.Client] = None

    def load_model(self) -> None:
        api_key = settings.gemini_api_key
        if not api_key:
            logger.warning("GEMINI_API_KEY not set in environment.")
            raise RuntimeError("GEMINI_API_KEY is not set.")
        
        self.client = genai.Client(api_key=api_key)
        self._is_loaded = True
        logger.info("text_model_loaded_gemini", extra={"model": self.model_name})

    def predict(self, input_data: Any) -> Dict[str, Any]:
        """Sync fallback — prefer predict_async() for live requests."""
        if not self.is_loaded or self.client is None:
            raise ModelNotLoadedError("Text model not loaded")
        if not isinstance(input_data, str) or not input_data.strip():
            raise ValueError("Text prediction requires a non-empty string input data.")
        prompt = self._make_prompt(input_data)
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text)
            return self._build_result(
                data.get("primary_label", "neutral"),
                data.get("confidence", 0.5),
                data.get("raw_scores", {}),
            )
        except Exception as exc:
            logger.error("gemini_text_prediction_failed", extra={"error": str(exc)})
            return self._build_result("neutral", 0.0, {})

    def _make_prompt(self, input_data: str) -> str:
        return f"""
Analyze the emotional sentiment of the following text.
Classify the primary emotion into exactly one of these categories:
happy, sad, angry, fearful, depressed, neutral.

Return ONLY a valid JSON object with these keys:
- "primary_label": one of [happy, sad, angry, fearful, depressed, neutral]
- "confidence": float between 0.0 and 1.0
- "raw_scores": object mapping each emotion label to a float score

Text to analyze:
\"{input_data}\"
"""

    def _build_result(self, label: str, confidence: float, raw_scores: dict) -> dict:
        valid = {"happy", "sad", "angry", "fearful", "depressed", "neutral"}
        clean = label.lower().strip()
        return {
            "domain": "text",
            "primary_label": clean if clean in valid else "neutral",
            "confidence": float(confidence),
            "raw_scores": raw_scores,
        }

    async def predict_async(self, input_data: Any) -> dict:
        """Async version using Gemini async client — preferred over predict()."""
        if not self.is_loaded or self.client is None:
            raise ModelNotLoadedError("Text model not loaded")
        if not isinstance(input_data, str) or not input_data.strip():
            raise ValueError("Input must be a non-empty string.")
        prompt = self._make_prompt(input_data)
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text)
            return self._build_result(
                data.get("primary_label", "neutral"),
                data.get("confidence", 0.5),
                data.get("raw_scores", {}),
            )
        except Exception as exc:
            logger.error("gemini_async_prediction_failed", extra={"error": str(exc)})
            raise


    def unload(self) -> None:
        self.client = None
        self._is_loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def health_check(self) -> dict:
        return {"loaded": self.is_loaded, "model_name": self.model_name}

"""FacialAnalyzer using Google Gemini API for emotion inference."""
from __future__ import annotations

import os
import json
import math
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
from google import genai
from google.genai import types
import PIL.Image
from loguru import logger

from server.config.settings import settings
from server.exceptions import ModelNotLoadedError
from ..shared.base_analyzer import BaseAnalyzer

class FacialAnalyzerError(Exception):
    pass

@dataclass
class FacialTemporalState:
    """Temporal state."""
    history_size: int = 10
    prediction_history: List[Any] = field(default_factory=list)

class FacialAnalyzer(BaseAnalyzer):
    EMOTIONS: Dict[int, str] = {0: "Neutral", 1: "Happiness", 2: "Sadness", 3: "Surprise", 4: "Fear", 5: "Disgust", 6: "Anger"}
    _DETECTION_SCALE = 0.5
    _MIN_FACE_SIZE = 40

    def __init__(self, model_dir: Optional[str] = None) -> None:
        self.model_name = "gemini-2.5-flash"
        self._is_loaded = False
        self._haar_cascade: Optional[cv2.CascadeClassifier] = None
        self.client: Optional[genai.Client] = None

    def load_model(self) -> None:
        api_key = settings.gemini_api_key
        if not api_key:
            logger.warning("GEMINI_API_KEY not set in environment.")
            raise RuntimeError("GEMINI_API_KEY is not set.")
        
        self.client = genai.Client(api_key=api_key)
        
        self._haar_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self._is_loaded = True
        logger.info("facial_model_loaded_gemini", extra={"model": self.model_name})

    def unload(self) -> None:
        self.client = None
        self._haar_cascade = None
        self._is_loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def health_check(self) -> dict:
        return {"loaded": self.is_loaded, "model_name": self.model_name}

    def detect_face(self, frame_bgr: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Locate the largest face on a downsampled BGR frame; returns full-resolution box."""
        if not self.is_loaded:
            raise ModelNotLoadedError("Facial model not loaded")
            
        h, w = frame_bgr.shape[:2]
        dh, dw = int(h * self._DETECTION_SCALE), int(w * self._DETECTION_SCALE)
        small = cv2.resize(frame_bgr, (dw, dh), interpolation=cv2.INTER_LINEAR)
        box: Optional[Tuple[int, int, int, int]] = None

        if self._haar_cascade is not None:
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            faces = self._haar_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
            if len(faces) > 0:
                x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
                box = (int(x), int(y), int(x + fw), int(y + fh))
                
        if box is None:
            return None
            
        scale = 1.0 / self._DETECTION_SCALE
        return (
            int(box[0] * scale),
            int(box[1] * scale),
            min(int(box[2] * scale), w - 1),
            min(int(box[3] * scale), h - 1),
        )

    def predict(self, frame: np.ndarray, state: Optional[FacialTemporalState] = None) -> Dict[str, Any]:
        """Detect face + classify emotion."""
        if not self.is_loaded:
            raise ModelNotLoadedError("Facial model not loaded")
        if state is None:
            state = FacialTemporalState()
        face_box = self.detect_face(frame)
        if face_box is None:
            return self._empty_result()
        x1, y1, x2, y2 = face_box
        face_rgb = cv2.cvtColor(frame[y1:y2, x1:x2], cv2.COLOR_BGR2RGB)
        if face_rgb.size == 0:
            return self._empty_result()
        emotion, confidence = self.infer_emotion(face_rgb, state)
        return {
            "dominant_emotion": emotion,
            "confidence": confidence,
            "face_detected": True,
            "face_box": [x1, y1, x2, y2],
            "requires_review": self._needs_review(emotion, confidence),
        }

    def infer_emotion(self, face_rgb: np.ndarray, state: FacialTemporalState) -> Tuple[str, float]:
        """Run inference using Gemini."""
        if not self.is_loaded or self.client is None:
            raise ModelNotLoadedError("Facial model not loaded")
            
        try:
            image = PIL.Image.fromarray(face_rgb)
            prompt = """
            Analyze the facial expression in this image.
            Classify the dominant emotion into exactly one of these categories:
            Neutral, Happiness, Sadness, Surprise, Fear, Disgust, Anger.
            
            Return the result strictly as a valid JSON object with:
            - "emotion": the emotion string from the list above.
            - "confidence": a float between 0.0 and 1.0.
            """
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt, image],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text)
            
            emotion_raw = data.get("emotion", "Neutral").capitalize()
            
            # Map common synonyms that Gemini might return despite the prompt
            synonym_map = {
                "Happy": "Happiness",
                "Joy": "Happiness",
                "Sad": "Sadness",
                "Angry": "Anger",
                "Fearful": "Fear",
                "Surprised": "Surprise",
                "Disgusted": "Disgust"
            }
            emotion = synonym_map.get(emotion_raw, emotion_raw)
            
            if emotion not in self.EMOTIONS.values():
                emotion = "Neutral"
            confidence = float(data.get("confidence", 0.5))
            
            return emotion, confidence
        except Exception as exc:
            logger.warning("gemini_facial_inference_failed", extra={"error": str(exc)})
            return "Neutral", 0.0

    @staticmethod
    def _empty_result() -> Dict[str, Any]:
        return {
            "dominant_emotion": "Neutral",
            "confidence": 0.0,
            "face_detected": False,
            "face_box": None,
            "requires_review": False,
        }

    @staticmethod
    def _needs_review(emotion: str, confidence: float) -> bool:
        if confidence < 0.5:
            return True
        return emotion in ("Sadness", "Fear", "Anger", "Disgust") and confidence > 0.7

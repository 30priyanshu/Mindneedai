import base64
import io
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from loguru import logger
import soundfile as sf
import librosa
import numpy as np
from google import genai
from google.genai import types

from server.config.settings import settings
from server.exceptions import ModelNotLoadedError

from ..shared.base_analyzer import BaseAnalyzer

AudioSource = Union[str, Path, bytes, bytearray, memoryview, io.BytesIO]

class SpeechAnalyzerError(Exception):
    pass

class SpeechAnalyzer(BaseAnalyzer):
    """Stateless Gemini API inference over arbitrary in-memory or on-disk audio."""

    TARGET_SR = 16000

    def __init__(self, **kwargs) -> None:
        self.emotion_labels: List[str] = [
            "angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised",
        ]
        self.model_name = "gemini-2.5-flash"
        self._is_loaded = False
        self.client: Optional[genai.Client] = None

    def load_model(self) -> None:
        api_key = settings.gemini_api_key
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set. Emotion analysis may fail.")
            raise RuntimeError("GEMINI_API_KEY is not set.")
        self.client = genai.Client(api_key=api_key)
        self._is_loaded = True
        logger.info("speech_model_loaded_gemini", extra={"model": self.model_name})

    def unload(self) -> None:
        self.client = None
        self._is_loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def health_check(self) -> dict:
        return {"loaded": self.is_loaded, "provider": "gemini_api"}

    def predict(self, input_data: AudioSource) -> Dict[str, Any]:
        if not self.is_loaded or self.client is None:
            raise ModelNotLoadedError("Speech analyzer not initialized")
        
        try:
            waveform, sr = self._load_audio(input_data)
            duration = waveform.shape[0] / sr
            wav_bytes = self._to_wav_bytes(waveform, sr)
        except Exception as e:
            logger.error(f"Failed to load/convert audio: {e}")
            return self._empty(duration=0.0)
            
        try:
            part = types.Part.from_bytes(data=wav_bytes, mime_type="audio/wav")
            prompt = """
            Analyze the emotion in this audio recording. 
            Consider both the acoustic tone of voice AND the semantic meaning of the words spoken (e.g., if the user explicitly says they are sad or feeling low, factor that heavily into the classification).
            
            Classify the dominant emotion into exactly one of these categories:
            angry, calm, disgust, fearful, happy, neutral, sad, surprised.
            
            Return the result strictly as a valid JSON object with:
            - "dominant_emotion": the exact emotion string from the list above (lowercase).
            - "confidence": a float between 0.0 and 1.0 representing your confidence in the dominant emotion.
            - "distribution": a dictionary with all 8 categories as keys and their confidence scores as floats (summing to approximately 1.0).
            """
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt, part],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text)
            
            emotion = data.get("dominant_emotion", "neutral").lower()
            if emotion not in self.emotion_labels:
                emotion = "neutral"
                
            confidence = float(data.get("confidence", 0.0))
            distribution = data.get("distribution", {})
            for label in self.emotion_labels:
                if label not in distribution:
                    distribution[label] = 0.0
                    
            return {
                "dominant_emotion": emotion,
                "confidence": confidence,
                "distribution": distribution,
                "duration_seconds": float(max(0.0, duration)),
                "audio_quality_score": self._quality(waveform),
                "requires_review": self._needs_review(emotion, confidence),
            }
        except Exception as e:
            logger.error(f"Gemini API request failed: {e}")
            return self._empty(duration=duration)

    def _load_audio(self, source: AudioSource) -> Tuple[np.ndarray, int]:
        if isinstance(source, (bytes, bytearray, memoryview)):
            buf = io.BytesIO(bytes(source))
            return self._read_buffer_or_disk(buf, hint="bytes")
        if isinstance(source, io.BytesIO):
            source.seek(0)
            return self._read_buffer_or_disk(source, hint="bytesio")
        path = Path(source)
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {path}")
        try:
            data, sr = sf.read(str(path), dtype="float32")
            return self._mono(data), int(sr)
        except Exception:
            data, sr = librosa.load(str(path), sr=None, mono=True)
            return data.astype(np.float32, copy=False), int(sr)

    def _read_buffer_or_disk(self, buf: io.BytesIO, *, hint: str) -> Tuple[np.ndarray, int]:
        try:
            data, sr = sf.read(buf, dtype="float32")
            return self._mono(data), int(sr)
        except Exception:
            buf.seek(0)
            tmp_bytes = buf.read()
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".bin", delete=False) as tmp:
                tmp.write(tmp_bytes)
                tmp_path = tmp.name
            try:
                data, sr = librosa.load(tmp_path, sr=None, mono=True)
                return data.astype(np.float32, copy=False), int(sr)
            finally:
                Path(tmp_path).unlink(missing_ok=True)

    @staticmethod
    def _mono(data: np.ndarray) -> np.ndarray:
        if data.ndim > 1:
            data = np.mean(data, axis=1)
        return data.astype(np.float32, copy=False)

    def _to_wav_bytes(self, waveform: np.ndarray, sr: int) -> bytes:
        if sr != self.TARGET_SR:
            waveform = librosa.resample(waveform, orig_sr=sr, target_sr=self.TARGET_SR)
            
        buf = io.BytesIO()
        sf.write(buf, waveform, self.TARGET_SR, format='WAV', subtype='PCM_16')
        return buf.getvalue()

    def _empty(self, *, duration: float) -> Dict[str, Any]:
        return {
            "dominant_emotion": "neutral",
            "confidence": 0.0,
            "distribution": {label: 0.0 for label in self.emotion_labels},
            "duration_seconds": float(max(0.0, duration)),
            "audio_quality_score": 0.0,
            "requires_review": True,
        }

    @staticmethod
    def _needs_review(emotion: str, confidence: float) -> bool:
        if confidence < 0.4:
            return True
        return emotion in {"sad", "fearful", "angry", "disgust"} and confidence > 0.6

    @staticmethod
    def _quality(waveform: np.ndarray) -> float:
        sample = waveform[: 10 * SpeechAnalyzer.TARGET_SR] if waveform.size > 0 else waveform
        if sample.size == 0:
            return 0.0
        energy = float(np.mean(sample ** 2))
        return max(0.1, min(1.0, energy * 1000))


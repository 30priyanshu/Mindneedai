"""
Shared utilities for all recommendation feature slices.

Single responsibility: emotion normalisation + deterministic pool selection.
"""
import hashlib

_EMOTION_KEYWORDS: dict[str, list[str]] = {
    "Happy": [
        "happy", "happiness", "joy", "joyful", "excited", "pleasant",
        "positive", "cheerful", "delighted", "elated", "content",
    ],
    "Sad": [
        "sad", "sadness", "sorrow", "depressed", "down", "melancholy",
        "unhappy", "negative", "gloomy", "dejected", "lonely", "grief",
    ],
    "Angry": [
        "angry", "anger", "rage", "frustrated", "irritated", "mad",
        "furious", "annoyed", "hostile", "aggravated",
    ],
    "Neutral": [
        "neutral", "calm", "balanced", "composed", "peaceful", "relaxed",
        "stable", "normal", "baseline",
    ],
    "Fear": [
        "fear", "fearful", "scared", "afraid", "anxious", "anxiety",
        "nervous", "worried", "stressed", "terrified", "panic", "tense",
    ],
    "Surprise": [
        "surprise", "surprised", "shocked", "amazed", "astonished",
        "startled", "unexpected", "bewildered",
    ],
    "Disgust": [
        "disgust", "disgusted", "repulsed", "revolted", "aversion",
        "contempt", "disapproval",
    ],
}

# Flat reverse-lookup: keyword -> canonical category name
_KEYWORD_INDEX: dict[str, str] = {
    kw: cat for cat, kws in _EMOTION_KEYWORDS.items() for kw in kws
}

EMOTION_CATEGORIES: list[str] = list(_EMOTION_KEYWORDS.keys())


def normalize_emotion(raw: str) -> str:
    """Map a raw emotion string to a canonical category. Defaults to 'Neutral'."""
    return _KEYWORD_INDEX.get(raw.lower().strip(), "Neutral")


def make_selection_seed(media_type: str, user_id: str, session_id: str, emotion: str) -> str:
    """Build a deterministic seed string for pool selection."""
    return f"{media_type}:{user_id}:{session_id}:{emotion}"


def select_from_pool(pool: list[str], seed: str) -> str:
    """Deterministic, uniform index into pool using SHA-256 of seed."""
    idx = int(hashlib.sha256(seed.encode()).hexdigest(), 16) % len(pool)
    return pool[idx]

"""
Input sanitisation helpers.

sanitize_email(email) -> str
    Strips RFC 2822 display names, validates the address format, and rejects
    patterns that indicate injection attempts.  Raises ValueError on failure.

normalize_input(text, max_length) -> str
    Strips leading/trailing whitespace, collapses internal runs of whitespace,
    and removes ASCII control characters (0x00–0x1F, 0x7F) that have no
    legitimate place in free-text user input.  Truncates to max_length.
    Never raises — always returns a safe string.

Failure modes
-------------
- sanitize_email: raises ValueError with a generic "Invalid email" message
  (intentionally non-specific to avoid information leakage to callers)
- normalize_input: always returns a safe string; empty input → empty string
"""
import re
import unicodedata
from email.utils import parseaddr

_EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
)
_INJECT_RE = re.compile(r'[<>()\[\]\\,;"\s]|\.\.|^\.|\.$')
_CONTROL_RE = re.compile(r"[\x00-\x1f\x7f]")

_DEFAULT_MAX_LENGTH = 10_000


def sanitize_email(email: str) -> str:
    """Return a normalised, validated email address string.

    Steps
    -----
    1. Use email.utils.parseaddr to strip any RFC 2822 display name.
    2. Validate the bare address against a conservative regex.
    3. Reject any remaining characters associated with injection payloads.
    4. Lowercase and strip.
    """
    if not email or not isinstance(email, str):
        raise ValueError("Invalid email")

    _, address = parseaddr(email.strip())
    if not address:
        raise ValueError("Invalid email")

    if not _EMAIL_RE.match(address):
        raise ValueError("Invalid email")

    if _INJECT_RE.search(address):
        raise ValueError("Invalid email")

    return address.lower()


def normalize_input(text: str, max_length: int = _DEFAULT_MAX_LENGTH) -> str:
    """Return a safe, length-limited version of *text*.

    - Strips ASCII control characters.
    - Normalises Unicode to NFC (canonical composition).
    - Collapses runs of whitespace into a single space.
    - Truncates to max_length characters.
    """
    if not text or not isinstance(text, str):
        return ""

    cleaned = _CONTROL_RE.sub("", text)
    cleaned = unicodedata.normalize("NFC", cleaned)
    cleaned = " ".join(cleaned.split())
    return cleaned[:max_length]

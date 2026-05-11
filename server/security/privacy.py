"""
PrivacyManager — user-facing privacy operations.

Responsibilities
----------------
- anonymise_user_id  : one-way SHA-256 hash of a user identifier
- mask_text          : replace visible characters with asterisks for safe logging
- generate_consent_token : create an opaque encrypted consent record

This module contains NO encryption logic.  All symmetric crypto is
delegated to security.encryption.  Never import cryptography primitives here.
"""
import hashlib
import json
import secrets
from datetime import datetime, timezone

from server.config.settings import settings
from server.security.encryption import decrypt_field, derive_key, encrypt_field

_ANON_PEPPER = "mindneed_uid_"
_MASK_CHAR = "*"


class PrivacyManager:
    """Thread-safe; safe to instantiate once at startup and share."""

    def __init__(self) -> None:
        self._key: bytes = derive_key(settings.encryption_key, settings.pbkdf2_salt)

    def anonymise_user_id(self, user_id: str) -> str:
        """Return a 16-character hex digest that cannot be reversed to the original ID."""
        return hashlib.sha256(f"{_ANON_PEPPER}{user_id}".encode()).hexdigest()[:16]

    def mask_text(self, text: str, visible_chars: int = 0) -> str:
        """Replace all but the first `visible_chars` characters with asterisks.

        Example: mask_text("hello@example.com", 3) → "hel**************"
        """
        if not text:
            return text
        visible = text[:visible_chars]
        return visible + _MASK_CHAR * (len(text) - visible_chars)

    def generate_consent_token(self, user_id: str, consent_type: str) -> str:
        """Return an encrypted, time-stamped consent record as an opaque string."""
        payload = json.dumps(
            {
                "uid": self.anonymise_user_id(user_id),
                "type": consent_type,
                "nonce": secrets.token_hex(8),
                "issued_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        return encrypt_field(payload, self._key)

    def decrypt_consent_token(self, token: str) -> dict:
        """Decrypt and return the consent payload.  Raises InvalidToken on tamper."""
        raw = decrypt_field(token, self._key)
        return json.loads(raw)

"""
Fernet symmetric field encryption and PBKDF2 key derivation.

Public API
----------
derive_key(password, salt) -> bytes
    Derives a URL-safe base64-encoded 32-byte key via PBKDF2-HMAC-SHA256.
    Used once at application startup; the result is cached by PrivacyManager.

encrypt_field(plaintext, key) -> str
    Encrypts a UTF-8 string and returns a URL-safe base64 ciphertext string.

decrypt_field(ciphertext, key) -> str
    Decrypts a URL-safe base64 ciphertext string back to a UTF-8 string.

Failure modes
-------------
- derive_key: raises ValueError on empty password or salt
- encrypt_field: raises ValueError on empty key; propagates cryptography errors
- decrypt_field: raises ValueError on empty key; raises cryptography.fernet.InvalidToken
  on tampered/expired ciphertext — callers must handle this explicitly
"""
import base64

from cryptography.fernet import Fernet, InvalidToken  # noqa: F401 — re-exported for callers
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

_PBKDF2_ITERATIONS = 600_000  # OWASP 2023 minimum for PBKDF2-HMAC-SHA256


def derive_key(password: str, salt: str) -> bytes:
    """Return a URL-safe base64-encoded 32-byte Fernet key derived from password + salt."""
    if not password:
        raise ValueError("encryption password must not be empty")
    if not salt:
        raise ValueError("encryption salt must not be empty")

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt.encode(),
        iterations=_PBKDF2_ITERATIONS,
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))


def encrypt_field(plaintext: str, key: bytes) -> str:
    """Encrypt a UTF-8 string; return URL-safe base64 ciphertext."""
    if not key:
        raise ValueError("encryption key must not be empty")
    return Fernet(key).encrypt(plaintext.encode()).decode()


def decrypt_field(ciphertext: str, key: bytes) -> str:
    """Decrypt a URL-safe base64 ciphertext; return the original UTF-8 string.

    Raises cryptography.fernet.InvalidToken if the ciphertext is tampered or
    the key does not match.  Callers MUST catch InvalidToken explicitly.
    """
    if not key:
        raise ValueError("encryption key must not be empty")
    return Fernet(key).decrypt(ciphertext.encode()).decode()

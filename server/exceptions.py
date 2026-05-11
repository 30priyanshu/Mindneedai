"""
Typed exception hierarchy for MindNeedAI.

Every raise site in the server MUST use a named subtype — never raise
bare Exception or MindNeedError directly except inside infra adapters.

HTTP status codes are embedded in each subtype so error_handlers.py
reads exc.code directly instead of maintaining a separate lookup table.
"""


class MindNeedError(Exception):
    """Root exception.  Carries a human-readable message and HTTP status code."""

    def __init__(self, message: str, code: int = 500) -> None:
        super().__init__(message)
        self.message = message
        self.code = code


class NotFoundError(MindNeedError):
    """Raised when a requested resource does not exist (HTTP 404)."""

    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, 404)


class ConflictError(MindNeedError):
    """Raised when a write would violate a uniqueness constraint (HTTP 409)."""

    def __init__(self, message: str = "Resource already exists") -> None:
        super().__init__(message, 409)


class UnauthorizedError(MindNeedError):
    """Raised when a request lacks valid authentication credentials (HTTP 401)."""

    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(message, 401)


class ForbiddenError(MindNeedError):
    """Raised when an authenticated caller lacks permission (HTTP 403)."""

    def __init__(self, message: str = "Access denied") -> None:
        super().__init__(message, 403)


class ValidationError(MindNeedError):
    """Raised when domain-level validation fails beyond Pydantic schema (HTTP 422)."""

    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__(message, 422)


class OpenAICircuitOpenError(MindNeedError):
    """Raised when the OpenAI circuit breaker opens after consecutive failures (HTTP 503)."""

    def __init__(self, message: str = "AI service temporarily unavailable") -> None:
        super().__init__(message, 503)


class DatabaseError(MindNeedError):
    """Raised when a database operation fails at the repository layer (HTTP 500 or 503)."""

    def __init__(self, message: str = "Database operation failed", *, code: int = 500) -> None:
        super().__init__(message, code)


class RateLimitError(MindNeedError):
    """Raised when a caller exceeds the configured request rate limit (HTTP 429)."""

    def __init__(self, message: str = "Rate limit exceeded") -> None:
        super().__init__(message, 429)


class ModelNotLoadedError(MindNeedError):
    """Raised when inference is requested but the model is not loaded (HTTP 503)."""

    def __init__(self, message: str = "Model not loaded") -> None:
        super().__init__(message, 503)


class InferenceTimeoutError(MindNeedError):
    """Raised when model inference or LLM call exceeds the configured timeout (HTTP 504)."""

    def __init__(self, message: str = "Inference timed out") -> None:
        super().__init__(message, 504)


class LLMDegradedError(MindNeedError):
    """Raised when LLM returns but output is unusable after parse attempts (HTTP 503)."""

    def __init__(self, message: str = "AI service returned degraded response") -> None:
        super().__init__(message, 503)

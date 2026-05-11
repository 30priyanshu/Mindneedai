from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_PLACEHOLDER_TOKENS = frozenset({"placeholder", "replace_me", "change_me", "changeme", "xxx"})


class Settings(BaseSettings):
    environment: Literal["development", "staging", "production"] = "development"

    model_name: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    model_cache_dir: str = "./model_cache/text_analysis"
    text_analysis_model_cache: str = "./model_cache/text_analysis"
    log_level: str = "INFO"

    jwt_secret_key: str
    encryption_key: str
    pbkdf2_salt: str

    database_url: str
    redis_url: str = ""
    sentry_dsn: str = ""
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_recycle: int = 3600

    max_text_length: int = 512
    confidence_threshold: float = 0.7
    human_review_threshold: float = 0.60

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    media_root: str = "./data/media"

    openai_api_key: str
    inworld_api_key: str = ""
    gemini_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    use_openai_reasoning: bool = True

    ai_generation_enabled: bool = True
    ai_max_concurrent_jobs: int = 10
    ai_generation_timeout: int = 300
    ai_retry_attempts: int = 3
    ai_retry_backoff_multiplier: int = 2

    openai_rpm_limit: int = 60
    openai_daily_limit: int = 10000
    openai_call_timeout: int = 30
    inference_timeout: int = 60
    max_active_video_sessions: int = 100
    max_feedback_buffer_size: int = 1000

    text_inference_concurrency: int = 4
    speech_inference_concurrency: int = 2
    facial_inference_concurrency: int = 4
    max_video_sessions_per_user: int = 2
    max_frame_b64_bytes: int = 1_500_000
    gpu_cache_clear_interval_s: int = 300
    rate_limit_analyze_frame_per_second: int = 30
    rate_limit_analyze_audio_per_minute: int = 6
    rate_limit_analyze_text_per_minute: int = 30

    text_model_revision: str = ""
    speech_model_revision: str = ""
    facial_static_model_sha256: str = ""
    facial_lstm_model_sha256: str = ""

    ai_failure_alert_threshold: float = 0.10
    ai_slow_generation_threshold: int = 120

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "mindneedai@example.com"
    smtp_use_tls: bool = True

    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 120

    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    @field_validator("confidence_threshold", "human_review_threshold")
    @classmethod
    def validate_thresholds(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError("Threshold must be between 0.0 and 1.0")
        return v

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment != "production":
            return self

        secret_fields = {
            "jwt_secret_key": self.jwt_secret_key,
            "encryption_key": self.encryption_key,
            "pbkdf2_salt": self.pbkdf2_salt,
            "openai_api_key": self.openai_api_key,
        }

        for name, value in secret_fields.items():
            if not value:
                raise ValueError(f"{name} must be set in production")
            lower = value.lower()
            if any(token in lower for token in _PLACEHOLDER_TOKENS):
                raise ValueError(f"{name} contains a placeholder value")

        if len(self.jwt_secret_key) < 64:
            raise ValueError("jwt_secret_key must be at least 64 characters in production")

        return self


settings = Settings()

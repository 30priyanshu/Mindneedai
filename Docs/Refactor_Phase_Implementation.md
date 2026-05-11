# MindNeedAI — Refactor Phase-wise Implementation Plan

> Derived exclusively from `MindNeedAI_Refactor_Architecture.md`.  
> Every step is atomic and independently verifiable. Do not skip phases — each phase is a prerequisite for the next.

---

## Reading Guide

- **[ ]** = not started
- **[x]** = complete
- Each step should be a single focused commit.
- Bug-fix steps are marked **[BUG]**.
- Steps that require deleting code are marked **[DELETE]**.
- Steps that require DB schema changes are marked **[MIGRATION]**.

---

## Phase 0 — Critical Bug Fixes (Do Before Any Restructuring)

> Fix all four known bugs on the current codebase before moving a single file. These bugs will otherwise be duplicated into the new structure.

### 0.1 — Session Cache Reset Bug [BUG]

- [x] **0.1.1** Open `src/multimodel/music_recommendation/service.py`. Locate `reset_user_history()`.
- [x] **0.1.2** Replace the broken `user_id[:8] in key` filter. The correct filter must hash `(user_id + session_id)` the same way keys are generated and delete by exact prefix or by a DB query (whichever applies).
- [x] **0.1.3** Repeat the same fix for `src/multimodel/video_recommendation/service.py` `reset_user_history()`.
- [x] **0.1.4** Repeat the same fix for `src/multimodel/youtube_recommendation/service.py` `reset_user_history()`.
- [x] **0.1.5** Manually verify via test call that a reset no longer leaks session data for a different user_id.

### 0.2 — Error Response Format Mismatch [BUG]

- [x] **0.2.1** Open `src/core/error_handler.py`. Note the response shape: `{ "error": { "message", "code", "request_id" } }`.
- [x] **0.2.2** Search every frontend service file for `.data?.detail`. List all occurrences.
- [x] **0.2.3** In each located frontend service file, change `error.response?.data?.detail` to `error.response?.data?.error?.message` to match the backend format.
- [x] **0.2.4** Confirm no frontend file still reads `.data.detail` for error messages.

### 0.3 — Health Check Connection Leak [BUG]

- [x] **0.3.1** Open the route handler for `GET /health`.
- [x] **0.3.2** Locate the `DatabaseManager()` instantiation inside the handler.
- [x] **0.3.3** Replace it with a module-level singleton engine reference; use `engine.connect()` with `SELECT 1` inside a `try/finally` — do not create a new engine per call.
- [x] **0.3.4** Verify via repeated polling that connection count does not grow.

### 0.4 — Dead Code Deletion [DELETE]

- [x] **0.4.1** Delete `src/mental_status_exam/` directory entirely (contains only `__pycache__`; no Python source).
- [x] **0.4.2** Delete `frontend/src/services/mentalStatusExamService.ts`.
- [x] **0.4.3** Delete `frontend/src/pages/HomePage.tsx` (not imported or routed).
- [x] **0.4.4** Delete `frontend/src/pages/MyExamsPage.tsx` (dead — mental status exam removed).
- [x] **0.4.5** Delete `frontend/src/pages/ViewExamPage.tsx` (dead).
- [x] **0.4.6** Delete `frontend/src/pages/CreateExamPage.tsx` (dead).
- [x] **0.4.7** Move `src/multimodel/text_analysis/docs/` contents to `Docs/Text Analysis/`. Delete the original `docs/` folder inside the source tree.

---

## Phase 1 — Project Foundation

> Establish the new root layout, tooling files, and settings before touching any logic.

### 1.1 — Directory Skeleton

- [x] **1.1.1** Create root directories: `server/`, `client/`, `data/media/music/`, `data/media/videos/`, `data/.gitkeep`, `model_cache/`, `scripts/`, `tests/unit/`, `tests/integration/`.
- [x] **1.1.2** Add `model_cache/` and `data/` (except `.gitkeep`) to `.gitignore`.
- [x] **1.1.3** Create `server/__init__.py` (empty).
- [x] **1.1.4** Create all sub-package `__init__.py` files for: `server/config/`, `server/db/`, `server/db/models/`, `server/db/repositories/`, `server/migrations/`, `server/analysis/`, `server/analysis/shared/`, `server/analysis/text/`, `server/analysis/speech/`, `server/analysis/facial/`, `server/features/`, `server/infra/`, `server/infra/email/`, `server/infra/openai/`, `server/infra/cache/`, `server/infra/media/`, `server/security/`, `server/middleware/`, `server/utils/`.

### 1.2 — pyproject.toml

- [x] **1.2.1** Create `server/pyproject.toml` with `[project]` section: `name = "mindneedai-server"`, `requires-python = ">=3.12"`.
- [x] **1.2.2** Add all `dependencies` from the architecture doc exactly as listed (fastapi, uvicorn, sqlalchemy 2.0, alembic, psycopg3, pydantic-settings 2.6, passlib, python-jose, cryptography, fastapi-limiter, redis, httpx, openai, tiktoken, tenacity, aiosmtplib, torch, transformers, numpy, scipy, scikit-learn, opencv-python-headless, mediapipe, librosa, soundfile, loguru, sentry-sdk).
- [x] **1.2.3** Add `[tool.ruff]` section: `line-length = 100`, `select = ["E", "F", "I", "UP"]`.
- [x] **1.2.4** Add `[tool.pyright]` section: `pythonVersion = "3.12"`, `typeCheckingMode = "basic"`.
- [x] **1.2.5** Add `[tool.pytest.ini_options]`: `asyncio_mode = "auto"`, `testpaths = ["tests"]`.
- [x] **1.2.6** Verify `tf-keras` is not imported anywhere (`rg 'tf_keras|import keras'` in `src/`). If no hits, do not add it to `pyproject.toml`.
- [x] **1.2.7** Remove `slowapi` from dependencies after confirming the migration to `fastapi-limiter` is planned for Phase 4.

### 1.3 — Environment Configuration

- [x] **1.3.1** Create `.env.example` at repository root listing every required key with placeholder values: `DATABASE_URL`, `JWT_SECRET_KEY`, `ENCRYPTION_KEY`, `PBKDF2_SALT`, `OPENAI_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SENTRY_DSN`, `ENVIRONMENT`, `REDIS_URL`.
- [x] **1.3.2** Confirm no secrets or real values appear in `.env.example`.
- [x] **1.3.3** Add `.env` and `.env.production` to `.gitignore`.

### 1.4 — Settings Refactor

- [x] **1.4.1** Create `server/config/settings.py`.
- [x] **1.4.2** Define `class Settings(BaseSettings)` using pydantic-settings 2.x.
- [x] **1.4.3** Declare every field as a typed class attribute with no `os.getenv()` wrapper — pydantic-settings resolves `.env` automatically.
- [x] **1.4.4** Remove the three hardcoded fallback secrets (`"dev_key_change_in_production"`, `"dev_encryption_key"`, `"mindneedai_salt_change_in_production"`). Fields that require secrets must have no default or raise a `ValueError` when empty in non-dev environments.
- [x] **1.4.5** Add an `environment: Literal["development", "staging", "production"] = "development"` field.
- [x] **1.4.6** Add a `model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")` class variable.
- [x] **1.4.7** Remove `streamlit_port` field entirely (no code references it).
- [x] **1.4.8** Add a `@model_validator(mode="after")` that raises `ValueError` if `environment == "production"` and any secret field is still at a placeholder value.
- [x] **1.4.9** Create module-level singleton: `settings = Settings()`.

---

## Phase 2 — Database Foundation

> Must be complete before any feature services are written, because every service depends on the repository layer.

### 2.1 — SQLAlchemy Base and Session

- [x] **2.1.1** Create `server/db/base.py`. Import `DeclarativeBase` from `sqlalchemy.orm`. Define `class Base(DeclarativeBase): pass`. Add engine factory function `create_engine_from_settings(settings) -> Engine` using `settings.database_url`.
- [x] **2.1.2** Create `server/db/session.py`. Import engine from `base.py`. Create `SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)`. Implement `get_db()` generator as a FastAPI dependency.
- [x] **2.1.3** Confirm `engine` is a module-level singleton — not created per request.

### 2.2 — ORM Models: Split models.py (21 models → 11 files)

- [x] **2.2.1** Create `server/db/models/user.py`. Move `UserProfile`, `Doctor`, `UserDoctorRelationship`, `UserPreferences` from `src/database/models.py`. All import `from server.db.base import Base`. Add indexes for foreign keys and frequently filtered fields.
- [x] **2.2.2** Create `server/db/models/analysis.py`. Move `AnalysisRecord`, `UserFeedback`, `ReviewRecord`, `ModelVersion`.
- [x] **2.2.3** Create `server/db/models/video_analysis.py`. Move `VideoAnalysisSession`, `VideoFrameRecord`, `VideoAnalysisReview`.
- [x] **2.2.4** Create `server/db/models/audio_analysis.py`. Move `AudioAnalysisSession`, `AudioAnalysisReview`.
- [x] **2.2.5** Create `server/db/models/mood.py`. Move `MoodEntry`.
- [x] **2.2.6** Create `server/db/models/health_metrics.py`. Move `HealthMetricsEntry`.
- [x] **2.2.7** Create `server/db/models/assessment.py`. Move `Assessment`, `AssessmentRequest`.
- [x] **2.2.8** Create `server/db/models/wellness_form.py`. Move `MentalWellnessForm`.
- [x] **2.2.9** Create `server/db/models/emergency.py`. Move `EmergencyContact`, `EmergencyAlertLog`.
- [x] **2.2.10** Create `server/db/models/notification.py`. Move `Notification`.
- [x] **2.2.11** Create `server/db/models/recommendation.py`. Define two new ORM models:
  - `RecommendationPlayHistory`: fields `id`, `user_id`, `media_type` (`"music"|"video"|"youtube"`), `emotion_category`, `media_key`, `played_at`. Composite unique index on `(user_id, emotion_category, media_type, media_key)`.
  - `RecommendationSessionCache`: fields `id`, `user_id`, `session_id`, `emotion_category`, `media_type`, `chosen_key`, `created_at`, `expires_at` (`created_at + 24h`). Composite unique index on `(user_id, session_id, emotion_category, media_type)`.
- [x] **2.2.12** Create `server/db/models/__init__.py` that imports all 11 model files so Alembic autogenerate picks them up.
- [x] **2.2.13** Verify original `src/database/models.py` `DatabaseManager` god class is not yet deleted — repositories in the next step replace it.

### 2.3 — Generic Base Repository

- [x] **2.3.1** Create `server/db/repositories/base.py`. Implement `class BaseRepository(Generic[T])` with methods: `get(id) -> T | None`, `list(page, size) -> list[T]`, `create(obj) -> T`, `update(id, data) -> T`, `delete(id) -> bool`. All methods accept `db: Session` injected at init.

### 2.4 — Domain Repositories (11 files)

- [x] **2.4.1** Create `server/db/repositories/user_repo.py`: `UserRepository`, `DoctorRepository`, `RelationshipRepository`. Each inherits `BaseRepository`. Add domain-specific methods (e.g., `find_by_email`, `find_by_doctor_code`).
- [x] **2.4.2** Create `server/db/repositories/analysis_repo.py`: `AnalysisRepository`, `ReviewRepository`, `FeedbackRepository`.
- [x] **2.4.3** Create `server/db/repositories/video_repo.py`: `VideoSessionRepository`, `VideoFrameRepository`.
- [x] **2.4.4** Create `server/db/repositories/audio_repo.py`: `AudioSessionRepository`.
- [x] **2.4.5** Create `server/db/repositories/mood_repo.py`: `MoodRepository`. Include `list_by_month(user_id, year, month)`.
- [x] **2.4.6** Create `server/db/repositories/health_metrics_repo.py`: `HealthMetricsRepository`. Include `get_latest(user_id)`.
- [x] **2.4.7** Create `server/db/repositories/assessment_repo.py`: `AssessmentRepository`, `AssessmentRequestRepository`. Include idempotency check `find_by_user_month(user_id, month, year)`.
- [x] **2.4.8** Create `server/db/repositories/wellness_form_repo.py`: `WellnessFormRepository`.
- [x] **2.4.9** Create `server/db/repositories/emergency_repo.py`: `EmergencyContactRepository`, `AlertLogRepository`.
- [x] **2.4.10** Create `server/db/repositories/notification_repo.py`: `NotificationRepository`. Include `count_unread(user_id)`, `mark_all_read(user_id)`.
- [x] **2.4.11** Create `server/db/repositories/recommendation_repo.py`: `RecommendationPlayHistoryRepository` (upsert by unique index), `SessionCacheRepository` (upsert, expire old rows). These replace all JSON file operations.

### 2.5 — Alembic Setup [MIGRATION]

- [x] **2.5.1** Run `alembic init server/migrations` to scaffold the migrations directory.
- [x] **2.5.2** Edit `server/migrations/env.py`: import `Base` from `server.db.base` and `from server.db.models import *` for autogenerate to detect all tables.
- [x] **2.5.3** Set `target_metadata = Base.metadata` in `env.py`.
- [x] **2.5.4** Configure `alembic.ini` `script_location` to point to `server/migrations`.
- [x] **2.5.5** Run `alembic revision --autogenerate -m "initial_schema"` to generate the first migration from the new models.
- [x] **2.5.6** Review the generated migration file. Confirm all 12 tables (11 domain + `recommendation_play_history`, `recommendation_session_cache`) are present.
- [x] **2.5.7** Delete all `src/database/migrate_*.py` hand-rolled migration scripts. Alembic is the sole migration tool from this point.

### 2.6 — JSON → DB Migration (Recommendation Data) [MIGRATION]

- [x] **2.6.1** Create `scripts/seed_db.py`. Implement a one-shot script that reads each existing `play_history.json` and `session_cache.json` from `src/multimodel/*/` and inserts rows into `recommendation_play_history` and `recommendation_session_cache` via `RecommendationPlayHistoryRepository` and `SessionCacheRepository`.
- [x] **2.6.2** Run `scripts/seed_db.py` against the development database and verify row counts match the JSON file entries.
- [x] **2.6.3** After confirmed seed, delete `src/multimodel/music_recommendation/play_history.json`, `session_cache.json`.
- [x] **2.6.4** Delete `src/multimodel/video_recommendation/play_history.json`, `session_cache.json`, `failed_files.json`.
- [x] **2.6.5** Delete `src/multimodel/youtube_recommendation/play_history.json`, `session_cache.json`, `failed_files.json`.

---

## Phase 3 — Infrastructure Adapters

> Pure adapters — no business logic. Depend only on `config/settings.py`.

### 3.1 — OpenAI Client (Single Source of Truth)

- [x] **3.1.1** Create `server/infra/openai/client.py`. Build a single async OpenAI client using `httpx.AsyncClient(timeout=30)`.
- [x] **3.1.2** Add tenacity retry decorator: 3 attempts, exponential backoff (min 2s, max 10s), retry on `RateLimitError` and `APIConnectionError` only, `reraise=True`.
- [x] **3.1.3** Implement consecutive-failure counter. After 5 consecutive failures, log `CRITICAL` and raise `OpenAICircuitOpenError` (defined in `server/exceptions.py`).
- [x] **3.1.4** Add RPM rate-limit tracking and token usage tracking (count tokens via `tiktoken` before each call).
- [x] **3.1.5** Confirm there is **no** `openai_client.py` inside `analysis/shared/`. If the file exists from the old codebase, delete it. All analysis reasoners import from `server.infra.openai.client` only.

### 3.2 — Email Client

- [x] **3.2.1** Create `server/infra/email/client.py`. Implement `async def send_email(to, subject, body)` using `aiosmtplib`. Read SMTP config from `settings`. No business logic.
- [x] **3.2.2** Create `server/infra/email/templates.py`. Implement builder functions for each email type: `build_emergency_alert_body(...)`, `build_notification_body(...)`. Return plain strings only.

### 3.3 — Recommendation Store (Cache Adapter)

- [x] **3.3.1** Create `server/infra/cache/recommendation_store.py`. Implement a thin facade that wraps `RecommendationPlayHistoryRepository` and `SessionCacheRepository`. Expose: `record_played(...)`, `get_played_keys(user_id, emotion, media_type)`, `cache_session_choice(...)`, `get_session_choice(...)`, `reset_user_session(user_id)`.
- [x] **3.3.2** The `reset_user_session` method must query by `user_id` column directly — not by string prefix matching. This permanently fixes Bug 0.1.

### 3.4 — Media Static Handler

- [x] **3.4.1** Create `server/infra/media/static_handler.py`. Subclass `StaticFiles` as `AudioStaticFiles`. Override response to include `Accept-Ranges: bytes` and `Content-Range` headers for music/video byte-range streaming.

---

## Phase 4 — Security and Cross-cutting Concerns

### 4.1 — Typed Exception Hierarchy

- [x] **4.1.1** Create `server/exceptions.py`. Define `class MindNeedError(Exception)` as root. Add subtypes: `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `OpenAICircuitOpenError`, `DatabaseError`, `RateLimitError`. Each carries `message: str` and `code: int`.
- [x] **4.1.2** Ensure no subtype is a bare `Exception` — every raise site must use a named type.

### 4.2 — Error Handlers

- [x] **4.2.1** Create `server/error_handlers.py`. Register FastAPI exception handlers for each typed exception from `exceptions.py`.
- [x] **4.2.2** All handlers return `{ "error": { "message": ..., "code": ..., "request_id": ... } }`. This is the single canonical error shape.
- [x] **4.2.3** Never expose stack traces in any handler response body — log internally, return only `message` and `code`.
- [x] **4.2.4** Register a fallback handler for unhandled `Exception` that returns 500 with a generic message and logs the traceback via loguru.

### 4.3 — Middleware

- [x] **4.3.1** Copy `src/middleware/request_id.py` to `server/middleware/request_id.py`. Verify it injects `X-Request-ID` on both request and response.
- [x] **4.3.2** Copy `src/middleware/response_size_limit.py` to `server/middleware/response_size_limit.py`. Confirm it rejects responses exceeding the configured byte ceiling (50 MB for audio/video).

### 4.4 — Security Layer

- [x] **4.4.1** Create `server/security/encryption.py`. Implement Fernet field encryption (`encrypt_field`, `decrypt_field`) and `derive_key(password, salt)` using PBKDF2. Read key and salt from `settings`.
- [x] **4.4.2** Create `server/security/privacy.py`. Implement `PrivacyManager`: `anonymise_user_id(user_id) -> str`, `mask_text(text) -> str`, `generate_consent_token() -> str`. No encryption logic here — call `encryption.py` for that.
- [x] **4.4.3** Copy `src/security/audit_logger.py` to `server/security/audit.py`. Define `AuditEventType` enum. Implement `AuditLogger.log(event_type, user_id, action, status, duration_ms, request_id)` using loguru. Never log `password`, `jwt_secret_key`, `smtp_password`, `openai_api_key`, PII.

### 4.5 — Utilities

- [x] **4.5.1** Copy `src/utils/pagination.py` to `server/utils/pagination.py`. Implement `PaginatedResponse` dataclass and `paginate_query(query, page, size)` — max `size` is 100.
- [x] **4.5.2** Copy `src/utils/timezone_utils.py` to `server/utils/timezone.py`. Expose UTC conversion and timezone-aware formatting helpers.
- [x] **4.5.3** Copy `src/utils/email_sanitizer.py` to `server/utils/sanitize.py`. Expose `sanitize_email(email) -> str` and `normalize_input(text) -> str`.

---

## Phase 5 — App Factory and Main Entry Point

### 5.1 — create_app() Factory

- [x] **5.1.1** Create `server/main.py`. Define `create_app() -> FastAPI`.
- [x] **5.1.2** Replace `@app.on_event("startup")` with `@asynccontextmanager async def lifespan(app)`. On entry: async model preloading (non-blocking). On exit: call `unload()` on each analyzer to free GPU/CPU memory.
- [x] **5.1.3** In the lifespan, initialise loguru: if `settings.environment == "production"`, add JSON sink `logger.add(sys.stdout, format="{message}", serialize=True)`.
- [x] **5.1.4** In the lifespan, initialise Sentry: `sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.1, send_default_pii=False)`. If `sentry_dsn` is empty string, skip init (no crash on dev).
- [x] **5.1.5** Register both middlewares (`RequestIdMiddleware`, `ResponseSizeLimitMiddleware`) inside `create_app()`.
- [x] **5.1.6** Register all error handlers from `error_handlers.py` inside `create_app()`.
- [x] **5.1.7** Mount all feature routers under `/api/v1` prefix. Each router is imported from its feature slice.
- [x] **5.1.8** Mount `AudioStaticFiles` for `/Data/music` and `/Data/videos` pointing to `data/media/`.

### 5.2 — Health Check Endpoint

- [x] **5.2.1** Add `GET /api/v1/health` route in `server/main.py`. Import singleton `engine` from `db/session.py`. Execute `SELECT 1` in a `try/finally`. Return `{"status": "ok"}` on success, raise `DatabaseError` (→ 503) on failure. No new engine creation per call.

### 5.3 — API Versioning Contract

- [x] **5.3.1** Confirm every router in `features/` uses no hard-coded prefix for the version. The `/api/v1` prefix is added once in `create_app()` via `include_router(..., prefix="/api/v1")`.
- [x] **5.3.2** Remove the old 19-router flat dump from the original `main.py`.

---

## Phase 6 — Analysis Shared Base Classes

> Extract shared abstract interfaces before implementing the modality-specific analyzers.

### 6.1 — Abstract Base Classes

- [x] **6.1.1** Create `server/analysis/shared/base_analyzer.py`. Define `class BaseAnalyzer(ABC)` with abstract methods: `load_model()`, `predict(input_data) -> dict`, `unload()`.
- [x] **6.1.2** Create `server/analysis/shared/base_reasoner.py`. Define `class BaseReasoner(ABC)` with abstract methods: `build_prompt(analysis_result) -> str`, `call_llm(prompt) -> str`, `parse_response(raw) -> dict`. Constructor accepts `openai_client` injected — never import directly.
- [x] **6.1.3** Create `server/analysis/shared/base_learner.py`. Define `class BaseLearner(ABC)` with abstract methods: `collect_feedback(analysis_id, feedback)`, `trigger_cycle()`.
- [x] **6.1.4** Create `server/analysis/shared/base_model_manager.py`. Define `class BaseModelManager(ABC)` with abstract methods: `get_active_version() -> str`, `activate_version(version_id)`, `rollback()`.

### 6.2 — Text Analysis Modality

- [x] **6.2.1** Create `server/analysis/text/analyzer.py`. Implement `TextAnalyzer(BaseAnalyzer)`. RoBERTa inference, confidence calibration. No HTTP layer, no DB access.
- [x] **6.2.2** Create `server/analysis/text/reasoner.py`. Implement `TextReasoner(BaseReasoner)`. GPT-4 text prompt builder + clinical insight parser. Import `openai_client` from `server.infra.openai.client`.
- [x] **6.2.3** Create `server/analysis/text/learner.py`. Implement `TextLearner(BaseLearner)`. Feedback collection and fine-tune dataset prep only — no service logic.
- [x] **6.2.4** Create `server/analysis/text/model_manager.py`. Implement `TextModelManager(BaseModelManager)`. HuggingFace model versioning for text models only.

### 6.3 — Speech Analysis Modality

- [x] **6.3.1** Create `server/analysis/speech/analyzer.py`. Implement `SpeechAnalyzer(BaseAnalyzer)`. Merge `speech_analyzer.py` and `wav2vec2_predictor.py` into a single class (Wav2Vec2 inference + audio preprocessing). No HTTP layer, no DB access.
- [x] **6.3.2** Create `server/analysis/speech/reasoner.py`. Implement `SpeechReasoner(BaseReasoner)`. GPT-4 speech prompt builder + prosodic insight parser.
- [x] **6.3.3** Create `server/analysis/speech/learner.py`. Implement `SpeechLearner(BaseLearner)`. Speech feedback loop and dataset management.
- [x] **6.3.4** Create `server/analysis/speech/model_manager.py`. Implement `SpeechModelManager(BaseModelManager)`. Wav2Vec2 model versioning.

### 6.4 — Facial Analysis Modality

- [x] **6.4.1** Create `server/analysis/facial/analyzer.py`. Implement `FacialAnalyzer(BaseAnalyzer)`. Merge `facial_analyzer.py` and `realtime_facial_analysis.py` (duplicate) into single class. ResNet/LSTM + MediaPipe face pipeline.
- [x] **6.4.2** Create `server/analysis/facial/reasoner.py`. Implement `FacialReasoner(BaseReasoner)`. GPT-4 facial prompt builder + expression insight parser.
- [x] **6.4.3** Create `server/analysis/facial/learner.py`. Implement `FacialLearner(BaseLearner)`. Video session feedback and training data prep.
- [x] **6.4.4** Create `server/analysis/facial/model_manager.py`. Implement `FacialModelManager(BaseModelManager)`. PyTorch model versioning for facial models.

---

## Phase 7 — Auth Feature Slice

### 7.1 — Auth Utilities

- [x] **7.1.1** Copy `src/auth/token_utils.py` → `server/features/auth/token_utils.py`. Expose `create_access_token`, `verify_token`, `decode_token`. Read `jwt_secret_key` from `settings` only.
- [x] **7.1.2** Copy `src/auth/password_utils.py` → `server/features/auth/password_utils.py`. Expose `hash_password`, `verify_password`, `validate_strength`.
- [x] **7.1.3** Merge `src/auth/login_attempts.py` + `src/auth/rate_limiter.py` → `server/features/auth/login_guard.py`. Implement failed-attempt tracking and progressive lockout as a single cohesive module.

### 7.2 — Auth Schemas, Dependencies, Service, Router

- [x] **7.2.1** Create `server/features/auth/schemas.py`. Define `RegisterUserRequest`, `RegisterDoctorRequest`, `LoginRequest`, `AuthResponse`. Use pydantic v2 models with field validators.
- [x] **7.2.2** Copy `src/auth/dependencies.py` → `server/features/auth/dependencies.py`. Implement `get_current_user`, `get_current_doctor`, `get_current_user_or_doctor` as FastAPI dependencies.
- [x] **7.2.3** Create `server/features/auth/service.py`. Orchestrate: registration, login (calls `login_guard`), JWT issue (calls `token_utils`), password change. Accepts `UserRepository` and `DoctorRepository` as constructor arguments — never instantiates them internally.
- [x] **7.2.4** Create `server/features/auth/router.py`. Routes: `POST /auth/register/user`, `POST /auth/register/doctor`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/change-password`. Mount under `/api/v1` in `create_app()`.
- [x] **7.2.5** Add idempotency: if `email` already exists on register, return `409 ConflictError` (not 500).

---

## Phase 8 — Analysis Feature Slices (Backend)

### 8.1 — Text Analysis Feature

- [x] **8.1.1** Create `server/features/text_analysis/schemas.py`. Define `TextAnalysisRequest`, `AnalysisResponse`, `FeedbackRequest`.
- [x] **8.1.2** Create `server/features/text_analysis/service.py`. Orchestrate: `TextAnalyzer.predict()` → `TextReasoner.call_llm()` → review trigger → emergency check → `AnalysisRepository.create()` → `NotificationService.create()` (as background task). Accept analyzer, reasoner, repositories via constructor.
- [x] **8.1.3** Create `server/features/text_analysis/router.py`. Routes: `POST /text-analysis/analyze`, `POST /text-analysis/feedback`, `GET /text-analysis/review`, `GET /text-analysis/models`, `GET /text-analysis/learning`.
- [x] **8.1.4** Move notification creation and audit log writes into `BackgroundTasks` — do not block response.

### 8.2 — Speech Analysis Feature

- [x] **8.2.1** Create `server/features/speech_analysis/schemas.py`. Define `AudioSessionRequest`, `AudioAnalysisRequest`, `AudioSessionResponse`.
- [x] **8.2.2** Create `server/features/speech_analysis/service.py`. Audio session lifecycle: start → analyze file → close. `SpeechAnalyzer` + `SpeechReasoner` + `AudioSessionRepository`. Notification as background task.
- [x] **8.2.3** Create `server/features/speech_analysis/router.py`. Routes: `POST /audio-analysis/start-session`, `POST /audio-analysis/analyze-file`, `POST /audio-analysis/batch`, `GET /audio-analysis/session/{id}`.

### 8.3 — Facial Analysis Feature

- [x] **8.3.1** Create `server/features/facial_analysis/schemas.py`. Define `StartSessionRequest`, `FrameAnalysisRequest`, `EndSessionRequest`.
- [x] **8.3.2** Create `server/features/facial_analysis/service.py`. Camera session lifecycle: start → analyze frame (buffered) → end session (agentic summary). Accepts `FacialAnalyzer`, `FacialReasoner`, `VideoSessionRepository`. Notification as background task. Webcam transport stays HTTP POST per frame (WebSocket upgrade is deferred per architecture decision).
- [x] **8.3.3** Create `server/features/facial_analysis/router.py`. Routes: `POST /video-analysis/start-session`, `POST /video-analysis/analyze-frame`, `POST /video-analysis/end-session`.

---

## Phase 9 — Recommendation Feature Slices (Backend)

> JSON files are already migrated to DB in Phase 2.6. All services read/write DB only.

### 9.1 — Music Recommendation

- [x] **9.1.1** Create `server/features/recommendations/music/schemas.py`. Define `MusicRecommendationRequest`, `MusicRecommendationResponse`.
- [x] **9.1.2** Create `server/features/recommendations/music/service.py`. Emotion → track mapping. Use `recommendation_store.get_played_keys()` to exclude played tracks. Use `recommendation_store.cache_session_choice()` for session deduplication. All via DB — no JSON.
- [x] **9.1.3** Create `server/features/recommendations/music/router.py`. Routes: `POST /music/recommend`, `POST /music/report-played`, `POST /music/report-failed`, `POST /music/reset-history`.
- [x] **9.1.4** Apply upsert on `report-played` using the `(user_id, emotion_category, media_type, media_key)` unique index.

### 9.2 — Local Video Recommendation

- [x] **9.2.1** Create `server/features/recommendations/local_video/schemas.py`. Define `VideoRecommendationRequest`, `VideoRecommendationResponse`.
- [x] **9.2.2** Create `server/features/recommendations/local_video/service.py`. Emotion → local video file mapping. History via DB. Same pattern as music service.
- [x] **9.2.3** Create `server/features/recommendations/local_video/router.py`. Routes: `POST /video/recommend`, `POST /video/report-played`, `POST /video/report-failed`, `POST /video/reset-history`.

### 9.3 — YouTube Recommendation

- [x] **9.3.1** Create `server/features/recommendations/youtube/schemas.py`. Define `YouTubeRecommendationRequest`, `YouTubeRecommendationResponse`.
- [x] **9.3.2** Copy `src/multimodel/youtube_recommendation/validator.py` → `server/features/recommendations/youtube/validator.py`. Implement `YouTubeVideoValidator` for video health status tracking.
- [x] **9.3.3** Create `server/features/recommendations/youtube/service.py`. Curated video catalog lookup, exclusion logic, history via DB.
- [x] **9.3.4** Create `server/features/recommendations/youtube/router.py`. Routes: `POST /youtube/recommend`, `POST /youtube/report-failure`, `POST /youtube/report-success`, `GET /youtube/health`.

---


## Phase 10 — Health, Wellness, and Assessment Feature Slices (Backend)

### 10.1 — Mood Tracker

- [x] **10.1.1** Create `server/features/mood/schemas.py`. Define `MoodEntryPayload`, `MoodEntryResponse`, `WeeklyMoodData`.
- [x] **10.1.2** Create `server/features/mood/service.py`. CRUD operations + weekly aggregation. Use `MoodRepository`.
- [x] **10.1.3** Create `server/features/mood/router.py`. Routes: `POST /mood/entry`, `GET /mood/entry`, `DELETE /mood/entry/{id}`, `GET /mood/weekly`. All paginated where applicable.

### 10.2 — Health Metrics

- [x] **10.2.1** Copy `src/multimodel/health_metrics/validator.py` → `server/features/health_metrics/validator.py`. Range checks for O2, BP, pulse, risk level derivation. No service logic here.
- [x] **10.2.2** Create `server/features/health_metrics/schemas.py`. Define `HealthMetricsEntryRequest`, `HealthMetricsEntryResponse`.
- [x] **10.2.3** Create `server/features/health_metrics/service.py`. Vitals persistence. OpenAI interpretation via `server.infra.openai.client` (not imported directly — inject). Use `HealthMetricsRepository`.
- [x] **10.2.4** Create `server/features/health_metrics/router.py`. Routes: `POST /health-metrics/entry`, `GET /health-metrics/entry`, `DELETE /health-metrics/entry/{id}`, `GET /health-metrics/latest`.

### 10.3 — Assessments

- [x] **10.3.1** Copy `src/assessments/questionnaires.py` → `server/features/assessments/questionnaires.py`. Static PHQ-9 and GAD-7 question definitions only. No service logic.
- [x] **10.3.2** Copy `src/assessments/scoring_service.py` → `server/features/assessments/scoring.py`. `PHQ9ScoringService`, `GAD7ScoringService`, severity classification. No DB access.
- [x] **10.3.3** Copy `src/assessments/permissions.py` → `server/features/assessments/permissions.py`. Doctor-patient relationship guard only.
- [x] **10.3.4** Create `server/features/assessments/schemas.py`. Define `PHQ9Submission`, `GAD7Submission`, `AssessmentResponse`, `AssessmentRequestCreate`.
- [x] **10.3.5** Create `server/features/assessments/service.py`. Submission, scoring (calls `scoring.py`), result storage (uses `AssessmentRepository`), request lifecycle. Add idempotency: check for existing submission in same calendar month before creating a new one.
- [x] **10.3.6** Merge `src/assessments/api.py` + `src/assessments/request_api.py` → `server/features/assessments/router.py`. Single router for patient and doctor-facing assessment routes.

### 10.4 — Wellness Forms

- [x] **10.4.1** Copy `src/mental_wellness_form/ai_insights_generator.py` → `server/features/wellness_forms/ai_generator.py`. `WellnessFormAIGenerator`: clinical + patient summaries via OpenAI. Accept `openai_client` injected — no direct import.
- [x] **10.4.2** Create `server/features/wellness_forms/schemas.py`. Define `WellnessFormCreate`, `WellnessFormResponse`, `AIInsightsResponse`.
- [x] **10.4.3** Create `server/features/wellness_forms/service.py`. Form CRUD, AI insights trigger (as background task — up to 300s), doctor approval, patient report send. Use `WellnessFormRepository`.
- [x] **10.4.4** Create `server/features/wellness_forms/router.py`. Routes: `POST /mental-wellness-form`, `GET /mental-wellness-form`, `PUT /mental-wellness-form/{id}`, `DELETE /mental-wellness-form/{id}`, AI summary routes.

---

## Phase 11 — User, Doctor, and Admin Feature Slices (Backend)

### 11.1 — User Profile

- [x] **11.1.1** Create `server/features/user_profile/schemas.py`. Define `UserProfileRequest`, `UserProfileResponse`, `ConnectDoctorRequest`.
- [x] **11.1.2** Create `server/features/user_profile/service.py`. Profile save/fetch, doctor connection, disconnect, stats. Use `UserRepository`, `RelationshipRepository`.
- [x] **11.1.3** Create `server/features/user_profile/router.py`. Routes: `POST /user-profile`, `GET /user-profile`, `POST /connect-doctor`, `DELETE /disconnect`.

### 11.2 — Doctor Profile

- [x] **11.2.1** Create `server/features/doctor_profile/schemas.py`. Define `UpdateDoctorProfileRequest`, `DoctorProfileResponse`, `PatientInfo`.
- [x] **11.2.2** Create `server/features/doctor_profile/service.py`. Doctor profile CRUD, patient list (paginated), code regeneration. Use `DoctorRepository`, `RelationshipRepository`.
- [x] **11.2.3** Create `server/features/doctor_profile/router.py`. Routes: `GET /doctors/profile`, `PUT /doctors/profile`, `GET /doctors/patients`, `POST /doctors/code/regenerate`.

### 11.3 — Preferences

- [x] **11.3.1** Create `server/features/preferences/schemas.py`. Define `UserPreferencesRequest`, `UserPreferencesResponse`.
- [x] **11.3.2** Create `server/features/preferences/service.py`. Accessibility preference persistence per user. Use `UserRepository` (preferences are part of `UserPreferences` model).
- [x] **11.3.3** Create `server/features/preferences/router.py`. Routes: `GET /users/preferences`, `PUT /users/preferences`.

### 11.4 — History

- [x] **11.4.1** Create `server/features/history/schemas.py`. Define `AnalysisHistoryItem`, `HistoryResponse`.
- [x] **11.4.2** Create `server/features/history/service.py`. Cross-modality analysis history queries (paginated) using `AnalysisRepository`. Deletion with ownership verification.
- [x] **11.4.3** Create `server/features/history/router.py`. Routes: `GET /users/history`, `DELETE /analysis/{id}`, `POST /users/history/clear`.

### 11.5 — Dashboard

- [x] **11.5.1** Create `server/features/dashboard/schemas.py`. Define `UserDashboardStats`, `DoctorDashboardStats`, `RecentAnalysis`.
- [x] **11.5.2** Create `server/features/dashboard/service.py`. Aggregated stats queries for user and doctor dashboards. Use multiple repositories. Avoid N+1: fetch all needed data in minimal DB calls.
- [x] **11.5.3** Create `server/features/dashboard/router.py`. Routes: `GET /users/dashboard/stats`, `GET /users/dashboard/recent-analyses`, `GET /doctors/dashboard/stats`.

### 11.6 — Notifications

- [x] **11.6.1** Create `server/features/notifications/schemas.py`. Define `NotificationResponse`, `NotificationListResponse`.
- [x] **11.6.2** Copy `src/core/notification_service.py` → `server/features/notifications/service.py`. Notification CRUD, unread count, cross-domain event triggers. Use `NotificationRepository`.
- [x] **11.6.3** Create `server/features/notifications/router.py`. Routes: `GET /notifications`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all`, `DELETE /notifications/{id}`.

### 11.7 — Emergency

- [x] **11.7.1** Copy `src/core/emergency_alert_manager.py` → `server/features/emergency/alert_manager.py`. `EmergencyAlertManager`: multi-recipient dispatch, tiered notifications, cooldown enforcement (check `EmergencyAlertLog` before sending).
- [x] **11.7.2** Create `server/features/emergency/schemas.py`. Define `EmergencyContactRequest`, `AlertHistoryResponse`, `CooldownStatusResponse`.
- [x] **11.7.3** Create `server/features/emergency/service.py`. Contact CRUD, alert dispatch coordination (calls `alert_manager.dispatch()` as background task), cooldown status check. Use `EmergencyContactRepository`, `AlertLogRepository`.
- [x] **11.7.4** Create `server/features/emergency/router.py`. Routes: `POST /emergency-contacts`, `GET /emergency-contacts`, `DELETE /emergency-contacts/{id}`, `GET /emergency-contacts/alerts/history`, `GET /emergency-contacts/cooldown`.
- [x] **11.7.5** Confirm emergency alert dispatch is idempotent: cooldown column on `EmergencyAlertLog` must be checked in `alert_manager.py` before every send.

### 11.8 — Human Review

- [x] **11.8.1** Create `server/features/human_review/schemas.py`. Define `ReviewRequest`, `ReviewerProfile`, `ReviewQueueItem`.
- [x] **11.8.2** Copy `src/human_loop/review_system.py` → `server/features/human_review/service.py`. Priority queue, reviewer assignment, load balancing, escalation. Internal-only — no public-facing router.
- [x] **11.8.3** Create `server/features/human_review/router.py`. Internal-only routes for review queue management. Protect with admin/internal role guard.

---

## Phase 12 — Frontend Foundation

### 12.1 — Rename and Restructure

- [ ] **12.1.1** Rename the existing `frontend/` directory to `client/`. Update all relative references.
- [ ] **12.1.2** Update `vite.config.ts`: set `root = "client"`, proxy `/api/v1` → `http://localhost:8000/api/v1`.
- [ ] **12.1.3** Create `client/src/core/` directory.
- [ ] **12.1.4** Create `client/src/features/` directory.
- [ ] **12.1.5** Create `client/src/shared/components/` and `client/src/shared/hooks/` directories.
- [ ] **12.1.6** Create `client/src/layout/` directory.

### 12.2 — Frontend Dependencies Upgrade (package.json)

- [ ] **12.2.1** Upgrade `react` and `react-dom` to `^19.0.0`.
- [ ] **12.2.2** Upgrade `react-router-dom` to `^7.1`.
- [ ] **12.2.3** Add `@tanstack/react-query ^5.62`.
- [ ] **12.2.4** Add `react-hook-form ^7.54`.
- [ ] **12.2.5** Add `zod ^3.23`.
- [ ] **12.2.6** Add `@sentry/react ^8.42`.
- [ ] **12.2.7** Upgrade `tailwindcss` to `^4.0`. Update `index.css` to use `@import "tailwindcss"` (CSS-first config). Move theme tokens from `tailwind.config.js` into CSS `@theme` blocks.
- [ ] **12.2.8** Add dev dependencies: `vitest ^2.1`, `@testing-library/react ^16.1`, `@testing-library/user-event ^14.5`, `msw ^2.6`, `@playwright/test ^1.49`.
- [ ] **12.2.9** Run `npm install`. Confirm zero peer-dependency conflicts.

### 12.3 — Core Layer

- [ ] **12.3.1** Move `services/api.ts` → `core/api.ts`. Axios instance with auth interceptor and token refresh. Add response interceptor that normalises both `data.error.message` (custom handler) and `data.detail` (FastAPI default) into a single `ApiError` shape.
- [ ] **12.3.2** Create `core/exceptions.ts`. Define `interface ApiError { message: string; code: number; requestId?: string; details?: unknown[] }`.
- [ ] **12.3.3** Create `core/constants.ts`. App-wide string and numeric constants (no magic numbers in component files).
- [ ] **12.3.4** Create `core/router.tsx`. Move all route definitions here. Implement `ProtectedRoute` and `RoleBasedRoute` as inline guard components (replacing `components/auth/ProtectedRoute.tsx` and `components/auth/RoleBasedRoute.tsx`). Wrap every feature page import in `React.lazy()`.
- [ ] **12.3.5** Move `services/storage.ts` → `core/storage.ts`.
- [ ] **12.3.6** Move `utils/initializeNotifications.ts` → `core/initializeNotifications.ts`.
- [ ] **12.3.7** Wrap the entire route tree in `<Suspense fallback={<LoadingSpinner fullPage />}>` in `App.tsx`.

### 12.4 — Types Reorganisation

- [ ] **12.4.1** Create `core/types.ts` for shared cross-feature type shapes (pagination, ApiError, user role, etc.).
- [ ] **12.4.2** Plan to distribute `types/index.ts` entries into each `features/<name>/types.ts` during each feature migration in Phase 15.

---

## Phase 13 — Frontend Shared Layer

### 13.1 — Shared Components (move, not rewrite)

- [ ] **13.1.1** Move `components/shared/Avatar.tsx` → `shared/components/Avatar.tsx`.
- [ ] **13.1.2** Move `components/shared/Badge.tsx` → `shared/components/Badge.tsx`.
- [ ] **13.1.3** Move `components/shared/Button.tsx` → `shared/components/Button.tsx`.
- [ ] **13.1.4** Move `components/shared/Card.tsx` → `shared/components/Card.tsx`.
- [ ] **13.1.5** Move `components/shared/ConfirmDialog.tsx` → `shared/components/ConfirmDialog.tsx`.
- [ ] **13.1.6** Move `components/shared/Dropdown.tsx` → `shared/components/Dropdown.tsx`.
- [ ] **13.1.7** Move `components/shared/EmptyState.tsx` → `shared/components/EmptyState.tsx`.
- [ ] **13.1.8** Move `components/shared/ErrorBoundary.tsx` → `shared/components/ErrorBoundary.tsx`.
- [ ] **13.1.9** Move `components/shared/LoadingSpinner.tsx` → `shared/components/LoadingSpinner.tsx`.
- [ ] **13.1.10** Move `components/shared/Modal.tsx` → `shared/components/Modal.tsx`.
- [ ] **13.1.11** Move `components/shared/Select.tsx` → `shared/components/Select.tsx`.
- [ ] **13.1.12** Move `components/shared/Switch.tsx` → `shared/components/Switch.tsx`.
- [ ] **13.1.13** Move `components/shared/Table.tsx` → `shared/components/Table.tsx`.
- [ ] **13.1.14** Move `components/shared/Tabs.tsx` → `shared/components/Tabs.tsx`.
- [ ] **13.1.15** Move `components/shared/Toast.tsx` → `shared/components/Toast.tsx`.
- [ ] **13.1.16** Move `components/shared/VideoLoadingSpinner.tsx` → `shared/components/VideoLoadingSpinner.tsx` (stays in shared — used outside facial_analysis).

### 13.2 — Shared Hooks (move)

- [ ] **13.2.1** Move `hooks/useLocalStorage.ts` → `shared/hooks/useLocalStorage.ts`.
- [ ] **13.2.2** Move `hooks/useMediaQuery.ts` → `shared/hooks/useMediaQuery.ts`.
- [ ] **13.2.3** Move `hooks/useKeyboardShortcut.ts` → `shared/hooks/useKeyboardShortcut.ts`.
- [ ] **13.2.4** Move `hooks/useAnalysisNotification.ts` → `shared/hooks/useAnalysisNotification.ts`.

### 13.3 — Layout Layer (move)

- [ ] **13.3.1** Move `components/layout/AppLayout.tsx` → `layout/AppLayout.tsx`.
- [ ] **13.3.2** Move `components/layout/Sidebar.tsx` → `layout/Sidebar.tsx`.
- [ ] **13.3.3** Move `components/layout/TopBar.tsx` → `layout/TopBar.tsx`.
- [ ] **13.3.4** Move `components/layout/Breadcrumbs.tsx` → `layout/Breadcrumbs.tsx`.
- [ ] **13.3.5** Move `components/layout/Header.tsx` → `layout/Header.tsx`.
- [ ] **13.3.6** Move `components/layout/Footer.tsx` → `layout/Footer.tsx`.
- [ ] **13.3.7** Move `components/notifications/NotificationDropdown.tsx` → `layout/NotificationDropdown.tsx`.
- [ ] **13.3.8** Move `components/profile/ProfileDropdown.tsx` → `layout/ProfileDropdown.tsx`.

### 13.4 — Contexts (move in place)

- [ ] **13.4.1** Confirm all six context files stay at `contexts/` level (no rename, no split — they are cross-feature). Update any broken import paths from moved components.

### 13.5 — Utils (move in place)

- [ ] **13.5.1** All `utils/` files stay at `utils/` (same folder — only `initializeNotifications.ts` moved to `core/` in 12.3.6). Update any broken import paths.

---

## Phase 14 — Frontend: TanStack Query Integration

> Install the server-state layer before migrating feature pages so hooks are available.

- [ ] **14.1** Create `client/src/core/queryClient.ts`. Instantiate `QueryClient` with `defaultOptions: { queries: { staleTime: 30_000 } }`. Export singleton.
- [ ] **14.2** Wrap `<App />` with `<QueryClientProvider client={queryClient}>` in `main.tsx`.
- [ ] **14.3** Create the first query hook as a reference implementation: `client/src/features/mood/hooks/useMoodEntries.ts`. `useQuery({ queryKey: ['mood', 'entries'], queryFn: moodService.listEntries })`.
- [ ] **14.4** Initialise Sentry in `client/src/main.tsx`: `Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, traces_sample_rate: 0.1, send_default_pii: false })`.

---

## Phase 15 — Frontend Feature Slices (16 features)

> For each feature: (1) create feature folder, (2) move/rewrite service to use `core/api.ts` + TanStack Query, (3) move components, (4) move page, (5) add feature's `types.ts`, (6) register route in `core/router.tsx` with `lazy()`.

### 15.1 — Auth Feature

- [ ] **15.1.1** Create `features/auth/` folder.
- [ ] **15.1.2** Move `services/authService.ts` → `features/auth/service.ts`.
- [ ] **15.1.3** Move `pages/LoginPage.tsx` → `features/auth/pages/LoginPage.tsx`. Migrate form to `react-hook-form` + `zod` resolver.
- [ ] **15.1.4** Move `pages/RegisterPage.tsx` → `features/auth/pages/RegisterPage.tsx`. Migrate form to `react-hook-form` + `zod`.
- [ ] **15.1.5** Register routes in `core/router.tsx` with `lazy()`.

### 15.2 — Text Analysis Feature

- [ ] **15.2.1** Create `features/text_analysis/` folder.
- [ ] **15.2.2** Move all 8 components from `components/analysis/` (TextInput, AnalysisResults, EmotionChart, EmotionHero, PersonalizedResponse, CareRecommendations, ReviewStatus, MusicPlayer) → `features/text_analysis/components/`.
- [ ] **15.2.3** Move `pages/TextAnalysisPage.tsx` → `features/text_analysis/pages/TextAnalysisPage.tsx`.
- [ ] **15.2.4** Create `features/text_analysis/service.ts`. Migrate to use `core/api.ts`. Implement `textAnalysisApi.analyze`, `textAnalysisApi.submitFeedback`, `textAnalysisApi.getReviewStatus`.
- [ ] **15.2.5** Create `features/text_analysis/types.ts`. Move relevant shapes from `types/index.ts`.
- [ ] **15.2.6** Register route with `lazy()`.

### 15.3 — Speech Analysis Feature

- [ ] **15.3.1** Create `features/speech_analysis/` folder.
- [ ] **15.3.2** Move 3 components (AudioRecordingInstructions, AudioEmotionChart, AudioEmotionHero) → `features/speech_analysis/components/`.
- [ ] **15.3.3** Move `pages/AudioAnalysisPage.tsx` → `features/speech_analysis/pages/AudioAnalysisPage.tsx`.
- [ ] **15.3.4** Create `features/speech_analysis/service.ts`. Implement `speechAnalysisApi.startSession`, `analyzeFile`, `getSession`.
- [ ] **15.3.5** Create `features/speech_analysis/types.ts`. Register route with `lazy()`.

### 15.4 — Facial Analysis Feature

- [ ] **15.4.1** Create `features/facial_analysis/` folder.
- [ ] **15.4.2** Move 5 components (CameraInstructions, VideoEmotionChart, VideoEmotionHero, VideoAnalysisInsights, VideoPlayer) → `features/facial_analysis/components/`.
- [ ] **15.4.3** Move `pages/VideoAnalysisPage.tsx` → `features/facial_analysis/pages/VideoAnalysisPage.tsx`.
- [ ] **15.4.4** Create `features/facial_analysis/service.ts`. Implement `facialAnalysisApi.startSession`, `analyzeFrame`, `endSession`.
- [ ] **15.4.5** Create `features/facial_analysis/types.ts`. Register route with `lazy()`.

### 15.5 — Mood Feature

- [ ] **15.5.1** Create `features/mood/` folder.
- [ ] **15.5.2** Move 4 components (MoodCalendar, MoodEntryForm, DayIndicator, WeeklyMoodOverview) → `features/mood/components/`.
- [ ] **15.5.3** Move `pages/MoodTrackerPage.tsx` → `features/mood/pages/MoodTrackerPage.tsx`.
- [ ] **15.5.4** Move `services/moodService.ts` → `features/mood/service.ts`. Wrap with TanStack Query hooks in `features/mood/hooks/`.
- [ ] **15.5.5** Create `features/mood/types.ts`. Register route with `lazy()`.

### 15.6 — Health Metrics Feature

- [ ] **15.6.1** Create `features/health_metrics/` folder.
- [ ] **15.6.2** Move `components/HealthMetricsWidget.tsx` → `features/health_metrics/components/HealthMetricsWidget.tsx`.
- [ ] **15.6.3** Move `pages/HealthMetricsPage.tsx` → `features/health_metrics/pages/HealthMetricsPage.tsx`.
- [ ] **15.6.4** Move `services/healthMetricsService.ts` → `features/health_metrics/service.ts`.
- [ ] **15.6.5** Create `features/health_metrics/types.ts`. Register route with `lazy()`.

### 15.7 — Assessments Feature

- [ ] **15.7.1** Create `features/assessments/` folder.
- [ ] **15.7.2** Move 6 components (QuestionnaireForm, AssessmentResults, AssessmentResultsModal, AssessmentHistory, AssessmentThankYou, CreateAssessmentRequestModal) → `features/assessments/components/`.
- [ ] **15.7.3** Move 3 pages (AssessmentPage, AssessmentHistoryPage, DoctorPatientAssessmentsPage) → `features/assessments/pages/`.
- [ ] **15.7.4** Merge `services/assessmentService.ts` + `services/doctorAssessmentService.ts` → `features/assessments/service.ts`.
- [ ] **15.7.5** Create `features/assessments/types.ts`. Register routes with `lazy()`.

### 15.8 — Wellness Forms Feature

- [ ] **15.8.1** Create `features/wellness_forms/` folder.
- [ ] **15.8.2** Move 4 components (MentalWellnessForm, AIInsightsDisplay, WellnessFormWithToggle, AIDisclaimer) → `features/wellness_forms/components/`.
- [ ] **15.8.3** Move 4 pages → `features/wellness_forms/pages/`.
- [ ] **15.8.4** Move `services/mentalWellnessFormService.ts` → `features/wellness_forms/service.ts`.
- [ ] **15.8.5** Create `features/wellness_forms/types.ts`. Register routes with `lazy()`.

### 15.9 — Emergency Feature

- [ ] **15.9.1** Create `features/emergency/` folder.
- [ ] **15.9.2** Create `features/emergency/service.ts`. Implement `emergencyContactsApi` calls.
- [ ] **15.9.3** Create `features/emergency/types.ts`. (No page — emergency contacts managed from profile settings.)

### 15.10 — Notifications Feature

- [ ] **15.10.1** Create `features/notifications/` folder.
- [ ] **15.10.2** Move `services/notificationService.ts` → `features/notifications/service.ts`.
- [ ] **15.10.3** Create `features/notifications/types.ts`.

### 15.11 — User Profile Feature

- [ ] **15.11.1** Create `features/user_profile/` folder.
- [ ] **15.11.2** Move 3 pages (ProfilePage, SettingsPage, ConnectDoctorPage) → `features/user_profile/pages/`.
- [ ] **15.11.3** Move `services/userService.ts` → `features/user_profile/service.ts`.
- [ ] **15.11.4** Migrate SettingsPage form to `react-hook-form` + `zod`.
- [ ] **15.11.5** Create `features/user_profile/types.ts`. Register routes with `lazy()`.

### 15.12 — Doctor Profile Feature

- [ ] **15.12.1** Create `features/doctor_profile/` folder.
- [ ] **15.12.2** Move 2 pages (DoctorProfilePage, DoctorPatientsPage) → `features/doctor_profile/pages/`.
- [ ] **15.12.3** Move `services/doctorService.ts` → `features/doctor_profile/service.ts`.
- [ ] **15.12.4** Create `features/doctor_profile/types.ts`. Register routes with `lazy()`.

### 15.13 — Dashboard Feature

- [ ] **15.13.1** Create `features/dashboard/` folder.
- [ ] **15.13.2** Move 2 pages (DashboardPage, DoctorDashboardPage) → `features/dashboard/pages/`.
- [ ] **15.13.3** Move `services/dashboardService.ts` → `features/dashboard/service.ts`.
- [ ] **15.13.4** Create `features/dashboard/types.ts`. Register routes with `lazy()`.

### 15.14 — History Feature

- [ ] **15.14.1** Create `features/history/` folder.
- [ ] **15.14.2** Move `pages/HistoryPage.tsx` → `features/history/pages/HistoryPage.tsx`.
- [ ] **15.14.3** Create `features/history/service.ts`. Implement `historyApi.getHistory` (paginated), `deleteAnalysis`, `clearHistory`.
- [ ] **15.14.4** Create `features/history/types.ts`. Register route with `lazy()`.

### 15.15 — Help Feature (previously missing from architecture doc)

- [ ] **15.15.1** Create `features/help/pages/HelpPage.tsx` at new location. Register route with `lazy()`.

### 15.16 — App.tsx Cleanup

- [ ] **15.16.1** Remove all inline `import` statements for feature pages from `App.tsx`. All page imports now live in `core/router.tsx` via `lazy()`.
- [ ] **15.16.2** Confirm `App.tsx` only contains provider composition and `<RouterProvider>` mount.
- [ ] **15.16.3** Confirm all 23 active routes are correctly declared in `core/router.tsx`.

---

## Phase 16 — Backend Tests

### 16.1 — Test Infrastructure

- [ ] **16.1.1** Create `tests/conftest.py`. Implement: in-memory SQLite test DB fixture, `override_get_db` FastAPI dependency override, `AsyncClient` fixture for HTTP tests, `test_user_token` and `test_doctor_token` auth fixtures.
- [ ] **16.1.2** Confirm `pyproject.toml` `[tool.pytest.ini_options]` has `asyncio_mode = "auto"` and `testpaths = ["tests"]`.

### 16.2 — Security Unit Tests

- [ ] **16.2.1** Create `tests/unit/security/test_encryption.py`. Test `encrypt_field`/`decrypt_field` round-trip. Test `derive_key` determinism.
- [ ] **16.2.2** Create `tests/unit/security/test_privacy.py`. Test `anonymise_user_id` is consistent and not reversible. Test `mask_text` masks PII patterns.
- [ ] **16.2.3** Create `tests/unit/security/test_audit.py`. Test `AuditLogger.log` never logs forbidden fields (password, token, etc.).

### 16.3 — Analysis Unit Tests

- [ ] **16.3.1** Create `tests/unit/analysis/test_text_reasoner.py`. Mock OpenAI client. Test `build_prompt` output, `parse_response` for valid and malformed LLM outputs.
- [ ] **16.3.2** Create `tests/unit/analysis/test_speech_reasoner.py`. Same pattern.
- [ ] **16.3.3** Create `tests/unit/analysis/test_facial_reasoner.py`. Same pattern.

### 16.4 — Feature Service Unit Tests

- [ ] **16.4.1** Create `tests/unit/features/test_auth_service.py`. Mock `UserRepository`. Test register (success, duplicate email → ConflictError), login (valid, wrong password → UnauthorizedError), lockout after N failures.
- [ ] **16.4.2** Create `tests/unit/features/test_assessment_service.py`. Test idempotency: submitting twice in same month returns existing record.
- [ ] **16.4.3** Create `tests/unit/features/test_recommendation_store.py`. Test `reset_user_session` deletes only the correct user's rows (not another user's).
- [ ] **16.4.4** Create `tests/unit/features/test_emergency_service.py`. Test cooldown enforcement: second dispatch within cooldown period is rejected.
- [ ] **16.4.5** Create `tests/unit/features/test_scoring.py`. Test PHQ-9 and GAD-7 scoring with known inputs and expected severity outputs.

### 16.5 — Integration Tests

- [ ] **16.5.1** Create `tests/integration/features/test_auth_router.py`. Full `POST /api/v1/auth/register/user` → `POST /api/v1/auth/login` flow with test DB.
- [ ] **16.5.2** Create `tests/integration/features/test_text_analysis_router.py`. `POST /api/v1/text-analysis/analyze` with mocked `TextAnalyzer` and `TextReasoner`.
- [ ] **16.5.3** Create `tests/integration/features/test_mood_router.py`. Full CRUD flow for mood entries.
- [ ] **16.5.4** Create `tests/integration/features/test_health_check.py`. `GET /api/v1/health` with live DB connection returns 200. Simulate DB down returns 503.
- [ ] **16.5.5** Create `tests/integration/features/test_recommendations_router.py`. Test music recommend → report-played → reset-history cycle. Confirm reset clears only the requesting user's data.
- [ ] **16.5.6** Run `pytest tests/ --cov=server --cov-fail-under=80`. Fix any failures. Do not merge until coverage gate passes.

---

## Phase 17 — Frontend Tests

### 17.1 — Vitest Setup

- [ ] **17.1.1** Create `client/vitest.config.ts`. Set `environment: "jsdom"`, import `@testing-library/jest-dom` setup.
- [ ] **17.1.2** Create `client/src/test-setup.ts`. Add `import '@testing-library/jest-dom'`.
- [ ] **17.1.3** Create MSW handler file `client/src/mocks/handlers.ts`. Define mock API handlers for auth, mood, and text analysis endpoints.
- [ ] **17.1.4** Create `client/src/mocks/server.ts`. `setupServer(...handlers)`.

### 17.2 — Utility Unit Tests

- [ ] **17.2.1** Create `client/src/utils/__tests__/cn.test.ts`. Test class merging logic.
- [ ] **17.2.2** Create `client/src/utils/__tests__/healthValidation.test.ts`. Test O2/BP/pulse range checks with boundary values.
- [ ] **17.2.3** Create `client/src/utils/__tests__/moodUtils.test.ts`. Test colour mapping and week boundary helpers.
- [ ] **17.2.4** Create `client/src/utils/__tests__/dateTimeUtils.test.ts`. Test UTC conversion and timezone-aware formatting.

### 17.3 — Component Tests

- [ ] **17.3.1** Create `client/src/shared/components/__tests__/Button.test.tsx`. Test primary/secondary/ghost variants render. Test disabled state.
- [ ] **17.3.2** Create `client/src/shared/components/__tests__/Modal.test.tsx`. Test open/close, keyboard Escape closes, focus trap.
- [ ] **17.3.3** Create `client/src/features/auth/__tests__/LoginPage.test.tsx`. Test empty submit shows validation errors. Test successful login calls `authService.login`.

### 17.4 — E2E Tests (Playwright)

- [ ] **17.4.1** Create `client/e2e/auth.spec.ts`. Test full login → dashboard redirect flow.
- [ ] **17.4.2** Create `client/e2e/text_analysis.spec.ts`. Test login → navigate to text analysis → submit text → receive results.
- [ ] **17.4.3** Create `client/e2e/doctor_flow.spec.ts`. Test doctor login → view patients → create assessment request.
- [ ] **17.4.4** Run `playwright test`. Fix any failures before proceeding.

---

## Phase 18 — Infrastructure and DevOps

### 18.1 — Dockerfile

- [ ] **18.1.1** Create `Dockerfile` at repository root with multi-stage build:
  - Stage 1 (`deps`): `FROM python:3.12-slim`. Install `uv`. Run `uv sync --no-install-project` to install all project dependencies.
  - Stage 2 (`app`): `FROM python:3.12-slim`. Copy venv from stage 1. Copy `server/` source. Create non-root user UID 1001. Set `USER 1001`. Expose port 8000.
- [ ] **18.1.2** Confirm no secrets or `.env` files are `COPY`ed into the image.
- [ ] **18.1.3** Add `.dockerignore`: exclude `model_cache/`, `data/`, `.env*`, `__pycache__`, `tests/`, `client/node_modules/`.

### 18.2 — Docker Compose

- [ ] **18.2.1** Create `docker-compose.yml`. Define three services:
  - `db`: `postgres:16-alpine`. Persistent named volume. Health check with `pg_isready`.
  - `api`: built from `Dockerfile`. Depends on `db` (health check). Mounts `./data` for media. Reads `.env`. Exposes 8000.
  - `frontend` (dev profile only): `node:22-alpine`. Mounts `./client`. Exposes 3000. Production uses nginx to serve Vite build and proxy `/api/v1`.
- [ ] **18.2.2** Confirm no hardcoded passwords in `docker-compose.yml` — all credentials from `.env`.

### 18.3 — Scripts

- [ ] **18.3.1** Create `scripts/check_env.py`. Validate all required env vars listed in `.env.example` are set before deploy. Exit with non-zero code and list missing vars on failure.
- [ ] **18.3.2** Confirm `scripts/seed_db.py` (from Phase 2.6) is complete and idempotent (running twice does not insert duplicate rows — upsert logic).

### 18.4 — GitHub Actions CI/CD

- [ ] **18.4.1** Create `.github/workflows/ci.yml`.
- [ ] **18.4.2** Add `lint-backend` job: `ruff check server/ && ruff format --check server/`.
- [ ] **18.4.3** Add `type-backend` job: `pyright server/`.
- [ ] **18.4.4** Add `test-backend` job: `pytest tests/ --cov=server --cov-fail-under=80`. Depends on `lint-backend` and `type-backend`.
- [ ] **18.4.5** Add `lint-frontend` job: `eslint client/src/`.
- [ ] **18.4.6** Add `type-frontend` job: `tsc --noEmit` in `client/`.
- [ ] **18.4.7** Add `test-frontend` job: `vitest run`. Depends on `lint-frontend` and `type-frontend`.
- [ ] **18.4.8** Add `build-frontend` job: `vite build`. Depends on `test-frontend`.
- [ ] **18.4.9** Add `docker-build` job: `docker build .`. Does not push on PRs.
- [ ] **18.4.10** Add `deploy` job (main branch only): push Docker image, run `alembic upgrade head`, restart container. Requires `test-backend`, `build-frontend`, and `docker-build` to pass.
- [ ] **18.4.11** Configure backend and frontend lint/type/test jobs to run in parallel where there are no dependencies.

### 18.5 — README

- [ ] **18.5.1** Update `README.md` with: prerequisites (Python 3.12, Node 22, Docker), setup steps (`cp .env.example .env`, `uv sync`, `alembic upgrade head`, `npm install`), dev run commands (`uvicorn`, `npm run dev`), prod run (`docker compose up`), test commands (`pytest`, `vitest run`, `playwright test`).

---

## Phase 19 — Final Cleanup and Validation

### 19.1 — Delete Original Source Tree

> Only after every feature is confirmed working in the new structure.

- [ ] **19.1.1** Delete `src/` directory entirely.
- [ ] **19.1.2** Delete original `main.py` at repository root (replaced by `server/main.py`).
- [ ] **19.1.3** Delete `requirements.txt` (replaced by `pyproject.toml`).
- [ ] **19.1.4** Delete `ModelTraining/` directory. Training notebooks are archived; training scripts that serve as fixtures are moved to `tests/integration/analysis/`.
- [ ] **19.1.5** Delete original `frontend/` directory (renamed to `client/` in Phase 12.1.1).

### 19.2 — Lint and Type-check Pass

- [ ] **19.2.1** Run `ruff check server/` — zero errors.
- [ ] **19.2.2** Run `ruff format --check server/` — zero formatting issues.
- [ ] **19.2.3** Run `pyright server/` — zero type errors.
- [ ] **19.2.4** Run `eslint client/src/` — zero errors.
- [ ] **19.2.5** Run `tsc --noEmit` in `client/` — zero type errors.

### 19.3 — Full Test Suite Pass

- [ ] **19.3.1** Run `pytest tests/ --cov=server --cov-fail-under=80` — passes.
- [ ] **19.3.2** Run `vitest run` in `client/` — passes.
- [ ] **19.3.3** Run `playwright test` — all E2E tests pass.

### 19.4 — Architecture Documentation Update

- [ ] **19.4.1** Update `Docs/MindNeedAI_Refactor_Architecture.md` to mark any decisions that changed during implementation.
- [ ] **19.4.2** Tick off this checklist file (`Docs/Refactor_Phase_Implementation.md`) to reflect completion.

---

## Phase Summary Table

| Phase | Name | Prerequisite |
|---|---|---|
| 0 | Critical Bug Fixes | None — do first |
| 1 | Project Foundation | Phase 0 |
| 2 | Database Foundation | Phase 1 |
| 3 | Infrastructure Adapters | Phase 2 |
| 4 | Security & Cross-cutting | Phase 3 |
| 5 | App Factory & Main Entry | Phase 4 |
| 6 | Analysis Shared Base Classes | Phase 5 |
| 7 | Auth Feature Slice | Phase 6 |
| 8 | Analysis Feature Slices | Phase 7 |
| 9 | Recommendation Feature Slices | Phase 8 |
| 10 | Health, Wellness & Assessment | Phase 9 |
| 11 | User, Doctor & Admin | Phase 10 |
| 12 | Frontend Foundation | Phase 11 |
| 13 | Frontend Shared Layer | Phase 12 |
| 14 | TanStack Query Integration | Phase 13 |
| 15 | Frontend Feature Slices | Phase 14 |
| 16 | Backend Tests | Phase 15 |
| 17 | Frontend Tests | Phase 16 |
| 18 | Infrastructure & DevOps | Phase 17 |
| 19 | Final Cleanup & Validation | Phase 18 |

**Total steps: 219**

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'mna_auth_token',
  AUTH_STATE: 'mna_auth_state',
  PREFERENCES: 'mna_preferences',
  SIDEBAR_COLLAPSED: 'mna_sidebar_collapsed',
  DRAFT_TEXT: 'mna_draft_text',
  LAST_ANALYSIS: 'mna_last_analysis',
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const INFERENCE_TIMEOUT_MS = 60_000;
export const TEXT_INPUT_MAX_CHARS = 5_000;

export const TOKEN_EXPIRY_BUFFER_MS = 30_000;

export const TOAST_DURATION_MS = 4_000;
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

export const MOOD_SCORE_MIN = 1;
export const MOOD_SCORE_MAX = 10;

export const HEALTH_O2_LOW = 95;
export const HEALTH_O2_CRITICAL = 90;
export const HEALTH_PULSE_MIN = 40;
export const HEALTH_PULSE_MAX = 200;

import { STORAGE_KEYS } from '@/core/constants';

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

export const session = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = sessionStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },
  clearToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
  },
};

interface Draft {
  content: string;
  savedAt: number;
}

export const draftStorage = {
  save: (content: string): boolean =>
    storage.set<Draft>(STORAGE_KEYS.DRAFT_TEXT, { content, savedAt: Date.now() }),

  get: (): Draft | null =>
    storage.get<Draft | null>(STORAGE_KEYS.DRAFT_TEXT, null),

  clear: (): boolean => storage.remove(STORAGE_KEYS.DRAFT_TEXT),
};

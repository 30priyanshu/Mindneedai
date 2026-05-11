import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/core/api';
import { storage } from '@/core/storage';
import { STORAGE_KEYS } from '@/core/constants';
import { useAuth } from './AuthContext';

export interface UserPreferences {
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  textToSpeech: boolean;
  autoSave: boolean;
  notifications: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  textToSpeech: false,
  autoSave: true,
  notifications: true,
};

const FONT_SIZE_MAP: Record<UserPreferences['fontSize'], string> = {
  normal: '1rem',
  large: '1.125rem',
  'extra-large': '1.25rem',
};

const VALID_FONT_SIZES = ['normal', 'large', 'extra-large'] as const;

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const validateFontSize = (size: string): UserPreferences['fontSize'] =>
  VALID_FONT_SIZES.includes(size as UserPreferences['fontSize'])
    ? (size as UserPreferences['fontSize'])
    : 'normal';

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(
    storage.get<UserPreferences>(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES)
  );
  const [isLoading, setIsLoading] = useState(false);

  // Apply CSS side-effects whenever preferences change
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = FONT_SIZE_MAP[preferences.fontSize];
    root.classList.toggle('high-contrast', preferences.highContrast);
    root.classList.toggle('reduce-motion', preferences.reduceMotion);
  }, [preferences]);

  // Fetch from backend once on login (users only)
  useEffect(() => {
    if (!isAuthenticated || role !== 'user') return;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get<Partial<UserPreferences>>('/users/preferences');
        const merged: UserPreferences = {
          ...DEFAULT_PREFERENCES,
          ...data,
          fontSize: validateFontSize(data.fontSize ?? 'normal'),
        };
        setPreferences(merged);
        storage.set(STORAGE_KEYS.PREFERENCES, merged);
      } catch {
        // keep local defaults on failure
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [isAuthenticated, role]);

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    storage.set(STORAGE_KEYS.PREFERENCES, updated);
    if (isAuthenticated && role === 'user') {
      try {
        await api.put('/users/preferences', { [key]: value });
      } catch {
        // non-fatal — local state already updated
      }
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference, isLoading }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};

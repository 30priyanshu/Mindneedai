import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import api from '@/core/api';
import { storage, authStorage } from '@/core/storage';
import { isTokenExpired } from '@/utils/jwt';
import { STORAGE_KEYS } from '@/core/constants';
import type { UserRole } from '@/core/types';
import { isApiError } from '@/core/exceptions';
import { authApi } from '@/features/auth/service';
import type { AuthResponse } from '@/features/auth/types';

export type { AuthResponse } from '@/features/auth/types';

// ── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  userId: string | null;
  email: string | null;
  name: string | null;
  token: string | null;
  doctorCode: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  registerUser: (email: string, password: string, name: string) => Promise<AuthResponse>;
  registerDoctor: (
    email: string,
    password: string,
    name: string,
    licenseNumber?: string,
    specialty?: string
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  role: null,
  userId: null,
  email: null,
  name: null,
  token: null,
  doctorCode: null,
  loading: true,
};

// ── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const bootstrapping = useRef(false);

  const clearAuth = useCallback((): void => {
    authStorage.clearToken();
    storage.remove(STORAGE_KEYS.AUTH_STATE);
    setState({ ...INITIAL_STATE, loading: false });
  }, []);

  const persistAuth = useCallback((data: AuthResponse): void => {
    authStorage.setToken(data.token);
    storage.set(STORAGE_KEYS.AUTH_STATE, {
      role: data.role,
      userId: data.id,
      email: data.email,
      name: data.name,
      doctorCode: data.doctor_code ?? null,
    });
    setState({
      isAuthenticated: true,
      token: data.token,
      role: data.role,
      userId: data.id,
      email: data.email,
      name: data.name,
      doctorCode: data.doctor_code ?? null,
      loading: false,
    });
  }, []);

  // Bootstrap auth state from localStorage on mount
  useEffect(() => {
    if (bootstrapping.current) return;
    bootstrapping.current = true;

    const bootstrap = async (): Promise<void> => {
      const token = authStorage.getToken();
      const saved = storage.get<AuthState | null>(STORAGE_KEYS.AUTH_STATE, null);

      if (!token || !saved) return clearAuth();
      if (isTokenExpired(token)) return clearAuth();

      try {
        // Verify token is still valid by fetching profile
        const { data } = await api.get<{
          role: UserRole;
          user_id?: string;
          doctor_id?: string;
          email: string;
          name: string;
          doctor_code?: string;
        }>('/auth/me');

        const userId = data.role === 'doctor' ? data.doctor_id! : data.user_id!;
        setState({
          isAuthenticated: true,
          token,
          role: data.role,
          userId,
          email: data.email,
          name: data.name,
          doctorCode: data.doctor_code ?? null,
          loading: false,
        });
      } catch (err: unknown) {
        const status = isApiError(err) ? err.code : 0;
        if (status === 401 || status === 403) return clearAuth();
        // Network error — restore from cache, don't clear
        if (saved) {
          setState({
            isAuthenticated: true,
            token,
            role: saved.role,
            userId: saved.userId,
            email: saved.email,
            name: saved.name,
            doctorCode: saved.doctorCode,
            loading: false,
          });
        } else {
          clearAuth();
        }
      }
    };

    bootstrap().finally(() => {
      bootstrapping.current = false;
    });
  }, [clearAuth]);

  const login = useCallback(
    async (email: string, password: string, role: UserRole): Promise<void> => {
      const data = await authApi.login({ email, password, role });
      persistAuth(data);
    },
    [persistAuth]
  );

  const registerUser = useCallback(
    async (email: string, password: string, name: string): Promise<AuthResponse> => {
      const data = await authApi.registerUser({ email, password, name });
      return data;
    },
    []
  );

  const registerDoctor = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      licenseNumber?: string,
      specialty?: string
    ): Promise<AuthResponse> => {
      const data = await authApi.registerDoctor({
        email,
        password,
        name,
        ...(licenseNumber && { license_number: licenseNumber }),
        ...(specialty && { specialty }),
      });
      return data;
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // ignore — always clear locally
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider value={{ ...state, login, registerUser, registerDoctor, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

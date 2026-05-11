import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { isTokenExpired } from '@/utils/jwt';
import { API_BASE_URL, STORAGE_KEYS } from '@/core/constants';
import type { ApiError } from '@/core/exceptions';

const api = axios.create({
  baseURL: API_BASE_URL,
});

console.log("MindNeedAI API connecting to:", API_BASE_URL);

let redirectingToLogin = false;

function redirectToLogin(): void {
  if (redirectingToLogin) return;
  const isAuthPage =
    window.location.pathname === '/login' ||
    window.location.pathname === '/register';
  if (isAuthPage) return;
  redirectingToLogin = true;
  window.location.href = '/login';
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return config;

    if (isTokenExpired(token)) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
      redirectToLogin();
      return Promise.reject(buildApiError('Session expired. Please log in again.', 401));
    }

    config.headers.Authorization ??= `Bearer ${token}`;
    return config;
  },
  (error: unknown) => Promise.reject(normaliseError(error)),
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: unknown) => {
    const axiosErr = error instanceof AxiosError ? error : null;
    const status = axiosErr?.response?.status;

    if (status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
      redirectToLogin();
    }

    return Promise.reject(normaliseError(error));
  },
);

function normaliseError(error: unknown): ApiError {
  if (!(error instanceof AxiosError)) {
    return buildApiError(String(error), 0);
  }

  const data: unknown = error.response?.data;
  const status = error.response?.status ?? 0;
  const requestId = extractRequestId(error);

  if (isCustomError(data)) {
    const err: ApiError = {
      message: data.error.message,
      code: data.error.code ?? status,
    };
    const rid = data.error.request_id ?? requestId;
    if (rid !== undefined) err.requestId = rid;
    return err;
  }

  if (isDetailError(data)) {
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : data.detail.map((d) => d.msg).join('; ');
    const details = Array.isArray(data.detail) ? (data.detail as unknown[]) : undefined;
    const err: ApiError = { message, code: status };
    if (requestId !== undefined) err.requestId = requestId;
    if (details !== undefined) err.details = details;
    return err;
  }

  return buildApiError(error.message || 'An unexpected error occurred.', status, requestId);
}

function buildApiError(message: string, code: number, requestId?: string): ApiError {
  const err: ApiError = { message, code };
  if (requestId !== undefined) err.requestId = requestId;
  return err;
}

function extractRequestId(error: AxiosError): string | undefined {
  const rid = error.response?.headers?.['x-request-id'];
  return typeof rid === 'string' ? rid : undefined;
}

interface CustomErrorShape {
  error: { message: string; code?: number; request_id?: string };
}

interface DetailErrorShape {
  detail: string | Array<{ msg: string }>;
}

function isCustomError(data: unknown): data is CustomErrorShape {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as CustomErrorShape).error?.message === 'string'
  );
}

function isDetailError(data: unknown): data is DetailErrorShape {
  return (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    (data as DetailErrorShape).detail !== undefined
  );
}

export default api;

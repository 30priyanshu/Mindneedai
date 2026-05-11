import { TOKEN_EXPIRY_BUFFER_MS } from '@/core/constants';

export interface JWTPayload {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - TOKEN_EXPIRY_BUFFER_MS;
}

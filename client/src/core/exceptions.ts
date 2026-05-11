export interface ApiError {
  message: string;
  code: number;
  requestId?: string;
  details?: unknown[];
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    'code' in err
  );
}

import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/core/exceptions';

function queryRetry(failureCount: number, error: unknown): boolean {
  const status = isApiError(error) ? error.code : 0;
  const retryable = status < 400 || status >= 500 || status === 0;
  return retryable && failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: queryRetry,
    },
  },
});

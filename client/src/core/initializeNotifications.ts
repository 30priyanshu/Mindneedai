/**
 * Single responsibility: optional browser notification permission bootstrap on app start.
 * If the Notification API is unavailable or permission is already decided, this is a no-op.
 * We do not persist or log permission results to avoid fingerprinting / noisy analytics.
 */
export const initializeNotifications = (): void => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  if (Notification.permission !== 'default') return;
  void Notification.requestPermission().catch(() => {
    /* user dismissed prompt or browser blocked — safe to ignore */
  });
};

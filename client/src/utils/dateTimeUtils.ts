/**
 * Date/time formatting with timezone awareness.
 * Single responsibility: locale-safe display helpers for timestamps.
 */

export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

export const getTimezoneAbbr = (timezone: string = getUserTimezone()): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? 'UTC';
  } catch {
    return 'UTC';
  }
};

export const formatDateTime = (
  dateString: string | Date,
  options?: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    timezone?: string;
  },
): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const timezone = options?.timezone ?? getUserTimezone();

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  if (options?.includeTime === true) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    if (options?.includeSeconds === true) {
      formatOptions.second = '2-digit';
    }
  }

  return date.toLocaleString('en-US', formatOptions);
};

export const formatDateWithTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const timezone = getUserTimezone();
  const tzAbbr = getTimezoneAbbr(timezone);

  const formatted = date.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${formatted} ${tzAbbr}`;
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  const timezone = getUserTimezone();
  const tzAbbr = getTimezoneAbbr(timezone);

  const formatted = date.toLocaleString('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: days < 365 ? undefined : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${formatted} ${tzAbbr}`;
};

export const formatTimeOnly = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const timezone = getUserTimezone();

  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  });
};

import { MOOD_SCORE_MIN, MOOD_SCORE_MAX } from '@/core/constants';

export const validateScore = (score: number): boolean =>
  Number.isInteger(score) && score >= MOOD_SCORE_MIN && score <= MOOD_SCORE_MAX;

export const formatMoodDate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getTodayString = (): string => formatMoodDate(new Date());

export const getWeekDates = (offset = 0): string[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return formatMoodDate(d);
  });
};

const SCORE_COLORS: [number, string][] = [
  [4, '#EF4444'],
  [6, '#F97316'],
  [8, '#EAB308'],
  [Infinity, '#22C55E'],
];

export const getColorForScore = (score?: number | null): string => {
  if (score == null) return '#374151';
  return SCORE_COLORS.find(([max]) => score <= max)?.[1] ?? '#22C55E';
};

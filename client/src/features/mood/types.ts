import { MOOD_SCORE_MIN, MOOD_SCORE_MAX } from '@/core/constants';

export interface MoodEntry {
  entry_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  score: number; // MOOD_SCORE_MIN–MOOD_SCORE_MAX
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMoodData {
  week_start: string;   // YYYY-MM-DD
  week_end: string;     // YYYY-MM-DD
  entries: (MoodEntry | null)[]; // length 7, Mon–Sun
}

export interface SaveMoodEntryRequest {
  date: string;         // YYYY-MM-DD
  score: number;
  note?: string | null;
}

export { MOOD_SCORE_MIN, MOOD_SCORE_MAX };

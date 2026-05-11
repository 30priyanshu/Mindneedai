import api from '@/core/api';
import type { MoodEntry, WeeklyMoodData, SaveMoodEntryRequest } from '../types';

/** Build a fallback empty WeeklyMoodData for the given week offset */
const emptyWeek = (offset: number): WeeklyMoodData => {
  const monday = new Date();
  monday.setDate(monday.getDate() - monday.getDay() + 1 + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    week_start: monday.toISOString().slice(0, 10),
    week_end: sunday.toISOString().slice(0, 10),
    entries: Array<null>(7).fill(null),
  };
};

export const moodApi = {
  save: async (payload: SaveMoodEntryRequest): Promise<MoodEntry> => {
    const { data } = await api.post<MoodEntry>('/mood', payload);
    return data;
  },

  getWeekly: async (offset = 0): Promise<WeeklyMoodData> => {
    try {
      const { data } = await api.get<WeeklyMoodData>(`/mood/weekly?week_offset=${offset}`);
      return data;
    } catch {
      return emptyWeek(offset); // graceful degradation — empty week on network failure
    }
  },

  getEntries: async (start?: string, end?: string): Promise<MoodEntry[]> => {
    const params: Record<string, string> = {};
    if (start) params.start = start;
    if (end) params.end = end;
    const { data } = await api.get<MoodEntry[]>('/mood', { params });
    return data ?? [];
  },

  getByDate: async (date: string): Promise<MoodEntry | null> => {
    try {
      const { data } = await api.get<MoodEntry>(`/mood/entry/${date}`);
      return data;
    } catch {
      return null;
    }
  },

  delete: async (date: string): Promise<void> => {
    await api.delete(`/mood/entry/${date}`);
  },
};

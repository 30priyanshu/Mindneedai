import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moodApi } from '../services/moodService';
import type { SaveMoodEntryRequest } from '../types';

export const MOOD_KEYS = {
  weekly: (offset: number) => ['mood', 'weekly', offset] as const,
  entries: (start?: string, end?: string) => ['mood', 'entries', start, end] as const,
};

export const useMoodWeekly = (offset: number) =>
  useQuery({
    queryKey: MOOD_KEYS.weekly(offset),
    queryFn: () => moodApi.getWeekly(offset),
    staleTime: 60_000,
  });

export const useSaveMoodEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveMoodEntryRequest) => moodApi.save(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mood'] });
    },
  });
};

export const useDeleteMoodEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => moodApi.delete(date),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mood'] });
    },
  });
};

export { useMoodEntries } from './useMoodEntries';

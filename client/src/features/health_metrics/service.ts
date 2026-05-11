import api from '@/core/api';
import type { HealthMetricsPayload, HealthMetricsEntry } from './types';

export type { HealthMetricsPayload, HealthMetricsAIAnalysis, HealthMetricsEntry } from './types';

export const healthMetricsApi = {
  log: async (payload: HealthMetricsPayload): Promise<HealthMetricsEntry> => {
    const { data } = await api.post<HealthMetricsEntry>('/health-metrics', payload);
    return data;
  },

  getHistory: async (page = 1, size = 20): Promise<HealthMetricsEntry[]> => {
    const { data } = await api.get<HealthMetricsEntry[]>('/health-metrics', {
      params: { page, size },
    });
    return data;
  },

  getLatest: async (): Promise<HealthMetricsEntry | null> => {
    try {
      const { data } = await api.get<HealthMetricsEntry>('/health-metrics/latest');
      return data;
    } catch {
      return null;
    }
  },

  delete: async (entryId: string): Promise<void> => {
    await api.delete(`/health-metrics/${entryId}`);
  },
};

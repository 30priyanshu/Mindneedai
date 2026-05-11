import api from '@/core/api';
import type { AnalysisModality } from '@/core/types';
import type { AnalysisHistoryResponse } from './types';

export type { AnalysisHistoryEntry, AnalysisHistoryResponse } from './types';

export const historyApi = {
  getHistory: async (params: {
    modality?: AnalysisModality;
    page?: number;
    size?: number;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<AnalysisHistoryResponse> => {
    const { data } = await api.get<AnalysisHistoryResponse>('/users/history', {
      params: {
        page: params.page ?? 1,
        size: params.size ?? 20,
        ...(params.modality ? { modality: params.modality } : {}),
        ...(params.start_date ? { start_date: params.start_date } : {}),
        ...(params.end_date ? { end_date: params.end_date } : {}),
      },
    });
    return data;
  },

  deleteEntry: async (requestId: string): Promise<void> => {
    await api.delete(`/users/history/${requestId}`);
  },

  clearHistory: async (): Promise<{ deleted: number }> => {
    const { data } = await api.post<{ deleted: number }>('/users/history/clear');
    return data;
  },
};

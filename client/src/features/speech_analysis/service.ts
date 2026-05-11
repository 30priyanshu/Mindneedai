import api from '@/core/api';
import type { AudioSessionStartResponse, AudioFileAnalysisResponse } from './types';

export const speechAnalysisApi = {
  startSession: async (userId: string): Promise<AudioSessionStartResponse> => {
    const { data } = await api.post<AudioSessionStartResponse>('/audio-analysis/start-session', {
      user_id: userId,
      audio_source: 'web',
    });
    return data;
  },

  analyzeFile: async (
    userId: string,
    audioBlob: Blob,
    filename = 'recording.webm',
    sessionId?: string,
  ): Promise<AudioFileAnalysisResponse> => {
    const form = new FormData();
    form.append('user_id', userId);
    form.append('audio_file', audioBlob, filename);
    if (sessionId) form.append('session_id', sessionId);
    const { data } = await api.post<AudioFileAnalysisResponse>(
      '/audio-analysis/analyze-file',
      form,
    );
    return data;
  },

  getSession: async (sessionId: string): Promise<AudioSessionStartResponse> => {
    const { data } = await api.get<AudioSessionStartResponse>(
      `/audio-analysis/session/${sessionId}`,
    );
    return data;
  },
};

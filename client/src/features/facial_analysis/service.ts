import api from '@/core/api';
import type { SessionResponse, FrameAnalysisResponse, SessionSummaryResponse } from './types';

export const facialAnalysisApi = {
  startSession: async (_userId?: string): Promise<SessionResponse> => {
    const { data } = await api.post<SessionResponse>('/video-analysis/start-session', {});
    return data;
  },

  analyzeFrame: async (
    sessionId: string,
    frameData: string,
    frameNumber: number,
    timestamp: number,
  ): Promise<FrameAnalysisResponse> => {
    const { data } = await api.post<FrameAnalysisResponse>('/video-analysis/analyze-frame', {
      session_id: sessionId,
      frame_data: frameData,
      frame_number: frameNumber,
      timestamp,
    });
    return data;
  },

  endSession: async (sessionId: string): Promise<SessionSummaryResponse> => {
    const { data } = await api.post<SessionSummaryResponse>('/video-analysis/end-session', {
      session_id: sessionId,
    });
    return data;
  },

  getSession: async (sessionId: string) => {
    const { data } = await api.get(`/video-analysis/session/${sessionId}`);
    return data;
  },

  listSessions: async (userId?: string, limit: number = 20) => {
    const params = userId ? { user_id: userId, limit } : { limit };
    const { data } = await api.get('/video-analysis/sessions', { params });
    return data;
  },
};

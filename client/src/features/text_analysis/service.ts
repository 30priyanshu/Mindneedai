import api from '@/core/api';
import type {
  TextAnalysisRequest,
  TextAnalysisResponse,
  FeedbackRequest,
  ReviewStatus,
  MusicRecommendation,
  VideoRecommendation,
} from './types';

let abortController: AbortController | null = null;

export const textAnalysisApi = {
  analyze: async (payload: TextAnalysisRequest): Promise<TextAnalysisResponse> => {
    abortController?.abort();
    abortController = new AbortController();
    const { data } = await api.post<TextAnalysisResponse>(
      '/text-analysis/analyze',
      payload,
      { signal: abortController.signal }
    );
    abortController = null;
    return data;
  },

  cancel: (): void => {
    abortController?.abort();
    abortController = null;
  },

  submitFeedback: async (payload: FeedbackRequest): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/text-analysis/feedback', payload);
    return data;
  },

  getReviewStatus: async (reviewRequestId: string): Promise<ReviewStatus> => {
    const { data } = await api.get<ReviewStatus>(`/text-analysis/review/${reviewRequestId}`);
    return data;
  },

  getMusicRecommendation: async (
    emotion: string,
    sessionId?: string
  ): Promise<MusicRecommendation> => {
    const { data } = await api.post<MusicRecommendation>('/music/recommend', {
      emotion,
      session_id: sessionId,
    });
    return data;
  },

  getVideoRecommendation: async (
    emotion: string,
    sessionId?: string
  ): Promise<VideoRecommendation> => {
    const { data } = await api.post<VideoRecommendation>('/video/recommend', {
      emotion,
      session_id: sessionId,
    });
    return data;
  },
};

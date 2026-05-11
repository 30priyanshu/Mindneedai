import api from '@/core/api';
import type { VideoRecommendation, YouTubeRecommendation } from '@/features/text_analysis/types';

export const videoPlatformsApi = {
  getLocalRecommendation: async (
    _userId: string,
    emotion: string,
    sessionId?: string,
  ): Promise<VideoRecommendation> => {
    const { data } = await api.post<VideoRecommendation>('/video/recommend', {
      emotion,
      ...(sessionId ? { session_id: sessionId } : {}),
    });
    return data;
  },

  reportLocalPlayed: async (videoFile: string, _userId?: string, emotion?: string): Promise<void> => {
    if (!emotion) return;
    await api.post('/video/report-played', { video_file: videoFile, emotion });
  },

  reportLocalFailed: async (videoFile: string): Promise<void> => {
    await api.post('/video/report-failed', { video_file: videoFile });
  },

  getYoutubeRecommendation: async (
    _userId: string,
    emotion: string,
    sessionId?: string,
    excludedVideoIds: string[] = [],
  ): Promise<YouTubeRecommendation> => {
    const { data } = await api.post<YouTubeRecommendation>('/youtube/recommend', {
      emotion,
      ...(sessionId ? { session_id: sessionId } : {}),
      excluded_video_ids: excludedVideoIds,
    });
    return data;
  },

  reportYoutubeFailure: async (videoId: string, errorCode?: number): Promise<void> => {
    await api.post('/youtube/report-failure', {
      youtube_video_id: videoId,
      ...(errorCode !== undefined ? { error_code: errorCode } : {}),
    });
  },

  reportYoutubeSuccess: async (videoId: string, _userId?: string, emotion?: string): Promise<void> => {
    if (!emotion) return;
    await api.post('/youtube/report-success', { youtube_video_id: videoId, emotion });
  },
};

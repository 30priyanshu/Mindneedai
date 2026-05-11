import { videoPlatformsApi } from '@/features/text_analysis/videoPlatformsApi';
import type { VideoRecommendation, YouTubeRecommendation } from '@/features/text_analysis/types';

export interface VideoRecommendationsPair {
  local: VideoRecommendation | null;
  youtube: YouTubeRecommendation | null;
}

/** Single responsibility: parallel fetch local + YouTube recommendations. */
export const fetchVideoRecommendationsPair = async (
  userId: string,
  emotion: string,
  sessionId: string | undefined,
): Promise<VideoRecommendationsPair> => {
  const [local, youtube] = await Promise.all([
    videoPlatformsApi.getLocalRecommendation(userId, emotion, sessionId).catch(() => null),
    videoPlatformsApi.getYoutubeRecommendation(userId, emotion, sessionId, []).catch(() => null),
  ]);
  return { local, youtube };
};

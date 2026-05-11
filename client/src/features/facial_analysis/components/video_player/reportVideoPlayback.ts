import { videoPlatformsApi } from '@/features/text_analysis/videoPlatformsApi';

const warn = (action: string, err: unknown): void => {
  console.warn(`[VideoPlayer] ${action} failed`, err);
};

/** Single responsibility: fire-and-forget telemetry for local file playback. */
export const reportLocalPlayedSafe = (
  videoFile: string,
  userId: string,
  emotion: string,
): void => {
  void videoPlatformsApi.reportLocalPlayed(videoFile, userId, emotion).catch((e) => warn('reportLocalPlayed', e));
};

export const reportLocalFailedSafe = (videoFile: string): void => {
  void videoPlatformsApi.reportLocalFailed(videoFile).catch((e) => warn('reportLocalFailed', e));
};

export const reportYoutubeFailureSafe = (videoId: string, errorCode?: number): void => {
  void videoPlatformsApi.reportYoutubeFailure(videoId, errorCode).catch((e) => warn('reportYoutubeFailure', e));
};

export const reportYoutubeSuccessSafe = (
  videoId: string,
  userId: string,
  emotion: string,
): void => {
  void videoPlatformsApi.reportYoutubeSuccess(videoId, userId, emotion).catch((e) => warn('reportYoutubeSuccess', e));
};

import { useEffect, type Dispatch, type MutableRefObject, type RefObject, type SetStateAction } from 'react';
import type { VideoRecommendation, YouTubeRecommendation } from '@/features/text_analysis/types';
import { createYoutubePlayerFromId } from './createYoutubePlayerFromId';
import type { PlayerMode, YoutubePlayerApi } from './videoPlayerTypes';

export interface ActiveVideoAttachmentInput {
  isFetchingRecommendations: boolean;
  playerMode: PlayerMode;
  recommendation: VideoRecommendation | null;
  youtubeRecommendation: YouTubeRecommendation | null;
  initializeVideo: (file: string) => void;
  cleanupLocalBindings: () => void;
  cleanupYouTube: () => void;
  userId: string;
  emotion: string;
  youtubeContainerRef: RefObject<HTMLDivElement | null>;
  youtubePlayerRef: MutableRefObject<YoutubePlayerApi | null>;
  youtubeCleanupRef: MutableRefObject<(() => void) | null>;
  isMountedRef: MutableRefObject<boolean>;
  youtubeIsPlayingRef: MutableRefObject<boolean>;
  setYoutubePlayerReady: Dispatch<SetStateAction<boolean>>;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  setDuration: Dispatch<SetStateAction<number>>;
}

/** Single responsibility: attach local `<video>` or YouTube player when mode / recommendations change. */
export const useActiveVideoAttachment = (input: ActiveVideoAttachmentInput): void => {
  useEffect(() => {
    if (input.isFetchingRecommendations) return;

    if (input.playerMode === 'local') {
      input.cleanupYouTube();
      if (input.recommendation?.success && input.recommendation.video_file) {
        input.initializeVideo(input.recommendation.video_file);
      }
      return;
    }

    const runYoutube = async () => {
      input.cleanupLocalBindings();
      input.cleanupYouTube();
      const id = input.youtubeRecommendation?.youtube_video_id;
      const container = input.youtubeContainerRef.current;
      if (!id || !container || !input.youtubeRecommendation?.success) return;

      input.setYoutubePlayerReady(false);
      const handle = await createYoutubePlayerFromId(id, container, {
        isMounted: () => input.isMountedRef.current,
        userId: input.userId,
        emotion: input.emotion,
        onReady: (d) => {
          input.setYoutubePlayerReady(true);
          if (d > 0) input.setDuration(d);
        },
        onPlaying: (p) => {
          input.youtubeIsPlayingRef.current = p;
          input.setIsPlaying(p);
        },
        onEnded: () => {
          input.youtubeIsPlayingRef.current = false;
          input.setIsPlaying(false);
          input.setCurrentTime(0);
        },
        onTick: (t, d) => {
          input.setCurrentTime(t);
          if (d > 0) input.setDuration(d);
        },
      });
      if (!handle || !input.isMountedRef.current) return;
      input.youtubePlayerRef.current = handle.player;
      input.youtubeCleanupRef.current = handle.cleanup;
    };

    void runYoutube();
  }, [
    input.isFetchingRecommendations,
    input.playerMode,
    input.recommendation,
    input.youtubeRecommendation,
    input.initializeVideo,
    input.cleanupLocalBindings,
    input.cleanupYouTube,
    input.userId,
    input.emotion,
    input.youtubeContainerRef,
    input.youtubePlayerRef,
    input.youtubeCleanupRef,
    input.isMountedRef,
    input.youtubeIsPlayingRef,
    input.setYoutubePlayerReady,
    input.setIsPlaying,
    input.setCurrentTime,
    input.setDuration,
  ]);
};

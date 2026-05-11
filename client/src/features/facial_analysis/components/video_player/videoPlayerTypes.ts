import type { VideoRecommendation } from '@/features/text_analysis/types';

export interface VideoPlayerProps {
  emotion: string;
  userId: string;
  sessionId?: string;
  initialRecommendation?: VideoRecommendation | null;
}

export type PlayerMode = 'local' | 'youtube';

declare global {
  interface Window {
    YT?: { Player: new (id: string, options: Record<string, unknown>) => YoutubePlayerApi; PlayerState: Record<string, number> };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Narrow interface used by our integration (YT types are external). */
export interface YoutubePlayerApi {
  destroy?: () => void;
  pauseVideo?: () => void;
  playVideo?: () => void;
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
}

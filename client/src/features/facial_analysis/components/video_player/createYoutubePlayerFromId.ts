import { loadYoutubeIframeApi } from './loadYoutubeIframeApi';
import { YOUTUBE_STATE_DEBOUNCE_MS } from './constants';
import { reportYoutubeFailureSafe, reportYoutubeSuccessSafe } from './reportVideoPlayback';
import type { YoutubePlayerApi } from './videoPlayerTypes';

export interface YoutubePlayerHandle {
  player: YoutubePlayerApi;
  cleanup: () => void;
}

export interface YoutubeFactoryCallbacks {
  isMounted: () => boolean;
  userId: string;
  emotion: string;
  onReady: (duration: number) => void;
  onPlaying: (playing: boolean) => void;
  onEnded: () => void;
  onTick: (current: number, duration: number) => void;
}

const readDuration = (target: YoutubePlayerApi): number => {
  try {
    const d = target.getDuration?.() ?? 0;
    return Number.isFinite(d) ? d : 0;
  } catch {
    return 0;
  }
};

const readTime = (target: YoutubePlayerApi): { t: number; d: number } => {
  try {
    const t = target.getCurrentTime?.() ?? 0;
    const d = target.getDuration?.() ?? 0;
    return { t: Number.isFinite(t) ? t : 0, d: Number.isFinite(d) ? d : 0 };
  } catch {
    return { t: 0, d: 0 };
  }
};

/** Single responsibility: instantiate a YouTube iframe player with lifecycle hooks. */
export const createYoutubePlayerFromId = async (
  videoId: string,
  container: HTMLDivElement,
  cb: YoutubeFactoryCallbacks,
): Promise<YoutubePlayerHandle | null> => {
  const apiReady = await loadYoutubeIframeApi();
  if (!apiReady || !window.YT?.Player || !cb.isMounted()) return null;

  container.innerHTML = '';
  const host = document.createElement('div');
  const hostId = `ytp-${Date.now()}`;
  host.id = hostId;
  host.style.width = '100%';
  host.style.height = '100%';
  container.appendChild(host);

  let debounce: ReturnType<typeof setTimeout> | null = null;
  let tick: ReturnType<typeof setInterval> | null = null;

  const player = new window.YT.Player(hostId, {
    height: '100%',
    width: '100%',
    videoId,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      controls: 1,
      iv_load_policy: 3,
      origin: window.location.origin,
      enablejsapi: 1,
    },
    events: {
      onReady: (e: { target: YoutubePlayerApi }) => {
        if (!cb.isMounted()) return;
        reportYoutubeSuccessSafe(videoId, cb.userId, cb.emotion);
        cb.onReady(readDuration(e.target));
        tick = window.setInterval(() => {
          if (!cb.isMounted()) return;
          const { t, d } = readTime(e.target);
          cb.onTick(t, d);
        }, 250);
      },
      onStateChange: (e: { data: number }) => {
        if (!cb.isMounted()) return;
        if (debounce) window.clearTimeout(debounce);
        debounce = window.setTimeout(() => {
          if (!cb.isMounted()) return;
          const PS = window.YT?.PlayerState;
          if (!PS) return;
          if (e.data === PS.PLAYING) cb.onPlaying(true);
          if (e.data === PS.PAUSED || e.data === PS.CUED) cb.onPlaying(false);
          if (e.data === PS.ENDED) {
            cb.onPlaying(false);
            cb.onEnded();
          }
        }, YOUTUBE_STATE_DEBOUNCE_MS);
      },
      onError: (err: { data: number }) => {
        reportYoutubeFailureSafe(videoId, err.data);
      },
    },
  }) as unknown as YoutubePlayerApi;

  const cleanup = (): void => {
    if (debounce) window.clearTimeout(debounce);
    if (tick) window.clearInterval(tick);
    try {
      player.destroy?.();
    } catch {
      /* destroyed */
    }
  };

  return { player, cleanup };
};

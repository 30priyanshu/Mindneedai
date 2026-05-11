import type React from 'react';
import { localVideoUrl } from '@/shared/utils/mediaUrl';
import { reportLocalFailedSafe } from './reportVideoPlayback';

const ERROR_HANDLER_KEY = '__mnai_errorHandler' as const;

interface BindArgs {
  video: HTMLVideoElement;
  videoFile: string;
  onMeta: () => void;
  onTime: () => void;
  onEnded: () => void;
  onPlay: () => void;
  onPause: () => void;
  onCanPlay: () => void;
  onError: () => void;
}

export const bindLocalVideoElement = (args: BindArgs): void => {
  const v = args.video;
  v.preload = 'auto';
  v.playsInline = true;
  v.muted = false;
  v.autoplay = false;

  const wrappedError = () => {
    args.onError();
    reportLocalFailedSafe(args.videoFile);
  };
  (v as unknown as Record<string, unknown>)[ERROR_HANDLER_KEY] = wrappedError;

  v.addEventListener('loadedmetadata', args.onMeta);
  v.addEventListener('timeupdate', args.onTime);
  v.addEventListener('ended', args.onEnded);
  v.addEventListener('play', args.onPlay);
  v.addEventListener('pause', args.onPause);
  v.addEventListener('canplay', args.onCanPlay);
  v.addEventListener('error', wrappedError);

  v.src = localVideoUrl(args.videoFile);
  v.load();
};

export const unbindLocalVideo = (
  videoRef: React.MutableRefObject<HTMLVideoElement | null>,
  handlers: {
    onMeta: () => void;
    onTime: () => void;
    onEnded: () => void;
    onPlay: () => void;
    onPause: () => void;
    onCanPlay: () => void;
    onError: () => void;
  },
): void => {
  const v = videoRef.current;
  if (!v) return;
  v.pause();
  v.removeEventListener('loadedmetadata', handlers.onMeta);
  v.removeEventListener('timeupdate', handlers.onTime);
  v.removeEventListener('ended', handlers.onEnded);
  v.removeEventListener('play', handlers.onPlay);
  v.removeEventListener('pause', handlers.onPause);
  v.removeEventListener('canplay', handlers.onCanPlay);
  const storedHandler = (v as unknown as Record<string, unknown>)[ERROR_HANDLER_KEY] as (() => void) | undefined;
  if (storedHandler) {
    v.removeEventListener('error', storedHandler);
    delete (v as unknown as Record<string, unknown>)[ERROR_HANDLER_KEY];
  } else {
    v.removeEventListener('error', handlers.onError);
  }
  v.removeAttribute('src');
  v.load();
};

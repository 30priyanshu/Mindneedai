import { useCallback, useEffect, useRef, useState } from 'react';
import { videoPlatformsApi } from '@/features/text_analysis/videoPlatformsApi';
import type { VideoRecommendation, YouTubeRecommendation } from '@/features/text_analysis/types';
import { bindLocalVideoElement, unbindLocalVideo } from './bindLocalVideo';
import { fetchVideoRecommendationsPair } from './fetchVideoRecommendations';
import { VIDEO_PLAYER_MODE_KEY } from './constants';
import type { PlayerMode, VideoPlayerProps, YoutubePlayerApi } from './videoPlayerTypes';
import { reportLocalPlayedSafe } from './reportVideoPlayback';
import { useActiveVideoAttachment } from './useActiveVideoAttachment';

interface LocalHandlers {
  onMeta: () => void;
  onTime: () => void;
  onEnded: () => void;
  onPlay: () => void;
  onPause: () => void;
  onCanPlay: () => void;
  onError: () => void;
}

/** Single responsibility: player state, media wiring, and playback actions for VideoPlayer UI. */
export function useVideoPlayer({
  emotion,
  userId,
  sessionId,
  initialRecommendation,
}: VideoPlayerProps) {
  const [recommendation, setRecommendation] = useState<VideoRecommendation | null>(null);
  const [youtubeRecommendation, setYoutubeRecommendation] = useState<YouTubeRecommendation | null>(null);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(() => {
    const saved = localStorage.getItem(VIDEO_PLAYER_MODE_KEY);
    return saved === 'local' ? 'local' : 'youtube';
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [youtubePlayerReady, setYoutubePlayerReady] = useState(false);
  const [localVideoError, setLocalVideoError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtubePlayerRef = useRef<YoutubePlayerApi | null>(null);
  const youtubeCleanupRef = useRef<(() => void) | null>(null);
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const isPlayingRef = useRef(false);
  const youtubeIsPlayingRef = useRef(false);
  const isMountedRef = useRef(true);
  const localHandlersRef = useRef<LocalHandlers | null>(null);

  const cleanupYouTube = useCallback(() => {
    youtubeCleanupRef.current?.();
    youtubeCleanupRef.current = null;
    youtubePlayerRef.current = null;
    youtubeIsPlayingRef.current = false;
    setYoutubePlayerReady(false);
    setIsPlaying(false);
  }, []);

  const resetLocalState = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsVideoReady(false);
    setLocalVideoError(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const cleanupLocalBindings = useCallback(() => {
    if (!localHandlersRef.current) return;
    unbindLocalVideo(videoRef, localHandlersRef.current);
    localHandlersRef.current = null;
    resetLocalState();
  }, [resetLocalState]);

  const handleLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (el) setDuration(el.duration);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (el) setCurrentTime(el.currentTime);
  }, []);

  const handleEnded = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handlePlay = useCallback(() => {
    isPlayingRef.current = true;
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const handleCanPlay = useCallback(
    (file: string) => {
      setIsVideoReady(true);
      setLocalVideoError(null);
      reportLocalPlayedSafe(file, userId, emotion);
    },
    [userId, emotion],
  );

  const handleVideoError = useCallback(() => {
    setIsVideoReady(false);
    setLocalVideoError('Local video is unavailable. Try YouTube while we refresh the library.');
    if (youtubeRecommendation?.success) setPlayerMode('youtube');
  }, [youtubeRecommendation]);

  const initializeVideo = useCallback(
    (videoFile: string) => {
      const el = videoRef.current;
      if (!el || !videoFile) return;
      cleanupLocalBindings();
      setLocalVideoError(null);
      const handlers: LocalHandlers = {
        onMeta: handleLoadedMetadata,
        onTime: handleTimeUpdate,
        onEnded: handleEnded,
        onPlay: handlePlay,
        onPause: handlePause,
        onCanPlay: () => handleCanPlay(videoFile),
        onError: handleVideoError,
      };
      localHandlersRef.current = handlers;
      bindLocalVideoElement({ video: el, videoFile, ...handlers });
    },
    [
      cleanupLocalBindings,
      handleLoadedMetadata,
      handleTimeUpdate,
      handleEnded,
      handlePlay,
      handlePause,
      handleCanPlay,
      handleVideoError,
    ],
  );

  const fetchBothRecommendations = useCallback(async () => {
    const { local, youtube } = await fetchVideoRecommendationsPair(userId, emotion, sessionId);
    if (!isMountedRef.current) return;
    setRecommendation(local);
    setYoutubeRecommendation(youtube);
    setIsFetchingRecommendations(false);
  }, [userId, emotion, sessionId]);

  useEffect(() => {
    if (
      initialRecommendation?.success &&
      initialRecommendation.video_file
    ) {
      setRecommendation(initialRecommendation);
      setIsFetchingRecommendations(true);
      void videoPlatformsApi
        .getYoutubeRecommendation(userId, emotion, sessionId, [])
        .then((data) => {
          if (!isMountedRef.current) return;
          setYoutubeRecommendation(data);
          setIsFetchingRecommendations(false);
        })
        .catch(() => {
          if (!isMountedRef.current) return;
          setYoutubeRecommendation(null);
          setIsFetchingRecommendations(false);
        });
      return;
    }
    void fetchBothRecommendations();
  }, [emotion, userId, sessionId, initialRecommendation, fetchBothRecommendations]);

  useActiveVideoAttachment({
    isFetchingRecommendations,
    playerMode,
    recommendation,
    youtubeRecommendation,
    initializeVideo,
    cleanupLocalBindings,
    cleanupYouTube,
    userId,
    emotion,
    youtubeContainerRef,
    youtubePlayerRef,
    youtubeCleanupRef,
    isMountedRef,
    youtubeIsPlayingRef,
    setYoutubePlayerReady,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupLocalBindings();
      cleanupYouTube();
    };
  }, [cleanupLocalBindings, cleanupYouTube]);

  useEffect(() => {
    localStorage.setItem(VIDEO_PLAYER_MODE_KEY, playerMode);
  }, [playerMode]);

  useEffect(() => {
    if (
      !isFetchingRecommendations &&
      playerMode === 'local' &&
      !recommendation?.success &&
      youtubeRecommendation?.success
    ) {
      setPlayerMode('youtube');
    }
  }, [isFetchingRecommendations, playerMode, recommendation, youtubeRecommendation]);

  const togglePlayPause = useCallback(async () => {
    if (playerMode === 'local') {
      const el = videoRef.current;
      if (!el || !isVideoReady) return;
      if (isPlayingRef.current) el.pause();
      else {
        try {
          await el.play();
        } catch {
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      }
      return;
    }
    const yt = youtubePlayerRef.current;
    if (!yt || !youtubePlayerReady) return;
    try {
      if (youtubeIsPlayingRef.current) yt.pauseVideo?.();
      else yt.playVideo?.();
    } catch {
      /* playback error */
    }
  }, [playerMode, isVideoReady, youtubePlayerReady]);

  const handleSeek = useCallback(
    (value: number) => {
      if (!Number.isFinite(value) || value < 0 || value > duration) return;
      if (playerMode === 'local') {
        const el = videoRef.current;
        if (!el || !isVideoReady) return;
        el.currentTime = value;
        setCurrentTime(value);
        return;
      }
      const yt = youtubePlayerRef.current;
      if (!yt || !youtubePlayerReady) return;
      try {
        yt.seekTo?.(value, true);
        setCurrentTime(value);
      } catch {
        /* seek failed */
      }
    },
    [duration, isVideoReady, playerMode, youtubePlayerReady],
  );

  const setMode = useCallback((mode: PlayerMode) => {
    setPlayerMode((prev) => {
      if (prev === mode) return prev;
      setIsPlaying(false);
      return mode;
    });
  }, []);

  return {
    recommendation,
    youtubeRecommendation,
    playerMode,
    setMode,
    isPlaying,
    currentTime,
    duration,
    isFetchingRecommendations,
    isVideoReady,
    youtubePlayerReady,
    localVideoError,
    videoRef,
    youtubeContainerRef,
    togglePlayPause,
    handleSeek,
  };
}

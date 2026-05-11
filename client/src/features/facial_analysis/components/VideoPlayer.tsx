import React from 'react';
import { Video as VideoIcon, Youtube as YoutubeIcon, Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import type { VideoPlayerProps } from './video_player/videoPlayerTypes';
import { formatVideoTime } from './video_player/formatVideoTime';
import { videoContentDescription } from './video_player/videoEmotionCopy';
import { useVideoPlayer } from './video_player/useVideoPlayer';

/** Single responsibility: compose recommended video UI (local file + YouTube) after analysis. */
export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const {
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
  } = useVideoPlayer(props);

  if (isFetchingRecommendations) {
    return (
      <Card className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-md p-5">
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm font-medium text-neutral-900 dark:text-white">Finding perfect content for you...</span>
        </div>
      </Card>
    );
  }

  const activeRec = playerMode === 'local' ? recommendation : youtubeRecommendation;
  if (!activeRec?.success) {
    return (
      <Card className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border shadow-md p-5">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
            {activeRec?.message ?? 'No videos available'}
          </p>
        </div>
      </Card>
    );
  }

  const emotionLabel = activeRec.emotion;
  const ready = playerMode === 'local' ? isVideoReady : youtubePlayerReady;
  const localFailed = playerMode === 'local' && Boolean(localVideoError);
  const neutralBg = 'bg-white dark:bg-dark-surface';
  const neutralBorder = 'border-neutral-200 dark:border-dark-border';

  return (
    <Card className={`${neutralBg} ${neutralBorder} shadow-lg border-2 p-4 md:p-5 relative overflow-hidden`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <VideoIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base text-neutral-900 dark:text-white mb-0.5 truncate">
                {playerMode === 'youtube' && youtubeRecommendation?.title
                  ? youtubeRecommendation.title
                  : 'Recommended Content'}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{videoContentDescription(emotionLabel)}</p>
            </div>
          </div>

          <div className="inline-flex bg-white dark:bg-dark-surface rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setMode('local')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
                playerMode === 'local'
                  ? 'bg-primary dark:bg-secondary text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Local</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('youtube')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-all ${
                playerMode === 'youtube'
                  ? 'bg-primary dark:bg-secondary text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <YoutubeIcon className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </button>
          </div>
        </div>

        <div
          className="mb-3 rounded-lg overflow-hidden bg-neutral-900 dark:bg-neutral-800 relative shadow-md"
          style={{ aspectRatio: '16/9' }}
        >
          {!ready && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 z-10 gap-2">
              {localFailed ? (
                <AlertCircle className="w-8 h-8 text-red-400" />
              ) : (
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
              )}
              <span className="text-xs text-neutral-400">
                {localVideoError ?? 'Preparing video…'}
              </span>
            </div>
          )}
          {playerMode === 'local' ? (
            <video
              ref={videoRef}
              className={`w-full h-full object-contain ${!isVideoReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
              playsInline
              preload="auto"
            />
          ) : (
            <div
              ref={youtubeContainerRef}
              className={`w-full h-full ${!youtubePlayerReady ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void togglePlayPause()}
            disabled={!ready}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
              ready
                ? 'bg-primary dark:bg-secondary text-white hover:shadow-lg'
                : 'bg-neutral-300 dark:bg-neutral-600 cursor-not-allowed opacity-70'
            }`}
          >
            {!ready ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-current" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5 fill-current" />
            )}
          </button>
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              disabled={!ready}
              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex justify-between mt-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <span>{formatVideoTime(currentTime)}</span>
              <span>{formatVideoTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

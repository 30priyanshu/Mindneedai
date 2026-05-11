// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';

const state = vi.hoisted(() => ({ current: null as unknown }));

vi.mock('./video_player/useVideoPlayer', () => ({
  useVideoPlayer: () => state.current,
}));

const baseState = {
  recommendation: {
    success: true,
    video_file: 'Happy/missing.mp4',
    emotion: 'Happy',
    total_videos: 1,
    played_count: 0,
    message: null,
  },
  youtubeRecommendation: null,
  playerMode: 'local',
  setMode: vi.fn(),
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isFetchingRecommendations: false,
  isVideoReady: false,
  youtubePlayerReady: false,
  localVideoError: 'Local video is unavailable. Try YouTube while we refresh the library.',
  videoRef: { current: null },
  youtubeContainerRef: { current: null },
  togglePlayPause: vi.fn(),
  handleSeek: vi.fn(),
};

describe('VideoPlayer', () => {
  it('surfaces local video load failures instead of spinning forever', () => {
    state.current = baseState;

    render(<VideoPlayer emotion="happy" userId="user_1" />);

    expect(screen.getByText(/Local video is unavailable/i)).toBeInTheDocument();
  });
});

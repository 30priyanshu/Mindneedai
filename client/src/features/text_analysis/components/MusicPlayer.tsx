import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Music, Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import api from '@/core/api';
import { localMusicUrl } from '@/shared/utils/mediaUrl';
import type { MusicRecommendation } from '../types';

interface MusicPlayerProps {
  emotion: string;
  sessionId?: string;
}

const MAX_RETRIES = 3;

const EMOTION_DESCRIPTIONS: Record<string, string> = {
  happy: 'Uplifting melodies',
  sad: 'Comforting sounds',
  angry: 'Calming rhythms',
  anxious: 'Relaxing music',
  fearful: 'Soothing harmonies',
  neutral: 'Peaceful tunes',
};

const formatTime = (secs: number): string => {
  if (!isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const warnPlaybackReport = (action: string, err: unknown): void => {
  console.warn(`[MusicPlayer] ${action} failed`, err);
};

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ emotion, sessionId }) => {
  const [rec, setRec] = useState<MusicRecommendation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedReportedRef = useRef(false);
  const retryRef = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const destroyAudio = useCallback(() => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
    setReady(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const initAudio = useCallback(
    (file: string) => {
      destroyAudio();
      playedReportedRef.current = false;
      const audio = new Audio(localMusicUrl(file));
      audio.preload = 'auto';
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.oncanplay = () => {
        setReady(true);
        setLoading(false);
        setError(null);
        if (!playedReportedRef.current) {
          playedReportedRef.current = true;
          void api.post('/music/report-played', { music_file: file, emotion }).catch((e) => warnPlaybackReport('reportPlayed', e));
        }
      };
      audio.onerror = () => {
        if (retryRef.current < MAX_RETRIES) {
          retryRef.current += 1;
          retryTimer.current = setTimeout(() => initAudio(file), 1000 * retryRef.current);
        } else {
          void api.post('/music/report-failed', { music_file: file }).catch((e) => warnPlaybackReport('reportFailed', e));
          setError('Failed to load audio after retries');
          setLoading(false);
        }
      };
      audioRef.current = audio;
      audio.load();
    },
    [destroyAudio, emotion]
  );

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      retryRef.current = 0;
      destroyAudio();
      try {
        const { data } = await api.post<MusicRecommendation>('/music/recommend', {
          emotion,
          session_id: sessionId,
        });
        setRec(data);
        if (data.success && data.music_file) {
          initAudio(data.music_file);
        } else {
          setError(data.message ?? 'No music available for this emotion');
          setLoading(false);
        }
      } catch {
        setError('Failed to fetch music recommendation');
        setLoading(false);
      }
    };
    void fetch();
    return destroyAudio;
  }, [emotion, sessionId, destroyAudio, initAudio]);

  const togglePlay = async () => {
    if (!audioRef.current || !ready) return;
    try {
      isPlaying ? audioRef.current.pause() : await audioRef.current.play();
    } catch {
      setError('Playback failed. Click to try again.');
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current && isFinite(t)) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-neutral-800/60 p-6 flex flex-col items-center justify-center gap-4 py-10 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-50 blur-2xl group-hover:opacity-70 transition-opacity duration-700"></div>
        <div className="relative w-16 h-16 rounded-full bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center shadow-inner">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
        </div>
        <div className="relative text-center">
          <h4 className="text-base font-medium text-white mb-1 tracking-wide">Curating Your Soundtrack</h4>
          <span className="text-sm text-neutral-400">Finding the perfect music for your mood…</span>
        </div>
      </div>
    );
  }

  if (error || !rec?.success) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl border border-red-900/30 p-6 flex items-start gap-4 shadow-xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50 rounded-l-2xl"></div>
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 pt-1">
          <h4 className="text-sm font-semibold text-neutral-200 mb-1">Playback Unavailable</h4>
          <p className="text-sm text-neutral-400 leading-relaxed">{error ?? rec?.message ?? 'No music available for this mood.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl border border-neutral-700/50 p-6 shadow-2xl group transition-all duration-500 hover:shadow-green-900/20">
      <div className={`absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/10 blur-3xl transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-40'}`}></div>
      
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg transform transition-transform duration-500 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
              <Music className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
          </div>
          <div>
            <h4 className="font-bold text-white text-base tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-300">Recommended Music</h4>
            <p className="text-sm text-green-400 font-medium tracking-wide">
              {EMOTION_DESCRIPTIONS[emotion.toLowerCase()] ?? 'Soothing melodies'}
            </p>
          </div>
        </div>
        
        <div className="hidden sm:flex gap-1 h-6 items-end justify-center px-4">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 bg-green-500/80 rounded-t-sm transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
              style={{ 
                height: isPlaying ? `${Math.random() * 100 + 20}%` : '20%',
                animationDelay: `${i * 0.15}s`,
                animationDuration: '0.8s'
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <button
          onClick={togglePlay}
          disabled={!ready}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
            ready
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white hover:scale-110 active:scale-95 shadow-green-500/30'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
          }`}
        >
          {!ready ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6" fill="currentColor" />
          ) : (
            <Play className="w-6 h-6 ml-1" fill="currentColor" />
          )}
        </button>

        <div className="flex-1 w-full flex flex-col justify-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!ready}
            aria-label="Seek"
            className="w-full h-2 rounded-full bg-neutral-700/60 appearance-none accent-green-500 cursor-pointer disabled:cursor-not-allowed hover:accent-green-400 transition-colors"
            style={{
              background: `linear-gradient(to right, #22c55e ${(currentTime / (duration || 1)) * 100}%, rgba(64, 64, 64, 0.6) ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
          <div className="flex justify-between mt-2 px-1">
            <span className="text-xs font-medium text-neutral-400 tabular-nums tracking-wider">{formatTime(currentTime)}</span>
            <span className="text-xs font-medium text-neutral-500 tabular-nums tracking-wider">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

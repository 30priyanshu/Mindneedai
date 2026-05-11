import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, Square, Play, Pause, Sparkles, AlertCircle,
  Volume2, Brain, Lightbulb, TrendingUp, RotateCcw, Zap,
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { isApiError } from '@/core/exceptions';
import { speechAnalysisApi } from '@/features/speech_analysis/service';
import { MusicPlayer } from '@/features/text_analysis/components/MusicPlayer';
import { VideoPlayer } from '@/features/facial_analysis/components/VideoPlayer';
import { AudioEmotionHero } from '@/features/speech_analysis/components/AudioEmotionHero';
import { AudioEmotionChart } from '@/features/speech_analysis/components/AudioEmotionChart';
import { AudioRecordingInstructions } from '@/features/speech_analysis/components/AudioRecordingInstructions';
import type { AudioFileAnalysisResponse } from '@/features/speech_analysis/types';

const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
];

const getSupportedMimeType = (): string =>
  SUPPORTED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm';

const LOADING_STAGES = [
  'Processing your input',
  'Detecting emotional patterns',
  'Generating AI insights',
  'Finalizing your analysis',
];

const STAGE_DELAYS = [0, 3500, 8000, 12500];

type RecordState = 'idle' | 'recording' | 'analyzing';

export default function AudioAnalysisPage(): React.ReactElement {
  const { addToast } = useToast();
  const { userId } = useAuth();

  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<AudioFileAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [loadingStage, setLoadingStage] = useState(LOADING_STAGES[0]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) void audioContextRef.current.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const startLevelMonitor = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(avg / 128, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* audio monitoring optional */
    }
  };

  const stopLevelMonitor = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) void audioContextRef.current.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const startRecording = useCallback(async () => {
    setShowInstructions(false);
    setError(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.');
      return;
    }

    streamRef.current = stream;
    startLevelMonitor(stream);

    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioBlobRef.current = blob;
      if (audioRef.current) audioRef.current.src = URL.createObjectURL(blob);
      setHasRecording(true);
    };
    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setRecordState('recording');

    timerRef.current = window.setInterval(() => {
      setRecordingTime((t) => {
        const next = +(t + 0.1).toFixed(1);
        if (next >= 60) stopRecording();
        return next;
      });
    }, 100);
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    stopLevelMonitor();
    setRecordState('idle');
  }, []);

  const togglePlayback = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      void el.play();
      setIsPlaying(true);
      el.onended = () => setIsPlaying(false);
    }
  };

  const analyzeAudio = useCallback(async () => {
    if (!audioBlobRef.current || !userId) {
      setError(!userId ? 'Authentication required.' : 'No recording available.');
      return;
    }

    setResult(null);
    setError(null);
    setRecordState('analyzing');
    setLoadingStage(LOADING_STAGES[0]);

    const timers = STAGE_DELAYS.slice(1).map((delay, i) =>
      setTimeout(() => setLoadingStage(LOADING_STAGES[i + 1]), delay)
    );

    try {
      const data = await speechAnalysisApi.analyzeFile(
        userId,
        audioBlobRef.current,
        'recording.webm',
      );
      if (!isMountedRef.current) return;
      setResult(data);
      addToast({ type: 'success', message: 'Audio analysis complete!' });
    } catch (err: unknown) {
      const msg = isApiError(err) ? err.message : err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setError(msg);
    } finally {
      timers.forEach(clearTimeout);
      if (isMountedRef.current) setRecordState('idle');
    }
  }, [userId, addToast]);

  const handleReset = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    audioBlobRef.current = null;
    audioChunksRef.current = [];
    setHasRecording(false);
    setIsPlaying(false);
    setResult(null);
    setError(null);
    setRecordingTime(0);
  };

  const isAnalyzing = recordState === 'analyzing';

  return (
    <>
      {isAnalyzing && <LoadingSpinner message="AI Audio Analysis in Progress" stage={loadingStage} />}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">
            Voice Emotion Analysis
          </h1>
          <p className="text-sm text-neutral-400">
            Record your voice for AI-powered emotional insights
          </p>
        </div>

        {showInstructions && (
          <AudioRecordingInstructions
            onAccept={() => void startRecording()}
            onCancel={() => setShowInstructions(false)}
          />
        )}

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 md:p-8 space-y-6">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            {recordState === 'recording' ? (
              <div className="flex flex-col items-center w-full gap-3">
                <div
                  className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center animate-pulse border-2 border-white/20"
                  style={{ transform: `scale(${1 + audioLevel * 0.12})`, transition: 'transform 0.1s ease-out' }}
                >
                  <Mic className="w-10 h-10 text-white" />
                </div>
                <div className="text-2xl font-bold text-white">{recordingTime.toFixed(1)}s</div>
                <div className="w-full max-w-xs h-2 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-100"
                    style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400">Audio level: {Math.round(audioLevel * 100)}%</p>
              </div>
            ) : hasRecording ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center border-2 border-white/20">
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-lg font-bold text-white">Recording Ready</div>
                <div className="text-sm text-neutral-400">{recordingTime.toFixed(1)} seconds</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center border-2 border-white/20">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div className="text-lg font-bold text-white">Ready to Record</div>
                <div className="text-sm text-neutral-400">Click Start Recording to begin</div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            {recordState === 'idle' && !hasRecording && (
              <Button
                variant="primary"
                icon={<Mic className="w-4 h-4" />}
                onClick={() => setShowInstructions(true)}
              >
                Start Recording
              </Button>
            )}

            {recordState === 'recording' && (
              <Button
                variant="secondary"
                icon={<Square className="w-4 h-4" />}
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            )}

            {hasRecording && !isAnalyzing && (
              <>
                <Button
                  variant="secondary"
                  icon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  onClick={togglePlayback}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  variant="primary"
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={() => void analyzeAudio()}
                >
                  Analyze Audio
                </Button>
                <Button
                  variant="secondary"
                  icon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </>
            )}
          </div>

          <audio ref={audioRef} className="hidden" />
        </div>

        {result && (
          <div className="space-y-6">
            <AudioEmotionHero
              dominantEmotion={result.dominant_emotion}
              confidence={result.confidence}
              duration={result.duration_seconds}
              overallSentiment={result.agentic_analysis?.overall_sentiment}
              emotionalStability={result.agentic_analysis?.emotional_stability}
              audioQualityScore={result.audio_quality_score}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userId && (
                <>
                  <MusicPlayer emotion={result.dominant_emotion} sessionId={result.session_id} />
                  <VideoPlayer
                    emotion={result.dominant_emotion}
                    userId={userId}
                    sessionId={result.session_id}
                  />
                </>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                <AudioEmotionChart emotionDistribution={result.emotion_distribution} />
              </div>

              {result.agentic_analysis?.detailed_summary && (
                <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10">
                      <Brain className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">Voice Insights</h4>
                      <p className="text-xs text-neutral-400">Understanding your emotional tone</p>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {result.agentic_analysis.detailed_summary}
                  </p>
                </div>
              )}
            </div>

            {result.agentic_analysis && (
              <div className="grid gap-4 lg:grid-cols-2">
                {(result.agentic_analysis.quick_actions?.length ?? 0) > 0 && (
                  <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10">
                        <Zap className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">Try Right Now</h4>
                        <p className="text-xs text-neutral-400">Quick intervention suggestions</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {result.agentic_analysis.quick_actions!.map((action, i) => (
                        <li key={i} className="flex items-start gap-3 bg-neutral-800 rounded-lg p-3">
                          <Zap className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-neutral-300">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(result.agentic_analysis.recommendations?.length ?? 0) > 0 && (
                  <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
                        <Lightbulb className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">Wellness Suggestions</h4>
                        <p className="text-xs text-neutral-400">Things you can try</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {result.agentic_analysis.recommendations!.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3 bg-neutral-800 rounded-lg p-3">
                          <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-neutral-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(result.agentic_analysis.concerning_patterns?.length ?? 0) > 0 && (
                  <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">Things to Consider</h4>
                        <p className="text-xs text-neutral-400">Gentle reminders for your wellbeing</p>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {result.agentic_analysis.concerning_patterns!.map((p, i) => (
                        <li key={i} className="flex items-start gap-3 bg-neutral-800 rounded-lg p-3">
                          <span className="text-amber-400 font-bold text-sm mt-0.5">•</span>
                          <span className="text-sm text-neutral-300">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.requires_human_review && (
              <div className="flex items-center gap-3 bg-neutral-900 border border-amber-800/50 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-white">Human Review Required</h4>
                  <p className="text-xs text-amber-300">
                    Flagged for expert review due to concerning patterns.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

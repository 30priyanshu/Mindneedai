import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Video, StopCircle, Play, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { facialAnalysisApi } from '@/features/facial_analysis/service';
import { MusicPlayer } from '@/features/text_analysis/components/MusicPlayer';
import { VideoPlayer } from '@/features/facial_analysis/components/VideoPlayer';
import { VideoEmotionHero } from '@/features/facial_analysis/components/VideoEmotionHero';
import { VideoEmotionChart } from '@/features/facial_analysis/components/VideoEmotionChart';
import { VideoAnalysisInsights } from '@/features/facial_analysis/components/VideoAnalysisInsights';
import { CameraInstructions } from '@/features/facial_analysis/components/CameraInstructions';
import type { SessionSummaryResponse } from '@/features/facial_analysis/types';

type PageState = 'idle' | 'analyzing' | 'processing';

const FRAME_INTERVAL_MS = 66;
const JPEG_QUALITY = 0.9;

function captureFrameBase64(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): string | null {
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export default function VideoAnalysisPage(): React.ReactElement {
  const { addToast } = useToast();
  const { userId } = useAuth();

  const [pageState, setPageState] = useState<PageState>('idle');
  const [result, setResult] = useState<SessionSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('Processing your input');
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [fps, setFps] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const frameCounterRef = useRef(0);
  const isProcessingFrameRef = useRef(false);
  const isMountedRef = useRef(true);
  const startTimeRef = useRef(0);
  const fpsCounterRef = useRef<number[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopStream();
    };
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const openCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user', frameRate: { ideal: 30, max: 30 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      return true;
    } catch {
      setError('Camera access denied. Please allow camera access and try again.');
      return false;
    }
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!userId) {
      setError('Authentication required.');
      return;
    }
    setShowInstructions(false);
    setError(null);
    setResult(null);
    setCurrentEmotion(null);
    setCurrentConfidence(0);
    frameCounterRef.current = 0;
    setFrameCount(0);
    setElapsedSecs(0);
    setFps(0);
    fpsCounterRef.current = [];

    const cameraOk = cameraReady || (await openCamera());
    if (!cameraOk || !isMountedRef.current) return;

    await new Promise((r) => setTimeout(r, 500));

    let sessionId: string;
    try {
      const session = await facialAnalysisApi.startSession(userId);
      sessionId = session.session_id;
      sessionIdRef.current = sessionId;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start session';
      setError(msg);
      return;
    }

    setPageState('analyzing');
    startTimeRef.current = Date.now();

    timerRef.current = window.setInterval(
      () => setElapsedSecs((s) => s + 1),
      1000,
    );

    intervalRef.current = window.setInterval(async () => {
      if (isProcessingFrameRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      isProcessingFrameRef.current = true;
      frameCounterRef.current += 1;
      const frame = frameCounterRef.current;
      const timestamp = (Date.now() - startTimeRef.current) / 1000;
      const t1 = Date.now();

      try {
        const frameData = captureFrameBase64(video, canvas);
        if (!frameData) return;

        const frameResult = await facialAnalysisApi.analyzeFrame(sessionId, frameData, frame, timestamp);
        if (!isMountedRef.current) return;

        if (frameResult.face_detected || frameResult.confidence > 0) {
          setCurrentEmotion(frameResult.emotion);
          setCurrentConfidence(frameResult.confidence);
        }
        setFrameCount(frame);

        const t2 = Date.now();
        const elapsed = t2 - t1;
        if (elapsed > 0) {
          const currentFps = 1000 / elapsed;
          fpsCounterRef.current.push(currentFps);
          if (fpsCounterRef.current.length > 30) fpsCounterRef.current.shift();
          const avgFps = fpsCounterRef.current.reduce((a, b) => a + b, 0) / fpsCounterRef.current.length;
          setFps(avgFps);
        }
      } catch {
        // frame analysis errors are non-critical; continue
      } finally {
        isProcessingFrameRef.current = false;
      }
    }, FRAME_INTERVAL_MS);
  }, [userId, cameraReady, openCamera]);

  const stopAnalysis = useCallback(async () => {
    clearTimers();
    setProcessingStage('Detecting emotional patterns');
    setPageState('processing');
    stopStream();
    isProcessingFrameRef.current = false;

    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (!sessionId) {
      setPageState('idle');
      return;
    }

    const stageTimeline: Array<{ delay: number; label: string }> = [
      { delay: 600, label: 'Generating AI insights' },
      { delay: 1800, label: 'Finalizing your analysis' },
    ];
    const timeouts = stageTimeline.map(({ delay, label }) =>
      window.setTimeout(() => {
        if (isMountedRef.current) setProcessingStage(label);
      }, delay),
    );

    try {
      const summary = await facialAnalysisApi.endSession(sessionId);
      if (!isMountedRef.current) return;
      setResult(summary);
      addToast({ type: 'success', message: 'Analysis complete!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end session';
      setError(msg);
    } finally {
      timeouts.forEach((id) => window.clearTimeout(id));
      if (isMountedRef.current) {
        setPageState('idle');
        setProcessingStage('Processing your input');
      }
    }
  }, [clearTimers, stopStream, addToast]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">
          Video Emotion Analysis
        </h1>
        <p className="text-sm text-neutral-400">
          Real-time facial emotion detection with AI-powered insights
        </p>
      </div>

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraReady ? 'opacity-100' : 'opacity-0'} transition-opacity`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!cameraReady && pageState === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">Camera preview</p>
                </div>
              </div>
            )}

            {currentEmotion && pageState === 'analyzing' && (
              <div className="absolute top-4 left-4 bg-neutral-900/85 backdrop-blur-md text-white px-4 py-3 rounded-2xl border border-white/10 shadow-2xl">
                <div className="font-bold text-xl mb-1 capitalize">{currentEmotion}</div>
                <div className="text-sm text-neutral-200">
                  {(currentConfidence * 100).toFixed(1)}% confidence
                </div>
              </div>
            )}

            {pageState === 'analyzing' && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-bold">{formatTime(elapsedSecs)}</span>
              </div>
            )}

            {pageState === 'analyzing' && (
              <div className="absolute bottom-4 right-4 bg-neutral-900/85 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/10 backdrop-blur-sm">
                <Loader2 className="w-3 h-3 inline-block mr-1.5 animate-spin" />
                {frameCount} frames
              </div>
            )}

            {pageState === 'processing' && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
              </div>
            )}
          </div>

          <div className="p-6 flex flex-col justify-between border-t border-neutral-800 lg:border-t-0 lg:border-l">
            {pageState === 'analyzing' && currentEmotion ? (
              <div className="space-y-4">
                <div className="bg-neutral-800 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">
                    Current Emotion
                  </h3>
                  <div className="text-3xl font-bold text-white mb-2 capitalize">
                    {currentEmotion}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${currentConfidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-neutral-300 w-14 text-right">
                      {(currentConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Frames', value: frameCount, color: 'text-white' },
                    { label: 'FPS', value: fps.toFixed(1), color: 'text-green-400' },
                    { label: 'Elapsed', value: formatTime(elapsedSecs), color: 'text-indigo-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-neutral-800 rounded-xl p-3 text-center">
                      <div className="text-xs text-neutral-400 mb-1">{label}</div>
                      <div className={`text-xl font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center py-8">
                <div>
                  <Video className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-400 text-sm font-medium">
                    {pageState === 'idle'
                      ? 'Start analysis to see live results'
                      : 'Processing…'}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {pageState === 'idle' && (
                <Button
                  variant="primary"
                  icon={<Play className="w-4 h-4" />}
                  onClick={() => setShowInstructions(true)}
                >
                  Start Analysis
                </Button>
              )}

              {pageState === 'analyzing' && (
                <Button
                  variant="secondary"
                  icon={<StopCircle className="w-4 h-4" />}
                  onClick={() => void stopAnalysis()}
                >
                  Stop &amp; Get Results
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {pageState === 'processing' && (
        <LoadingSpinner message="Finalising your video analysis" stage={processingStage} />
      )}

      {showInstructions && (
        <CameraInstructions
          onAccept={() => void startAnalysis()}
          onCancel={() => setShowInstructions(false)}
        />
      )}

      {result && (
        <div className="space-y-6">
          <VideoEmotionHero
            dominantEmotion={result.dominant_emotion}
            averageConfidence={result.average_confidence}
            totalFrames={result.total_frames}
            {...(result.agentic_analysis?.overall_sentiment
              ? { overallSentiment: result.agentic_analysis.overall_sentiment }
              : {})}
            {...(result.agentic_analysis?.emotional_stability !== undefined
              ? { emotionalStability: result.agentic_analysis.emotional_stability }
              : {})}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
              <VideoEmotionChart emotionDistribution={result.emotion_distribution} />
            </div>

            {result.agentic_analysis?.detailed_summary && (
              <VideoAnalysisInsights
                summary={result.agentic_analysis.detailed_summary}
                concerningPatterns={result.agentic_analysis.concerning_patterns || []}
                recommendations={result.agentic_analysis.recommendations || []}
                quickActions={result.agentic_analysis.quick_actions || []}
              />
            )}
          </div>

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
  );
}

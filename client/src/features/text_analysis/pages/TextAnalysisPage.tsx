import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { textAnalysisApi } from '../service';
import { TextInput } from '../components/TextInput';
import { EmotionHero } from '../components/EmotionHero';
import { AnalysisResults } from '../components/AnalysisResults';
import { MusicPlayer } from '../components/MusicPlayer';
import type { TextAnalysisResponse } from '../types';
import type { ApiError } from '@/core/exceptions';
import { VideoPlayer } from '@/features/facial_analysis/components/VideoPlayer';

const LOADING_STAGES = [
  'Processing your input',
  'Detecting emotional patterns',
  'Generating AI insights',
  'Finalizing your analysis',
];

const STAGE_DELAYS = [0, 3500, 8000, 12500];

export default function TextAnalysisPage(): React.ReactElement {
  const { addToast } = useToast();
  const { userId } = useAuth();
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<TextAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(LOADING_STAGES[0]);
  const [error, setError] = useState<string | null>(null);

  // Cancel on unmount
  useEffect(() => () => textAnalysisApi.cancel(), []);

  const handleAnalyze = async () => {
    const trimmed = text.trim();
    if (!trimmed) { setError('Please enter some text to analyze'); return; }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setStage(LOADING_STAGES[0]);

    const timers = STAGE_DELAYS.slice(1).map((delay, i) =>
      setTimeout(() => setStage(LOADING_STAGES[i + 1]), delay)
    );

    try {
      const result = await textAnalysisApi.analyze({ 
        text: trimmed,
        user_id: userId || 'anonymous'
      });
      setAnalysis(result);
      addToast({ type: 'success', message: 'Analysis completed successfully' });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.code !== -1) { // not cancelled
        setError(apiErr.message ?? 'Failed to analyze text. Please try again.');
      }
    } finally {
      timers.forEach(clearTimeout);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setAnalysis(null);
    setError(null);
  };

  return (
    <>
      {loading && <LoadingSpinner message="AI Analysis in Progress" stage={stage} />}

      <div className="space-y-6 w-full max-w-full">
        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">Text Analysis</h1>
          <p className="text-sm md:text-base text-neutral-400">
            Share your thoughts and feelings to receive personalized emotional insights
          </p>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <TextInput value={text} onChange={setText} disabled={loading} />

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Analysis Error</p>
                <p className="text-xs text-red-300 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <Button
              onClick={handleAnalyze}
              disabled={!text.trim() || loading}
              variant="primary"
              size="md"
              icon={<Sparkles className="w-4 h-4" />}
            >
              Analyze Text
            </Button>
            {analysis && (
              <Button
                onClick={handleReset}
                variant="secondary"
                disabled={loading}
                size="md"
                icon={<RotateCcw className="w-4 h-4" />}
              >
                New Analysis
              </Button>
            )}
          </div>
        </div>

        {analysis && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Analysis Complete</h3>
                <p className="text-xs text-neutral-400">Your personalized insights are ready below</p>
              </div>
            </div>

            <EmotionHero
              primaryEmotion={analysis.prediction}
              confidenceLevel={analysis.confidence_level}
              allPredictions={analysis.all_predictions}
            />

            <AnalysisResults analysis={analysis}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {analysis.prediction?.label && (
                  <MusicPlayer
                    emotion={analysis.prediction.label}
                    sessionId={analysis.request_id}
                  />
                )}

                {analysis.prediction?.label && userId && (
                  <VideoPlayer
                    emotion={analysis.prediction.label}
                    userId={userId}
                    sessionId={analysis.request_id}
                  />
                )}
              </div>
            </AnalysisResults>
          </div>
        )}
      </div>
    </>
  );
}

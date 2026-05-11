import React from 'react';
import { TrendingUp, Clock, Gauge, Activity } from 'lucide-react';

interface AudioEmotionHeroProps {
  dominantEmotion: string;
  confidence: number;
  duration: number;
  overallSentiment?: string | undefined;
  emotionalStability?: number | undefined;
  audioQualityScore?: number | undefined;
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'Very High';
  if (confidence >= 0.6) return 'High';
  if (confidence >= 0.4) return 'Moderate';
  return 'Low';
}

function qualityLabel(quality: number): string {
  if (quality >= 0.8) return 'Excellent';
  if (quality >= 0.6) return 'Good';
  if (quality >= 0.4) return 'Fair';
  return 'Poor';
}

function formatDurationSeconds(duration: number): string {
  if (duration < 60) return `${duration.toFixed(1)}s`;
  return `${(duration / 60).toFixed(1)}min`;
}

export function AudioEmotionHero({
  dominantEmotion,
  confidence,
  duration,
  overallSentiment,
  emotionalStability,
  audioQualityScore,
}: AudioEmotionHeroProps): React.ReactElement {
  const confLabel = confidenceLabel(confidence);

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
              PRIMARY EMOTION ANALYSIS
            </p>
            <h2 className="text-3xl font-bold text-primary capitalize mb-1">{dominantEmotion}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Detected with {confLabel.toLowerCase()} confidence
            </p>
          </div>
        </div>

        <div className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            Confidence Level
          </div>
          <div className="text-xl font-bold text-primary">{(confidence * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Recording Duration
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
            {formatDurationSeconds(duration)}
          </div>
        </div>

        {audioQualityScore !== undefined && (
          <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Audio Quality
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
              {qualityLabel(audioQualityScore)}
            </div>
          </div>
        )}

        {emotionalStability !== undefined ? (
          <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Emotional Consistency
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
              {(emotionalStability * 100).toFixed(0)}%
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                Reliability Score
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-dark-text">
              {(confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {overallSentiment !== undefined && overallSentiment.length > 0 && (
        <div className="mt-6 p-5 rounded-lg border-2 border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-card">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
            Clinical Assessment Summary
          </div>
          <p className="text-base text-neutral-800 dark:text-dark-text leading-relaxed">{overallSentiment}</p>
        </div>
      )}
    </div>
  );
}

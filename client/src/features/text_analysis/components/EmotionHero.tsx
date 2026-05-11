import React from 'react';
import { Smile, Meh, Frown, Activity, FileText, TrendingUp } from 'lucide-react';
import type { Prediction } from '../types';

interface EmotionHeroProps {
  primaryEmotion: Prediction;
  confidenceLevel: string;
  allPredictions?: Prediction[];
}

const EMOTION_ICON: Record<string, React.ElementType> = {
  happy: Smile,
  sad: Frown,
  anxious: Frown,
  angry: Frown,
  fearful: Frown,
  neutral: Meh,
};

const confidenceLabel = (c: number): string => {
  if (c >= 0.8) return 'Very High';
  if (c >= 0.6) return 'High';
  if (c >= 0.4) return 'Moderate';
  return 'Low';
};

export const EmotionHero: React.FC<EmotionHeroProps> = ({
  primaryEmotion,
  confidenceLevel,
  allPredictions = [],
}) => {
  const Icon = EMOTION_ICON[primaryEmotion.label.toLowerCase()] ?? Meh;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-green-500" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-1">
              Primary Sentiment
            </p>
            <h2 className="text-3xl font-bold text-green-500 capitalize">{primaryEmotion.label}</h2>
            <p className="text-sm text-neutral-400 mt-0.5">
              Detected with {confidenceLabel(primaryEmotion.confidence).toLowerCase()} confidence
            </p>
          </div>
        </div>
        <div className="px-4 py-3 rounded-lg border border-neutral-800 bg-black">
          <p className="text-xs text-neutral-400 mb-1">Confidence</p>
          <p className="text-xl font-bold text-green-500">
            {(primaryEmotion.confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: FileText, label: 'Sentiment Score', value: `${(primaryEmotion.confidence * 100).toFixed(0)}%` },
          { icon: Activity, label: 'Analysis Quality', value: confidenceLevel },
          { icon: TrendingUp, label: 'Predictions', value: allPredictions.length || 1 },
        ].map(({ icon: StatIcon, label, value }) => (
          <div key={label} className="p-4 rounded-lg border border-neutral-800 bg-black">
            <div className="flex items-center gap-2 mb-2">
              <StatIcon className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white capitalize">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

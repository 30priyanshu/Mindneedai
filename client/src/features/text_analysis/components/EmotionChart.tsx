import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { Prediction } from '../types';

interface EmotionChartProps {
  predictions: Prediction[];
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10B981',
  sad: '#6B7280',
  angry: '#EF4444',
  anxious: '#F59E0B',
  fearful: '#8B5CF6',
  disgusted: '#EC4899',
  surprised: '#3B82F6',
  neutral: '#9CA3AF',
};

export const EmotionChart: React.FC<EmotionChartProps> = ({ predictions }) => {
  const sorted = [...predictions]
    .sort((a, b) => b.confidence - a.confidence)
    .map((p) => ({
      ...p,
      displayName: p.label.charAt(0).toUpperCase() + p.label.slice(1),
      color: EMOTION_COLORS[p.label.toLowerCase()] ?? '#9CA3AF',
    }));

  if (sorted.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-6">No prediction data available</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-neutral-400" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-white">Sentiment Distribution</h4>
          <p className="text-xs text-neutral-400">Confidence levels across emotions</p>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((pred, idx) => (
          <div key={pred.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: pred.color }}
                />
                <span className="text-sm font-medium text-neutral-200">{pred.displayName}</span>
                {idx === 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                    Primary
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-white">
                {(pred.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pred.confidence * 100}%`, backgroundColor: pred.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

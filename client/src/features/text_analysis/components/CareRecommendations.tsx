import React from 'react';
import { CheckCircle } from 'lucide-react';

interface CareRecommendationsProps {
  recommendations: string[];
}

export const CareRecommendations: React.FC<CareRecommendationsProps> = ({ recommendations }) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={2} />
        </div>
        <div>
          <h4 className="font-semibold text-white">Care Recommendations</h4>
          <p className="text-xs text-neutral-400 mt-0.5">Evidence-based suggestions for your wellbeing</p>
        </div>
      </div>
      <ul className="space-y-2">
        {recommendations.map((rec, idx) => (
          <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-black border border-neutral-800">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
            <span className="text-sm text-neutral-300 leading-relaxed">{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

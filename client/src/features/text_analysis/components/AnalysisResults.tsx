import React from 'react';
import { Brain, Lightbulb } from 'lucide-react';
import { EmotionChart } from './EmotionChart';
import { PersonalizedResponse } from './PersonalizedResponse';
import { CareRecommendations } from './CareRecommendations';
import { ReviewStatus } from './ReviewStatus';
import type { TextAnalysisResponse } from '../types';

interface AnalysisResultsProps {
  analysis: TextAnalysisResponse;
  children?: React.ReactNode;
}

interface SectionProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  items: string[];
}

const ItemSection: React.FC<SectionProps> = ({ icon: Icon, title, subtitle, items }) => (
  <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-green-500" strokeWidth={2} />
      </div>
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-black border border-neutral-800">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
          <span className="text-sm text-neutral-300 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, children }) => {
  const cognitiveDistortions = analysis.agentic_analysis?.cognitive_distortions ?? [];
  const groundingTechniques = analysis.agentic_analysis?.grounding_techniques ?? [];

  const hasMoreInsights = 
    (analysis.care_recommendations?.length ?? 0) > 0 || 
    cognitiveDistortions.length > 0 || 
    groundingTechniques.length > 0;

  return (
    <div className="space-y-6" id="analysis-results-container">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
          <EmotionChart predictions={analysis.all_predictions} />
        </div>

        <PersonalizedResponse response={analysis.personalized_response} />
      </div>

      {children}

      {hasMoreInsights && (
        <div className="grid gap-6 lg:grid-cols-2">
          {analysis.care_recommendations?.length > 0 && (
            <CareRecommendations recommendations={analysis.care_recommendations} />
          )}

          {cognitiveDistortions.length > 0 && (
            <ItemSection
              icon={Brain}
              title="Cognitive Distortions"
              subtitle="Identified thinking patterns to be aware of"
              items={cognitiveDistortions}
            />
          )}

          {groundingTechniques.length > 0 && (
            <ItemSection
              icon={Lightbulb}
              title="Grounding Techniques"
              subtitle="Evidence-based strategies you can try"
              items={groundingTechniques}
            />
          )}
        </div>
      )}

      <ReviewStatus
        requiresReview={analysis.requires_human_review}
        {...(analysis.review_request_id !== undefined
          ? { reviewRequestId: analysis.review_request_id }
          : {})}
      />
    </div>
  );
};

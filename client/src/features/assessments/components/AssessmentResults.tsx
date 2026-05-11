import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { formatDateWithTime } from '@/utils/dateTimeUtils';
import type { AssessmentResult } from '../types';
import { assessmentSeverityToBadgeVariant } from './assessmentSeverity';

export interface AssessmentResultsProps {
  result: AssessmentResult;
}

/** Single responsibility: read-only display of a single completed assessment result. */
export const AssessmentResults: React.FC<AssessmentResultsProps> = ({ result }) => {
  const severityVariant = assessmentSeverityToBadgeVariant(result.severity_level);
  const assessmentName = result.assessment_type === 'PHQ9' ? 'PHQ-9 (Depression)' : 'GAD-7 (Anxiety)';
  const maxScore = result.assessment_type === 'PHQ9' ? 27 : 21;
  const rec = result.treatment_recommendations;

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{assessmentName} Assessment Results</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Completed on {formatDateWithTime(result.created_at)}
              </p>
            </div>
            <Badge variant={severityVariant}>{result.severity_label}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Score</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {result.score} <span className="text-lg text-neutral-500">/ {maxScore}</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Score Range</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white mt-1">{rec.score_range}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Treatment Recommendations</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Severity Level</p>
            <p className="text-base text-neutral-900 dark:text-white">{rec.severity}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Recommended Actions</p>
            <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">{rec.treatment}</p>
          </div>
        </div>
      </Card>

      <Card padding="md" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-start space-x-3">
          <span className="text-amber-600 dark:text-amber-400 text-xl" aria-hidden>
            ⚠️
          </span>
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Important Note</p>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
              These results are for informational purposes only and should not replace professional medical advice.
              Please consult with a qualified healthcare professional for proper diagnosis and treatment planning.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

import React from 'react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { formatDateWithTime } from '@/utils/dateTimeUtils';
import type { AssessmentResult } from '../types';
import { assessmentSeverityToBadgeVariant } from './assessmentSeverity';

export interface AssessmentHistoryProps {
  assessments: AssessmentResult[];
  onSelect?: (assessment: AssessmentResult) => void;
}

/** Single responsibility: list past assessments with optional selection. */
export const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({ assessments, onSelect }) => {
  if (assessments.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <p className="text-neutral-600 dark:text-neutral-400">
            No assessment history found. Complete an assessment to see your results here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assessments.map((assessment) => {
        const name = assessment.assessment_type === 'PHQ9' ? 'PHQ-9 (Depression)' : 'GAD-7 (Anxiety)';
        const maxScore = assessment.assessment_type === 'PHQ9' ? 27 : 21;
        const variant = assessmentSeverityToBadgeVariant(assessment.severity_level);

        const card = (
          <Card padding="md" hover={!!onSelect}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{name}</h3>
                  <Badge variant={variant}>{assessment.severity_label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400">Score</p>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {assessment.score} / {maxScore}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400">Date</p>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {formatDateWithTime(assessment.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );

        if (!onSelect) return <div key={assessment.assessment_id}>{card}</div>;

        return (
          <div key={assessment.assessment_id}>
            <button
              type="button"
              className="w-full text-left rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => onSelect(assessment)}
            >
              {card}
            </button>
          </div>
        );
      })}
    </div>
  );
};

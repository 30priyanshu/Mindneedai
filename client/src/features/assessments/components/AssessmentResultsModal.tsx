import React from 'react';
import { Modal } from '@/shared/components/Modal';
import { Card } from '@/shared/components/Card';
import type { AssessmentResult } from '../types';
import { modalSeveritySurfaceClass, modalSeverityTextClass } from './assessmentResultsModalSeverity';

export interface AssessmentResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentResult | null;
}

/** Single responsibility: modal shell for inspecting a completed assessment. */
export const AssessmentResultsModal: React.FC<AssessmentResultsModalProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  if (!assessment) return null;

  const rec = assessment.treatment_recommendations;
  const maxLabel = assessment.assessment_type === 'PHQ9' ? 'Out of 27' : 'Out of 21';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${assessment.assessment_type} Assessment Results`}
      description={`Completed on ${new Date(assessment.created_at).toLocaleString()}`}
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className={`p-4 ${modalSeveritySurfaceClass(assessment.severity_level)}`}>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Total Score</div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white">{assessment.score}</div>
            <div className="text-xs text-neutral-500 mt-1">{maxLabel}</div>
          </Card>
          <Card className={`p-4 ${modalSeveritySurfaceClass(assessment.severity_level)}`}>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Severity</div>
            <div className={`text-2xl font-bold ${modalSeverityTextClass(assessment.severity_level)}`}>
              {assessment.severity_label}
            </div>
            <div className="text-xs text-neutral-500 mt-1">{assessment.severity_level}</div>
          </Card>
        </div>

        {rec && (
          <Card>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Treatment Recommendations</h3>
            <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              {rec.treatment && <p className="leading-relaxed">{rec.treatment}</p>}
              {rec.score_range && (
                <p className="text-xs text-neutral-500 mt-2">Score Range: {rec.score_range}</p>
              )}
            </div>
          </Card>
        )}

        <Card>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Question Responses</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(assessment.responses).map(([questionId, score]) => (
              <div
                key={questionId}
                className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-dark-card rounded border border-neutral-200 dark:border-dark-border"
              >
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Question {questionId.replace(/[^0-9]/g, '') || questionId}
                </span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{score}/3</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="text-xs text-neutral-500 space-y-1">
          <div>Assessment ID: {assessment.assessment_id}</div>
          <div>Created: {new Date(assessment.created_at).toLocaleString()}</div>
          {assessment.updated_at !== assessment.created_at && (
            <div>Updated: {new Date(assessment.updated_at).toLocaleString()}</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

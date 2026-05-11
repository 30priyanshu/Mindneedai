import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';

export interface AssessmentThankYouProps {
  onViewMore?: () => void;
}

/** Single responsibility: post-submission confirmation for patient assessments. */
export const AssessmentThankYou: React.FC<AssessmentThankYouProps> = ({ onViewMore }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md text-center" padding="lg">
        <div className="space-y-6">
          <div className="text-6xl mb-4" aria-hidden>
            ✓
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Thank You</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Your doctor will review your responses and discuss the results with you during your next appointment.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onViewMore && (
              <Button type="button" variant="secondary" onClick={onViewMore}>
                View Other Assessments
              </Button>
            )}
            <Button type="button" variant="primary" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

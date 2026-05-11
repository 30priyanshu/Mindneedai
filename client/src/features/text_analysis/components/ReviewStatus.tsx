import React, { useEffect, useState } from 'react';
import { Shield, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { textAnalysisApi } from '../service';
import type { ReviewStatus as ReviewStatusType } from '../types';

interface ReviewStatusProps {
  requiresReview: boolean;
  reviewRequestId?: string;
}

const STATUS_MAP = {
  pending: { icon: Clock, label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  'in_progress': { icon: Clock, label: 'Under Review', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  completed: { icon: CheckCircle, label: 'Review Complete', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
} as const;

export const ReviewStatus: React.FC<ReviewStatusProps> = ({ requiresReview, reviewRequestId }) => {
  const [actualStatus, setActualStatus] = useState<ReviewStatusType['status']>('pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requiresReview || !reviewRequestId) return;
    
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const data = await textAnalysisApi.getReviewStatus(reviewRequestId);
        setActualStatus(data.status);
      } catch (err) {
        console.error('Failed to fetch review status', err);
      } finally {
        setLoading(false);
      }
    };
    
    void fetchStatus();
  }, [requiresReview, reviewRequestId]);

  if (!requiresReview) return null;

  const status = STATUS_MAP[actualStatus] || STATUS_MAP.pending;
  const Icon = status.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${status.bg}`}>
      <Shield className={`w-5 h-5 flex-shrink-0 ${status.color}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${status.color}`}>Human Review Requested</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          This analysis has been flagged for expert review.
          {reviewRequestId && ` Reference: ${reviewRequestId.slice(0, 8)}…`}
        </p>
      </div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.bg} ${status.color}`}>
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {status.label}
      </div>
    </div>
  );
};

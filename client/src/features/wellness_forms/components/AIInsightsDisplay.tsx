import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, Heart, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { isApiError } from '@/core/exceptions';
import { formatDateWithTime } from '@/utils/dateTimeUtils';
import { wellnessFormApi } from '../service';
import type { WellnessAiInsightsResponse } from '../types';
import { AIDisclaimer } from './AIDisclaimer';
import { AIInsightsPatternsCard } from './AIInsightsPatternsCard';
import { AIInsightsDoctorSummaries } from './AIInsightsDoctorSummaries';
import { cleanInsightSummaryText, formatInsightDisplayDate } from './aiInsightsFormatting';

export interface AIInsightsDisplayProps {
  formId: string;
  userRole: 'user' | 'doctor';
}

const insightErrorMessage = (err: unknown): string => {
  if (isApiError(err)) return err.message;
  return 'Request failed';
};

/** Single responsibility: fetch, refresh, and render AI wellness insights for doctors and patients. */
export const AIInsightsDisplay: React.FC<AIInsightsDisplayProps> = ({ formId, userRole }) => {
  const { addToast } = useToast();
  const [insights, setInsights] = useState<WellnessAiInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const loadInsights = useCallback(async () => {
    try {
      const data = await wellnessFormApi.getAIInsights(formId);
      setInsights(data);
      setEditedSummary((prev) => prev || cleanInsightSummaryText(data.patient_summary ?? ''));
    } catch (err: unknown) {
      if (isApiError(err) && err.code === 404) {
        setInsights(null);
      } else {
        console.error('Failed to load AI insights', err);
      }
    } finally {
      setLoading(false);
    }
  }, [formId, editedSummary]);

  useEffect(() => {
    void loadInsights();
  }, [formId, loadInsights]);

  useEffect(() => {
    if (insights?.ai_generation_status !== 'processing') return;
    const id = window.setInterval(() => void loadInsights(), 4000);
    return () => window.clearInterval(id);
  }, [insights?.ai_generation_status, loadInsights]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await wellnessFormApi.regenerateAIInsights(formId);
      addToast({ type: 'success', message: 'AI insights regeneration started' });
      setEditedSummary('');
      setIsEditing(false);
      window.setTimeout(() => void loadInsights(), 2000);
    } catch (err: unknown) {
      addToast({ type: 'error', message: insightErrorMessage(err) });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSendToPatient = async () => {
    setSending(true);
    try {
      const summaryToSend = isEditing ? editedSummary : undefined;
      await wellnessFormApi.sendAIReportToPatient(formId, summaryToSend);
      addToast({ type: 'success', message: 'AI report sent to patient' });
      setIsEditing(false);
      await loadInsights();
    } catch (err: unknown) {
      addToast({ type: 'error', message: insightErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </Card>
    );
  }

  if (!insights) return null;

  const isProcessing = insights.ai_generation_status === 'processing';
  const isFailed = insights.ai_generation_status === 'failed';
  const isCompleted = insights.ai_generation_status === 'completed';
  const isSentToPatient = insights.ai_report_status === 'sent_to_patient';
  const isPendingReview = !isSentToPatient && isCompleted;

  const PatientMeta = (): React.ReactElement | null => {
    if (!insights.client_name && !insights.form_date) return null;
    return (
      <div className="mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
        <div className="space-y-1 text-sm">
          {insights.client_name && (
            <div className="flex gap-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Patient:</span>
              <span className="text-neutral-900 dark:text-dark-text">{insights.client_name}</span>
            </div>
          )}
          {insights.form_date && (
            <div className="flex gap-2">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">Date:</span>
              <span className="text-neutral-900 dark:text-dark-text">{formatInsightDisplayDate(insights.form_date)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (userRole === 'user' && isCompleted && isPendingReview) {
    return (
      <Card padding="lg" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Pending Doctor Review</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your doctor is reviewing the AI-generated insights. You&apos;ll be notified when it&apos;s ready.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isProcessing && (
        <Card padding="lg" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Generating AI Insights</h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">This may take a few moments…</p>
            </div>
          </div>
        </Card>
      )}

      {isFailed && (
        <Card padding="lg" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">AI Generation Failed</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {insights.error_message || 'Unable to generate insights at this time'}
                </p>
              </div>
            </div>
            {userRole === 'doctor' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void handleRegenerate()}
                disabled={regenerating}
                icon={regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              >
                Retry
              </Button>
            )}
          </div>
        </Card>
      )}

      {isCompleted && (
        <>
          <AIDisclaimer />

          {userRole === 'doctor' && isSentToPatient && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>
                Sent to patient on{' '}
                {insights.ai_report_sent_at ? formatDateWithTime(insights.ai_report_sent_at) : 'N/A'}
              </span>
            </div>
          )}

          {userRole === 'user' && insights.patient_summary && (
            <Card
              padding="lg"
              className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <PatientMeta />
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">Your Wellness Summary</h3>
                  <p className="text-purple-800 dark:text-purple-200 whitespace-pre-line leading-relaxed">
                    {cleanInsightSummaryText(insights.patient_summary)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {userRole === 'doctor' && (
            <AIInsightsDoctorSummaries
              insights={insights}
              isSentToPatient={isSentToPatient}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedSummary={editedSummary}
              setEditedSummary={setEditedSummary}
              onSend={handleSendToPatient}
              sending={sending}
              meta={<PatientMeta />}
            />
          )}

          {insights.patterns_detected && <AIInsightsPatternsCard patterns={insights.patterns_detected} />}

          {userRole === 'doctor' && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleRegenerate()}
                disabled={regenerating}
                icon={regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              >
                Regenerate Insights
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

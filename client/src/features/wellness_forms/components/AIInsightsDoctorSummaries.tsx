import React from 'react';
import { Heart, Loader2, Send, Sparkles } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import type { WellnessAiInsightsResponse } from '../types';
import { cleanInsightSummaryText } from './aiInsightsFormatting';

export interface AIInsightsDoctorSummariesProps {
  insights: WellnessAiInsightsResponse;
  isSentToPatient: boolean;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  editedSummary: string;
  setEditedSummary: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  meta: React.ReactNode;
}

/** Single responsibility: doctor-facing clinical + editable patient summary cards. */
export const AIInsightsDoctorSummaries: React.FC<AIInsightsDoctorSummariesProps> = ({
  insights,
  isSentToPatient,
  isEditing,
  setIsEditing,
  editedSummary,
  setEditedSummary,
  onSend,
  sending,
  meta,
}) => (
  <div className="space-y-4">
    {insights.clinical_summary && (
      <Card padding="lg" className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            {meta}
            <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-text mb-2">Clinical Summary</h3>
            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
              {cleanInsightSummaryText(insights.clinical_summary)}
            </p>
          </div>
        </div>
      </Card>
    )}

    {insights.patient_summary && (
      <Card
        padding="lg"
        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800"
      >
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            {meta}
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">Patient-Friendly Summary</h3>
              {!isSentToPatient && !isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  Edit before sending
                </Button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={8}
                className="w-full p-3 text-purple-800 dark:text-purple-200 bg-white/50 dark:bg-dark-surface/50 border border-purple-300 dark:border-purple-700 rounded-lg resize-y focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            ) : (
              <p className="text-purple-800 dark:text-purple-200 whitespace-pre-line leading-relaxed">
                {cleanInsightSummaryText(insights.patient_summary)}
              </p>
            )}
          </div>
        </div>
        {!isSentToPatient && (
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedSummary(cleanInsightSummaryText(insights.patient_summary));
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => void onSend()}
              disabled={sending}
              icon={sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              {isEditing ? 'Save & Send to Patient' : 'Send to Patient'}
            </Button>
          </div>
        )}
      </Card>
    )}
  </div>
);

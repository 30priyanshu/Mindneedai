import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { assessmentApi, type AssessmentRequest, type AssessmentType } from '../service';
import { PHQ9_ASSESSMENT_QUESTIONS, GAD7_ASSESSMENT_QUESTIONS } from '../constants';
import { QuestionnaireForm } from '../components/QuestionnaireForm';
import { AssessmentThankYou } from '../components/AssessmentThankYou';
import type { AssessmentQuestion } from '../types';

/** Fallback local questions (correct IDs guaranteed by constants.ts) */
const LOCAL_QUESTIONS: Record<AssessmentType, AssessmentQuestion[]> = {
  PHQ9: PHQ9_ASSESSMENT_QUESTIONS,
  GAD7: GAD7_ASSESSMENT_QUESTIONS,
};

/** Single responsibility: patient flow for completing doctor-requested PHQ-9 / GAD-7. */
export default function AssessmentPage(): React.ReactElement {
  const { addToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AssessmentRequest | null>(null);

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['assessments', 'available'],
    queryFn: assessmentApi.getAvailableRequests,
  });

  // Auto-select first pending request
  React.useEffect(() => {
    if (requests.length > 0 && !selectedRequest) {
      setSelectedRequest(requests[0]);
    }
  }, [requests, selectedRequest]);

  // Fetch questionnaire definition from backend (authoritative question IDs)
  const { data: questionnaire } = useQuery({
    queryKey: ['assessments', 'questionnaire', selectedRequest?.assessment_type],
    queryFn: () => assessmentApi.getQuestionnaire(selectedRequest!.assessment_type),
    enabled: !!selectedRequest,
    staleTime: Infinity,
  });

  const questions = questionnaire?.questions ?? (selectedRequest ? LOCAL_QUESTIONS[selectedRequest.assessment_type] : []);

  const submitForRequest = async (responses: Record<string, number>) => {
    if (!selectedRequest) return;
    try {
      selectedRequest.assessment_type === 'PHQ9'
        ? await assessmentApi.submitPHQ9(responses, selectedRequest.request_id)
        : await assessmentApi.submitGAD7(responses, selectedRequest.request_id);
      addToast({ type: 'success', message: 'Assessment submitted successfully!' });
      setSubmitted(true);
    } catch {
      addToast({ type: 'error', message: 'Failed to submit assessment. Please try again.' });
    }
  };

  if (loadingRequests) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return <AssessmentThankYou onViewMore={() => setSubmitted(false)} />;
  }

  if (requests.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">Wellness Questionnaires</h1>
          <p className="text-neutral-400 text-sm">No pending assessments from your doctor.</p>
        </div>
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center">
          <ClipboardList className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">Contact your doctor if you have questions about wellness assessments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">Wellness Questionnaire</h1>
        <p className="text-neutral-400 text-sm">Your doctor has requested you complete a wellness assessment.</p>
      </div>

      {/* Tab selector when multiple assessment types are pending */}
      {requests.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {requests.map((r) => (
            <button
              key={r.request_id}
              type="button"
              onClick={() => setSelectedRequest(r)}
              className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                selectedRequest?.request_id === r.request_id
                  ? 'bg-green-500 text-black border-green-500'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-700'
              }`}
            >
              {r.assessment_type === 'PHQ9' ? 'PHQ-9 (Depression)' : 'GAD-7 (Anxiety)'}
            </button>
          ))}
        </div>
      )}

      {selectedRequest && questions.length > 0 && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
          <QuestionnaireForm
            questions={questions}
            title={
              selectedRequest.assessment_type === 'PHQ9'
                ? 'Patient Health Questionnaire-9 (PHQ-9)'
                : 'Generalized Anxiety Disorder-7 (GAD-7)'
            }
            description="Over the last 2 weeks, how often have you been bothered by any of the following problems?"
            {...(selectedRequest.notes ? { doctorNote: selectedRequest.notes } : {})}
            onSubmit={submitForRequest}
          />
        </div>
      )}
    </div>
  );
}

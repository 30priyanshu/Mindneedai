import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Loader2, ClipboardList, Eye, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { assessmentApi } from '../service';
import { cn } from '@/utils/cn';
import { CreateAssessmentRequestModal } from '../components/CreateAssessmentRequestModal';
import { AssessmentResultsModal } from '../components/AssessmentResultsModal';
import type { AssessmentResult, DoctorAssessmentRequest } from '../types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  completed: 'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
  expired: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20',
};

/** Single responsibility: doctor dashboard for patient assessment requests. */
export default function DoctorPatientAssessmentsPage(): React.ReactElement {
  const qc = useQueryClient();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingResult, setViewingResult] = useState<AssessmentResult | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [loadingResultId, setLoadingResultId] = useState<string | null>(null);

  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['assessments', 'doctor', 'patients'],
    queryFn: assessmentApi.getDoctorPatients,
  });

  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['assessments', 'doctor', 'requests'],
    queryFn: assessmentApi.getDoctorRequests,
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: assessmentApi.cancelRequest,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assessments', 'doctor'] });
      addToast({ type: 'info', message: 'Assessment request cancelled.' });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to cancel request.' }),
  });

  const handleViewResult = async (req: DoctorAssessmentRequest) => {
    if (req.status !== 'completed') return;
    setLoadingResultId(req.request_id);
    try {
      const results = await assessmentApi.getPatientAssessments(req.patient_id, 1, 50);
      const match = results.find(
        (r) => r.assessment_type === req.assessment_type,
      );
      if (match) {
        setViewingResult(match);
        setResultModalOpen(true);
      } else {
        addToast({ type: 'warning', message: 'Assessment result not found.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to load assessment result.' });
    } finally {
      setLoadingResultId(null);
    }
  };

  const loading = loadingPatients || loadingRequests;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-green-500" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Patient Assessments</h1>
            <p className="text-neutral-400 text-sm">Manage assessment requests for your patients</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)} disabled={patients.length === 0}>
          New Assessment Request
        </Button>
      </div>

      <CreateAssessmentRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        patientOptions={patients}
        onSuccess={() => void qc.invalidateQueries({ queryKey: ['assessments', 'doctor'] })}
      />

      <AssessmentResultsModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        assessment={viewingResult}
      />

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
        <h2 className="font-semibold text-white">Assessment Requests</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading requests…
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500">No assessment requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.request_id}
                className="bg-black border border-neutral-800 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {req.patient_email ?? req.patient_id.slice(0, 8) + '…'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {req.assessment_type} · Sent {new Date(req.created_at).toLocaleDateString()}
                    {req.completed_at && (
                      <> · Completed {new Date(req.completed_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {req.result && (
                    <div className="text-right">
                      <span className="text-sm font-bold text-white">Score: {req.result.score}</span>
                      <p className="text-xs text-neutral-400">{req.result.severity_label}</p>
                    </div>
                  )}
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full border text-xs font-semibold',
                      STATUS_COLORS[req.status] ?? STATUS_COLORS.expired
                    )}
                  >
                    {req.status}
                  </span>
                  {req.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => void handleViewResult(req)}
                      disabled={loadingResultId === req.request_id}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                      aria-label="View results"
                    >
                      {loadingResultId === req.request_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {req.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Cancel this assessment request?')) {
                          cancelMutation.mutate(req.request_id);
                        }
                      }}
                      disabled={cancelMutation.isPending}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      aria-label="Cancel request"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

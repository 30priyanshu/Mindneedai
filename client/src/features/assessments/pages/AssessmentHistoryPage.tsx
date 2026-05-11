import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import { assessmentApi } from '../service';
import type { AssessmentResult } from '../types';
import { AssessmentHistory } from '../components/AssessmentHistory';
import { AssessmentResultsModal } from '../components/AssessmentResultsModal';

/** Single responsibility: patient history of completed assessments with detail modal. */
export default function AssessmentHistoryPage(): React.ReactElement {
  const [selected, setSelected] = useState<AssessmentResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['assessments', 'history'],
    queryFn: () => assessmentApi.getHistory(1, 50),
    staleTime: 60_000,
  });

  const results = data ?? [];

  const openResult = (r: AssessmentResult) => {
    setSelected(r);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">Assessment History</h1>
        <p className="text-neutral-400 text-sm">View your previous wellness questionnaire results</p>
      </div>

      {results.length === 0 ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center">
          <ClipboardList className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">No completed assessments yet.</p>
          <p className="text-sm text-neutral-500 mt-1">Assessments submitted by your doctor will appear here.</p>
        </div>
      ) : (
        <AssessmentHistory assessments={results} onSelect={openResult} />
      )}

      <AssessmentResultsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} assessment={selected} />
    </div>
  );
}

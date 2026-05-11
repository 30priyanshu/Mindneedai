import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, Loader2, Trash2, Filter } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { historyApi } from '../service';
import type { AnalysisModality } from '@/core/types';
import { cn } from '@/utils/cn';

const LABEL_COLORS: Record<string, string> = {
  happy: 'text-green-400 bg-green-500/10',
  sad: 'text-blue-400 bg-blue-500/10',
  angry: 'text-red-400 bg-red-500/10',
  anxious: 'text-amber-400 bg-amber-500/10',
  fearful: 'text-purple-400 bg-purple-500/10',
  neutral: 'text-neutral-400 bg-neutral-500/10',
  depressed: 'text-indigo-400 bg-indigo-500/10',
  stressed: 'text-orange-400 bg-orange-500/10',
};

const MODALITY_OPTIONS: Array<{ value: AnalysisModality | ''; label: string }> = [
  { value: '', label: 'All Modalities' },
  { value: 'text', label: 'Text' },
  { value: 'speech', label: 'Speech' },
  { value: 'video', label: 'Video' },
];

export default function HistoryPage(): React.ReactElement {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modality, setModality] = useState<AnalysisModality | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['history', 'analysis', page, modality],
    queryFn: () =>
      historyApi.getHistory({
        page,
        size: 20,
        ...(modality !== '' ? { modality } : {}),
      }),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: historyApi.deleteEntry,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['history'] });
      addToast({ type: 'info', message: 'Entry deleted.' });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to delete entry.' }),
  });

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Analysis History</h1>
          <p className="text-neutral-400 text-sm mt-0.5">View and manage your past AI analysis sessions</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-neutral-400" />
        {MODALITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setModality(opt.value as AnalysisModality | ''); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
              modality === opt.value
                ? 'bg-green-500 text-black border-green-500'
                : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center">
          <History className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">No analysis history yet</p>
          <p className="text-sm text-neutral-500 mt-1">Run an AI analysis to see it appear here</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((entry) => (
              <div
                key={entry.request_id}
                className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
                          LABEL_COLORS[entry.prediction_label.toLowerCase()] ?? 'text-neutral-400 bg-neutral-500/10'
                        )}
                      >
                        {entry.prediction_label}
                      </span>
                      {entry.modality && (
                        <span className="text-xs text-neutral-500 capitalize border border-neutral-700 px-2 py-0.5 rounded-full">
                          {entry.modality}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(entry.created_at).toLocaleString()} ·{' '}
                      <span className="font-medium text-neutral-300">
                        {(entry.confidence * 100).toFixed(0)}%
                      </span>{' '}
                      confidence
                    </p>
                    {entry.summary && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{entry.summary}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Delete this analysis"
                  onClick={() => deleteMutation.mutate(entry.request_id)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-40 text-sm transition-all"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-400">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 disabled:opacity-40 text-sm transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Activity, Trash2, Shield, AlertTriangle, Stethoscope } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { healthMetricsApi } from '../service';
import type { HealthMetricsPayload, HealthMetricsEntry } from '../service';
import type { RiskLevel } from '@/core/types';
import { cn } from '@/utils/cn';

// ── Field definitions ────────────────────────────────────────────────────────
const FIELDS: Array<{ key: keyof HealthMetricsPayload; label: string; unit: string }> = [
  { key: 'oxygen_level', label: 'Oxygen (%)', unit: '%' },
  { key: 'systolic_bp', label: 'Systolic (mmHg)', unit: 'mmHg' },
  { key: 'diastolic_bp', label: 'Diastolic (mmHg)', unit: 'mmHg' },
  { key: 'pulse_rate', label: 'Pulse (bpm)', unit: 'bpm' },
];

const INITIAL: HealthMetricsPayload = {
  oxygen_level: null,
  systolic_bp: null,
  diastolic_bp: null,
  pulse_rate: null,
  note: '',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const riskChip = (level: RiskLevel | null | undefined): string => {
  if (level === 'danger') return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (level === 'caution') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-green-500/10 text-green-400 border-green-500/20';
};

const hasAnyMetric = (form: HealthMetricsPayload): boolean =>
  [form.oxygen_level, form.systolic_bp, form.diastolic_bp, form.pulse_rate].some((v) => v != null);

const getFieldError = (key: keyof Omit<HealthMetricsPayload, 'note'>, value: number | null | undefined) => {
  if (value == null) return null;
  if (key === 'oxygen_level' && (value < 50 || value > 100)) return 'Range: 50-100';
  if (key === 'systolic_bp' && (value < 50 || value > 260)) return 'Range: 50-260';
  if (key === 'diastolic_bp' && (value < 30 || value > 200)) return 'Range: 30-200';
  if (key === 'pulse_rate' && (value < 20 || value > 250)) return 'Range: 20-250';
  return null;
};

// ── Component ────────────────────────────────────────────────────────────────
export default function HealthMetricsPage(): React.ReactElement {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<HealthMetricsPayload>(INITIAL);

  const { data, isLoading } = useQuery({
    queryKey: ['health-metrics', 'history'],
    queryFn: () => healthMetricsApi.getHistory(1, 20),
    staleTime: 60_000,
  });

  const logMutation = useMutation({
    mutationFn: healthMetricsApi.log,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['health-metrics'] });
      setForm(INITIAL);
      addToast({ type: 'success', message: 'Health metrics logged with AI analysis!' });
    },
    onError: (err: any) => addToast({ type: 'error', message: err.message || 'Failed to save metrics. Please try again.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: healthMetricsApi.delete,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['health-metrics'] });
      addToast({ type: 'info', message: 'Entry deleted.' });
    },
  });

  const onChange = (key: keyof HealthMetricsPayload, raw: string) => {
    const val = raw === '' ? null : Number(raw);
    setForm((prev) => ({ ...prev, [key]: Number.isNaN(val!) ? null : val }));
  };

  const isValid = () => {
    if (!hasAnyMetric(form)) return false;
    return FIELDS.every(({ key }) => !getFieldError(key as any, form[key] as number | null));
  };

  const handleSubmit = () => {
    if (!isValid()) return;
    logMutation.mutate(form);
  };

  const entries: HealthMetricsEntry[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-green-500" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Health Metrics</h1>
          <p className="text-sm text-neutral-400">Log vitals with instant AI risk assessment</p>
        </div>
      </div>

      {/* Log form */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-green-500" />
          <h2 className="font-semibold text-white">New Entry</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FIELDS.map(({ key, label }) => {
            const error = getFieldError(key as any, form[key] as number | null);
            return (
            <div key={key}>
              <label htmlFor={`hm-${key}`} className="block text-sm font-medium text-neutral-300 mb-1.5">
                {label}
              </label>
              <input
                id={`hm-${key}`}
                type="number"
                value={(form[key] as number | null | undefined) ?? ''}
                onChange={(e) => onChange(key, e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-xl border bg-black text-white focus:outline-none transition-colors",
                  error ? "border-red-500/50 focus:border-red-500" : "border-neutral-800 focus:border-green-500"
                )}
              />
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </div>
            );
          })}
        </div>

        <textarea
          placeholder="Optional note"
          rows={2}
          maxLength={1000}
          value={form.note ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value || null }))}
          className="w-full px-3 py-2 rounded-xl border border-neutral-800 bg-black text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none resize-none"
        />

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!isValid() || logMutation.isPending}
        >
          {logMutation.isPending ? 'Analyzing…' : 'Save & Analyze'}
        </Button>
      </div>

      {/* History */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white">Recent Entries</h2>
          <span className="text-sm text-neutral-400">{entries.length} records</span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-400">
            <Activity className="w-4 h-4 animate-spin" />
            Loading entries…
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-neutral-500">No entries yet. Log your first vitals above.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.entry_id}
                className="border border-neutral-800 rounded-xl p-4 space-y-3 bg-black"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full border font-semibold',
                        riskChip(entry.risk_level)
                      )}
                    >
                      {(entry.risk_level ?? 'normal').toUpperCase()}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete entry"
                    onClick={() => deleteMutation.mutate(entry.entry_id)}
                    className="text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {FIELDS.map(({ key, unit }) => (
                    <div key={key} className="px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                      <span className="text-xs text-neutral-400">{key.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-semibold text-white">
                        {(entry.metrics as Record<string, number | null>)[key] != null
                          ? `${(entry.metrics as Record<string, number | null>)[key]}${unit}`
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {entry.ai_analysis?.analysis && (
                  <p className="text-sm text-neutral-300">{entry.ai_analysis.analysis}</p>
                )}

                {entry.warnings?.length > 0 && (
                  <div className="flex items-start gap-2 text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{entry.warnings[0]}</span>
                  </div>
                )}

                {entry.ai_analysis?.recommendations?.slice(0, 2).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                    <Stethoscope className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-500" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

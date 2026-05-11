import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Activity, AlertTriangle, ArrowRight, Droplets } from 'lucide-react';
import { healthMetricsApi } from '@/features/health_metrics/service';
import type { HealthMetricsEntry } from '@/features/health_metrics/service';
import { useAuth } from '@/contexts/AuthContext';
import { getMetricStatus } from '@/utils/healthValidation';
import { cn } from '@/utils/cn';

const metricLabels: Record<string, string> = {
  oxygen_level: 'Oxygen',
  systolic_bp: 'Systolic',
  diastolic_bp: 'Diastolic',
  pulse_rate: 'Pulse',
};

const metricUnits: Record<string, string> = {
  oxygen_level: '%',
  systolic_bp: 'mmHg',
  diastolic_bp: 'mmHg',
  pulse_rate: 'bpm',
};

function riskTextClass(risk?: string | null): string {
  if (risk === 'danger') return 'text-red-600 dark:text-red-400';
  if (risk === 'caution') return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

export const HealthMetricsWidget: React.FC = () => {
  const { userId } = useAuth();
  const [latest, setLatest] = useState<HealthMetricsEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    healthMetricsApi
      .getLatest()
      .then(setLatest)
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const renderMetric = (key: keyof HealthMetricsEntry['metrics']) => {
    const value = latest?.metrics[key];
    if (value == null) return null;
    const status = getMetricStatus(key, value);
    const bg =
      status === 'danger'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : status === 'caution'
          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';

    return (
      <div key={key} className={cn('rounded-xl p-3 border text-sm font-semibold', bg)}>
        <div className="flex items-center justify-between">
          <span className="text-neutral-600 dark:text-neutral-300">{metricLabels[key]}</span>
          <span className={riskTextClass(status)}>
            {value}
            {metricUnits[key]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Link
      to="/health"
      className="card-elevated hover:shadow-xl transition-all duration-200 hover:scale-[1.01] block"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <HeartPulse size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-dark-text">Health Metrics</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Latest O2, BP, Pulse</p>
          </div>
        </div>
        <ArrowRight size={18} className="text-primary" />
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-neutral-500">
          <Activity size={18} className="animate-spin" />
          <span>Loading...</span>
        </div>
      ) : latest ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {latest.risk_level === 'danger' && <AlertTriangle size={16} className="text-red-600" />}
            {latest.risk_level === 'caution' && <AlertTriangle size={16} className="text-amber-500" />}
            <span className={cn('text-sm font-semibold', riskTextClass(latest.risk_level))}>
              {latest.risk_level ? latest.risk_level.toUpperCase() : 'NORMAL'}
            </span>
            <span className="text-xs text-neutral-500">
              {new Date(latest.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderMetric('oxygen_level')}
            {renderMetric('pulse_rate')}
            {renderMetric('systolic_bp')}
            {renderMetric('diastolic_bp')}
          </div>
          {latest.warnings.length > 0 && (
            <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <Droplets size={16} />
              <span>{latest.warnings[0]}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
          <HeartPulse size={16} />
          <span>No entries yet. Add your first metrics.</span>
        </div>
      )}
    </Link>
  );
};

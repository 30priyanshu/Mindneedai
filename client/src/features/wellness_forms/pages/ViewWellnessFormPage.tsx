import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, ArrowLeft } from 'lucide-react';
import { wellnessFormApi } from '../service';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { WellnessFormWithToggle } from '../components/WellnessFormWithToggle';
import { isMentalWellnessFormShape, mapBackendToMentalWellnessFormData } from '@/utils/wellnessFormMapper';

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20',
  submitted: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  reviewed: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function ViewWellnessFormPage(): React.ReactElement {
  const { formId } = useParams<{ formId: string }>();
  const { role } = useAuth();

  const { data: form, isLoading, isError } = useQuery({
    queryKey: ['wellness-forms', formId],
    queryFn: () => wellnessFormApi.getById(formId!),
    enabled: !!formId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (isError || !form || !formId) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
        <p className="text-neutral-400">Form not found.</p>
        <Link to="/wellness-forms" className="text-green-500 hover:text-green-400 text-sm mt-2 inline-block">
          ← Back to forms
        </Link>
      </div>
    );
  }

  const formDataRecord = form.form_data as Record<string, unknown>;
  const mentalShape = isMentalWellnessFormShape(formDataRecord);
  const mentalModel = mentalShape
    ? mapBackendToMentalWellnessFormData(formDataRecord, form.client_name, form.form_date)
    : null;
  const insightsRole = role === 'doctor' ? 'doctor' : 'user';

  if (mentalModel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/wellness-forms"
            className="p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
            aria-label="Back to wellness forms"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{form.client_name || 'Wellness Form'}</h1>
            <div className="flex items-center gap-2 text-sm text-neutral-400 mt-0.5">
              {form.doctor_name && <span>Dr. {form.doctor_name}</span>}
              <span>·</span>
              <span>{new Date(form.form_date).toLocaleDateString()}</span>
            </div>
          </div>
          <span
            className={cn(
              'ml-auto px-3 py-1 rounded-full border text-xs font-semibold',
              STATUS_COLORS[form.status] ?? STATUS_COLORS.draft
            )}
          >
            {form.status}
          </span>
        </div>

        <WellnessFormWithToggle
          formData={mentalModel}
          formMode="view"
          formId={formId}
          userRole={insightsRole}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/wellness-forms"
          className="p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
          aria-label="Back to wellness forms"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{form.client_name || 'Wellness Form'}</h1>
          <div className="flex items-center gap-2 text-sm text-neutral-400 mt-0.5">
            {form.doctor_name && <span>Dr. {form.doctor_name}</span>}
            <span>·</span>
            <span>{new Date(form.form_date).toLocaleDateString()}</span>
          </div>
        </div>
        <span
          className={cn(
            'ml-auto px-3 py-1 rounded-full border text-xs font-semibold',
            STATUS_COLORS[form.status] ?? STATUS_COLORS.draft
          )}
        >
          {form.status}
        </span>
      </div>

      {/* Form data */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <h2 className="font-semibold text-white mb-4">Form Details</h2>
        {Object.entries(form.form_data).length === 0 ? (
          <p className="text-sm text-neutral-500">No form data available.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(form.form_data).map(([key, value]) => (
              <div key={key} className="flex gap-4 p-3 rounded-xl bg-black border border-neutral-800">
                <span className="text-sm font-medium text-neutral-400 min-w-32">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm text-white">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

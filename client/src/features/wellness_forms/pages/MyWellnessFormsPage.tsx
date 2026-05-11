import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Loader2, Trash2, Eye, Pencil, Plus } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { wellnessFormApi } from '../service';
import { cn } from '@/utils/cn';

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20',
  submitted: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  reviewed: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function MyWellnessFormsPage(): React.ReactElement {
  const { addToast } = useToast();
  const { role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const isDoctor = role === 'doctor';

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['wellness-forms', isDoctor ? 'doctor' : 'mine'],
    queryFn: () => (isDoctor ? wellnessFormApi.getDoctorForms() : wellnessFormApi.getUserForms()),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: wellnessFormApi.delete,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wellness-forms'] });
      addToast({ type: 'info', message: 'Form deleted.' });
    },
    onError: () => addToast({ type: 'error', message: 'Failed to delete form.' }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {isDoctor ? 'Wellness Forms' : 'My Wellness Forms'}
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            {isDoctor
              ? 'Mental wellness forms you have created for patients'
              : 'Forms completed by your doctor for your wellbeing'}
          </p>
        </div>
        {isDoctor && (
          <button
            type="button"
            onClick={() => navigate('/doctor/create-wellness-form')}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-medium rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Form
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center">
          <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400">
            {isDoctor ? 'No wellness forms created yet.' : 'No wellness forms yet.'}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            {isDoctor
              ? 'Create a form for a connected patient.'
              : 'Forms shared by your doctor will appear here.'}
          </p>
          {isDoctor && (
            <button
              type="button"
              onClick={() => navigate('/doctor/create-wellness-form')}
              className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-medium rounded-xl transition-colors text-sm inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Form
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <div
              key={form.form_id}
              className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{form.client_name || 'Wellness Form'}</h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                    {!isDoctor && form.doctor_name && <span>Dr. {form.doctor_name}</span>}
                    {!isDoctor && form.doctor_name && <span>·</span>}
                    <span>{new Date(form.form_date).toLocaleDateString()}</span>
                    {isDoctor && form.ai_generation_status && form.ai_generation_status !== 'pending' && (
                      <>
                        <span>·</span>
                        <span
                          className={cn(
                            form.ai_generation_status === 'completed'
                              ? 'text-green-400'
                              : form.ai_generation_status === 'processing'
                                ? 'text-amber-400'
                                : 'text-red-400'
                          )}
                        >
                          AI: {form.ai_generation_status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full border text-xs font-semibold',
                    STATUS_COLORS[form.status] ?? STATUS_COLORS.draft
                  )}
                >
                  {form.status}
                </span>
                <Link
                  to={`/wellness-forms/${form.form_id}`}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label="View form"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                {isDoctor && (
                  <Link
                    to={`/doctor/edit-wellness-form/${form.form_id}`}
                    className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    aria-label="Edit form"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                )}
                {isDoctor && (
                  <button
                    type="button"
                    aria-label="Delete form"
                    onClick={() => {
                      if (window.confirm('Delete this wellness form?')) {
                        deleteMutation.mutate(form.form_id);
                      }
                    }}
                    className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

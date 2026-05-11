import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/Button';
import { MOOD_SCORE_MIN, MOOD_SCORE_MAX } from '@/core/constants';
import type { MoodEntry } from '../types';

const schema = z.object({
  score: z
    .number({ invalid_type_error: 'Score must be a number' })
    .int()
    .min(MOOD_SCORE_MIN, `Minimum score is ${MOOD_SCORE_MIN}`)
    .max(MOOD_SCORE_MAX, `Maximum score is ${MOOD_SCORE_MAX}`),
  note: z.string().max(1000, 'Max 1000 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  date: string;
  initialEntry?: MoodEntry | null;
  onSave: (payload: { score: number; note: string; date: string }) => Promise<void>;
  onDelete?: (date: string) => Promise<void>;
  loading?: boolean;
}

export const MoodEntryForm: React.FC<Props> = ({ date, initialEntry, onSave, onDelete, loading = false }) => {
  const today = new Date().toISOString().slice(0, 10);
  const isFuture = date > today;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { score: initialEntry?.score ?? 5, note: initialEntry?.note ?? '' },
  });

  useEffect(() => {
    reset({ score: initialEntry?.score ?? 5, note: initialEntry?.note ?? '' });
  }, [initialEntry, date, reset]);

  const onSubmit = async (values: FormValues) => {
    if (isFuture || loading) return;
    await onSave({ score: values.score, note: values.note ?? '', date });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="mood-date" className="block text-sm font-medium mb-1.5 text-neutral-300">Date</label>
          <input
            id="mood-date"
            type="date"
            value={date}
            readOnly
            disabled
            className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-neutral-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="mood-score" className="block text-sm font-medium mb-1.5 text-neutral-300">
            Mood Score ({MOOD_SCORE_MIN}–{MOOD_SCORE_MAX})
          </label>
          <input
            id="mood-score"
            type="number"
            min={MOOD_SCORE_MIN}
            max={MOOD_SCORE_MAX}
            {...register('score', { valueAsNumber: true })}
            disabled={isFuture || loading}
            className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-white focus:border-green-500 focus:outline-none disabled:opacity-50"
          />
          {errors.score && <p className="mt-1 text-xs text-red-400">{errors.score.message}</p>}
        </div>

        <div className="flex items-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isFuture || loading}
            fullWidth
          >
            {initialEntry ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>

      <div>
        <label htmlFor="mood-note" className="block text-sm font-medium mb-1.5 text-neutral-300">
          Notes <span className="text-neutral-500 text-xs">(optional, max 1000 chars)</span>
        </label>
        <textarea
          id="mood-note"
          rows={4}
          maxLength={1000}
          {...register('note')}
          disabled={isFuture || loading}
          placeholder="How are you feeling today?"
          className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none disabled:opacity-50 resize-none"
        />
        {errors.note && <p className="mt-1 text-xs text-red-400">{errors.note.message}</p>}
      </div>

      {isFuture && (
        <p className="text-sm text-amber-400 flex items-center gap-2">
          ⚠️ You can only track mood for today and past days
        </p>
      )}

      {initialEntry && onDelete && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => onDelete(date)}
        >
          Delete Entry
        </Button>
      )}
    </form>
  );
};

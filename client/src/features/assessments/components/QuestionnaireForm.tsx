import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import type { AssessmentQuestion } from '../types';

export interface QuestionnaireFormProps {
  questions: AssessmentQuestion[];
  onSubmit: (responses: Record<string, number>) => Promise<void>;
  loading?: boolean;
  title: string;
  description: string;
  doctorNote?: string;
}

/** Single responsibility: collect Likert-scale answers for PHQ-9 / GAD-7 style forms. */
export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  questions,
  onSubmit,
  loading = false,
  title,
  description,
  doctorNote,
}) => {
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    questions.forEach((q) => {
      initial[q.id] = -1;
    });
    setResponses(initial);
  }, [questions]);

  const clearError = (questionId: string) => {
    setErrors((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleAnswerChange = (questionId: string, value: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    clearError(questionId);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    questions.forEach((q) => {
      if (responses[q.id] === undefined || responses[q.id] === -1) {
        newErrors[q.id] = 'Please select an answer';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validResponses: Record<string, number> = {};
    Object.entries(responses).forEach(([key, value]) => {
      if (value !== -1) validResponses[key] = value;
    });

    await onSubmit(validResponses);
  };

  const isComplete = questions.every((q) => responses[q.id] !== undefined && responses[q.id] !== -1);

  return (
    <form onSubmit={(ev) => void handleSubmit(ev)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{title}</h2>
        <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
        {doctorNote && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-300">
            Note from your doctor: {doctorNote}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id} padding="md">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-neutral-900 dark:text-white">
                <span className="font-semibold text-primary">{index + 1}.</span> {question.text}
              </label>

              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 p-3 rounded-md border border-neutral-300 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-surface cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={responses[question.id] === option.value}
                      onChange={() => handleAnswerChange(question.id, option.value)}
                      className="w-4 h-4 text-primary focus:ring-primary border-neutral-300 dark:border-dark-border"
                      disabled={loading}
                    />
                    <span className="text-neutral-700 dark:text-neutral-300 flex-1">{option.label}</span>
                  </label>
                ))}
              </div>

              {errors[question.id] && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors[question.id]}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={!isComplete || loading} loading={loading} size="lg">
          Submit Assessment
        </Button>
      </div>
    </form>
  );
};

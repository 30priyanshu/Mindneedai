import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { WeeklyMoodOverview } from '../components/WeeklyMoodOverview';
import { MoodEntryForm } from '../components/MoodEntryForm';
import { useMoodWeekly, useSaveMoodEntry, useDeleteMoodEntry } from '../hooks/useMood';
import { getTodayString, getWeekDates } from '@/utils/moodUtils';
import { useToast } from '@/contexts/ToastContext';
import type { MoodEntry } from '../types';

export default function MoodTrackerPage(): React.ReactElement {
  const { addToast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getTodayString);
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);

  const { data: weekly, isLoading, isError } = useMoodWeekly(weekOffset);
  const saveMutation = useSaveMoodEntry();
  const deleteMutation = useDeleteMoodEntry();

  // Sync selectedEntry when week data or selectedDate changes
  useEffect(() => {
    if (!weekly) return;
    const dates = getWeekDates(weekOffset);
    const idx = dates.indexOf(selectedDate);
    setSelectedEntry(idx >= 0 ? (weekly.entries[idx] as MoodEntry | null) : null);
  }, [selectedDate, weekly, weekOffset]);

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };

  const handlePrevWeek = () => setWeekOffset((w) => w - 1);
  const handleNextWeek = () => setWeekOffset((w) => w + 1);

  const handleSave = async (payload: { score: number; note: string; date: string }) => {
    await saveMutation.mutateAsync(payload);
    addToast({ type: 'success', message: 'Mood entry saved!' });
  };

  const handleDelete = async (date: string) => {
    await deleteMutation.mutateAsync(date);
    setSelectedEntry(null);
    addToast({ type: 'info', message: 'Mood entry deleted.' });
  };

  const saving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1.5">Mood Tracker</h1>
        <p className="text-neutral-400 text-sm">Track your daily mood and view weekly trends</p>
      </div>

      {isError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">Failed to load mood data. Please refresh.</p>
        </div>
      )}

      {/* Weekly overview */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Calendar className="w-4 h-4 text-green-500" />
            Weekly Overview
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrevWeek}
              disabled={isLoading}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleNextWeek}
              disabled={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-12 rounded-full bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : weekly ? (
          <WeeklyMoodOverview
            weekOffset={weekOffset}
            entries={weekly.entries}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />
        ) : (
          <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-700 rounded-xl">
            <Calendar className="mx-auto mb-3 w-12 h-12 opacity-30" />
            <p>No mood data available</p>
            <p className="text-sm mt-1">Start tracking below</p>
          </div>
        )}
      </div>

      {/* Entry form */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Daily Entry</h2>
          <p className="text-sm text-neutral-400">Selected: {selectedDate}</p>
        </div>
        <MoodEntryForm
          date={selectedDate}
          initialEntry={selectedEntry}
          onSave={handleSave}
          onDelete={handleDelete}
          loading={saving}
        />
      </div>
    </div>
  );
}

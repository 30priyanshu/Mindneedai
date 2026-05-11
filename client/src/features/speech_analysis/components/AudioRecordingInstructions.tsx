import React from 'react';
import { Mic, Volume2, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';

interface AudioRecordingInstructionsProps {
  onAccept: () => void;
  onCancel: () => void;
}

export function AudioRecordingInstructions({
  onAccept,
  onCancel,
}: AudioRecordingInstructionsProps): React.ReactElement {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="max-w-md w-full bg-white dark:bg-dark-surface shadow-2xl animate-slideUp border border-neutral-200 dark:border-dark-border">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/10">
              <Mic className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-dark-text">Recording Guidelines</h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Quick tips for best results</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Mic className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-dark-text mb-1">Microphone</h3>
                <p className="text-xs text-neutral-700 dark:text-neutral-300">
                  Speak clearly, 6-12 inches from mic
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-dark-text mb-1">Environment</h3>
                <p className="text-xs text-neutral-700 dark:text-neutral-300">
                  Find a quiet location with minimal noise
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-dark-text mb-1">Duration</h3>
                <p className="text-xs text-neutral-700 dark:text-neutral-300">
                  Optimal: 15-20 minutes (max 60 seconds)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface border border-amber-300/50 dark:border-amber-800/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-neutral-700 dark:text-neutral-300">
                  <strong>Privacy:</strong> Recording analyzed in real-time, not permanently stored
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1 h-11 px-4 text-sm font-semibold">
            Cancel
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 h-11 px-3 text-sm font-semibold"
            icon={<CheckCircle className="w-4 h-4" />}
          >
            Start Recording
          </Button>
        </div>
      </Card>
    </div>
  );
}

import React from 'react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Lightbulb, Camera, User, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface CameraInstructionsProps {
  onAccept: () => void;
  onCancel: () => void;
}

const INSTRUCTIONS = [
  {
    icon: Lightbulb,
    title: 'Good Lighting',
    description: 'Ensure you are in a well-lit environment. Face a light source for best results.',
    color: 'bg-amber-500/10 text-amber-600',
    bg: 'bg-white dark:bg-dark-surface',
  },
  {
    icon: Camera,
    title: 'Camera Position',
    description: 'Position your camera at eye level, about 2-3 feet away from your face.',
    color: 'bg-primary/10 text-primary',
    bg: 'bg-white dark:bg-dark-surface',
  },
  {
    icon: User,
    title: 'Face Visibility',
    description: 'Keep your entire face visible and centered in the frame at all times.',
    color: 'bg-purple-500/10 text-purple-600',
    bg: 'bg-white dark:bg-dark-surface',
  },
  {
    icon: Zap,
    title: 'Stable Environment',
    description: 'Find a quiet place with minimal movement in the background.',
    color: 'bg-emerald-500/10 text-emerald-600',
    bg: 'bg-white dark:bg-dark-surface',
  },
] as const;

export function CameraInstructions({ onAccept, onCancel }: CameraInstructionsProps): React.ReactElement {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <Card
        padding="none"
        className="max-w-2xl w-full bg-white dark:bg-dark-surface shadow-2xl border-2 border-neutral-200 dark:border-dark-border animate-scaleIn my-4 p-5"
      >
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm bg-primary/10">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-dark-text mb-1">Before We Start</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Follow these guidelines for accurate emotion analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {INSTRUCTIONS.map((instruction, idx) => {
            const Icon = instruction.icon;
            return (
              <div
                key={idx}
                className={`${instruction.bg} border border-neutral-200 dark:border-dark-border rounded-lg p-3 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 ${instruction.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-dark-text mb-0.5">
                      {instruction.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
                      {instruction.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-dark-text mb-0.5">Privacy Note</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
                Your video is processed in real-time and not stored. All analysis happens securely.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface border border-amber-300/50 dark:border-amber-800/50 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-dark-text mb-0.5">Important</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
                Maintain natural expressions and avoid sudden movements for best results.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onAccept} className="flex-1">
            <CheckCircle2 className="w-4 h-4" />
            Start Analysis
          </Button>
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}

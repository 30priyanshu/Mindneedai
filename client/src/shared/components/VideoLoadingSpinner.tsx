import { Video, Activity, Brain, CheckCircle2 } from 'lucide-react';

interface VideoLoadingSpinnerProps {
  message?: string;
  stage?: string;
}

const steps = [
  { id: 1, label: 'Analyzing video frames', icon: Video },
  { id: 2, label: 'Computing emotion patterns', icon: Activity },
  { id: 3, label: 'Generating AI insights', icon: Brain },
  { id: 4, label: 'Finalizing your report', icon: CheckCircle2 },
];

export const VideoLoadingSpinner = ({
  message = 'Processing...',
  stage = 'Analyzing video frames',
}: VideoLoadingSpinnerProps) => {
  const currentStepIndex = steps.findIndex((s) => s.label === stage);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scaleIn border border-neutral-200 dark:border-dark-border">
        <div className="flex flex-col space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-neutral-800 dark:text-dark-text mb-2">{message}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Please wait while we process your request
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;

              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-purple-600 text-white shadow-sm'
                        : isActive
                        ? 'bg-indigo-600 text-white animate-pulse-gentle shadow-sm'
                        : 'bg-neutral-100 dark:bg-dark-card text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>

                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isActive
                          ? 'text-neutral-900 dark:text-dark-text'
                          : isCompleted
                          ? 'text-violet-700 dark:text-violet-400 font-semibold'
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>

                  {isCompleted && (
                    <CheckCircle2
                      className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-scaleIn flex-shrink-0"
                      strokeWidth={2}
                    />
                  )}
                  {isActive && (
                    <div className="flex gap-1.5 flex-shrink-0 items-center">
                      {[0, 200, 400].map((delay) => (
                        <div
                          key={delay}
                          className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-dot-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="relative w-full h-2 bg-neutral-200 dark:bg-dark-card rounded-full overflow-hidden shadow-sm">
            <div
              className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

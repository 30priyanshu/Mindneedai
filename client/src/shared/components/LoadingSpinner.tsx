import { Brain, FileText, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  stage?: string;
  /** Route / auth bootstrap: simple centered spinner without multi-step analysis UI */
  fullPage?: boolean;
}

const steps = [
  { id: 1, label: 'Processing your input', icon: FileText },
  { id: 2, label: 'Detecting emotional patterns', icon: Brain },
  { id: 3, label: 'Generating AI insights', icon: Sparkles },
  { id: 4, label: 'Finalizing your analysis', icon: CheckCircle2 },
];

export const LoadingSpinner = ({
  message = 'Analyzing...',
  stage = 'Processing your input',
  fullPage = false,
}: LoadingSpinnerProps) => {
  if (fullPage) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.label === stage);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl p-10 max-w-lg w-full mx-4 animate-scaleIn border-2 border-primary/20 dark:border-primary/30">
        <div className="flex flex-col space-y-7">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-dark-text mb-3 leading-comfortable">
              {message}
            </h3>
            <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Please wait while we carefully process your request
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
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isActive
                        ? 'bg-primary text-white animate-pulse-gentle shadow-sm'
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
                          ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>

                  {isCompleted && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-scaleIn flex-shrink-0" strokeWidth={2} />
                  )}
                  {isActive && (
                    <div className="flex gap-1.5 flex-shrink-0 items-center">
                      {[0, 200, 400].map((delay) => (
                        <div
                          key={delay}
                          className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full animate-dot-bounce"
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
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

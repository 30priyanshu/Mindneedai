import React from 'react';
import { Sparkles } from 'lucide-react';

const WELLNESS_TIPS = [
  'Take deep breaths for 5 minutes to reduce stress',
  'Stay hydrated - drink at least 8 glasses of water today',
  'Get 7-9 hours of quality sleep tonight',
  "Practice gratitude by listing 3 things you're thankful for",
  'Take a 15-minute walk outdoors',
] as const;

function pickTip(): string {
  return WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)] ?? WELLNESS_TIPS[0];
}

export function DashboardWellnessTip(): React.ReactElement {
  const [tip] = React.useState(() => pickTip());
  return (
    <div className="card-elevated border-2 border-neutral-200 dark:border-dark-border hover:shadow-xl transition-all duration-200">
      <div className="flex items-start gap-4 md:gap-5">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
          <Sparkles size={24} className="md:w-7 md:h-7 text-primary" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-dark-text mb-2 md:mb-3 leading-comfortable">
            Wellness Tip of the Day
          </h3>
          <p className="text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed-plus font-medium">
            {tip}
          </p>
        </div>
      </div>
    </div>
  );
}

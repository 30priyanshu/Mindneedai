import React, { useState } from 'react';
import { MessageSquare, Sparkles, Info } from 'lucide-react';
import { TEXT_INPUT_MAX_CHARS } from '@/core/constants';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const WARNING_PCT = 80;
const DANGER_PCT = 95;

export const TextInput: React.FC<TextInputProps> = ({ value, onChange, disabled }) => {
  const [focused, setFocused] = useState(false);
  const pct = (value.length / TEXT_INPUT_MAX_CHARS) * 100;

  const barColor =
    pct >= DANGER_PCT ? 'bg-red-500' : pct >= WARNING_PCT ? 'bg-amber-500' : 'bg-green-500';
  const textColor =
    pct >= DANGER_PCT ? 'text-red-500' : pct >= WARNING_PCT ? 'text-amber-500' : 'text-green-500';

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-lg font-bold text-neutral-900 dark:text-white">
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-green-500" />
        </div>
        Share your thoughts
        <span className="ml-auto flex items-center gap-1.5 text-sm font-medium text-neutral-500">
          <Sparkles className="w-4 h-4" /> AI-Powered
        </span>
      </label>

      <div className="flex items-start gap-3 p-3 bg-green-500/5 border-l-4 border-green-500 rounded-r-lg">
        <Info className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          <strong>Tip:</strong> Express yourself freely — the more context you provide, the better our AI can support you.
        </p>
      </div>

      <div className="relative">
        <textarea
          id="text-analysis-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          maxLength={TEXT_INPUT_MAX_CHARS}
          placeholder="Example: Today I'm feeling a bit overwhelmed with work, but I'm trying to stay positive…"
          aria-label="Text for emotional analysis"
          aria-describedby="char-counter"
          className={`w-full min-h-52 resize-y px-4 py-3 bg-black border rounded-xl text-white placeholder-neutral-500 focus:outline-none transition-all duration-200 ${
            focused ? 'border-green-500 ring-1 ring-green-500' : 'border-neutral-800'
          }`}
        />
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-neutral-900 border border-neutral-700 rounded-lg">
          <span id="char-counter" className={`text-xs font-bold ${textColor}`}>
            {value.length} / {TEXT_INPUT_MAX_CHARS}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            role="progressbar"
            aria-valuenow={value.length}
            aria-valuemin={0}
            aria-valuemax={TEXT_INPUT_MAX_CHARS}
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className={`text-xs font-semibold min-w-16 text-right ${textColor}`}>
          {pct.toFixed(0)}% used
        </span>
      </div>
    </div>
  );
};

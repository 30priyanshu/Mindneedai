import React from 'react';
import { Brain } from 'lucide-react';
import type { MouseEventHandler } from 'react';

interface MarketingNavbarProps {
  readonly onSignIn: MouseEventHandler<HTMLButtonElement>;
  readonly onGetStarted: MouseEventHandler<HTMLButtonElement>;
}

export function MarketingNavbar({
  onSignIn,
  onGetStarted,
}: MarketingNavbarProps): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent flex items-center h-20 px-6 sm:px-10 font-sans">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20" aria-hidden="true">
            <Brain className="w-6 h-6 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
            MindNeed<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">AI</span>
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            type="button" 
            className="px-4 py-2 sm:px-5 sm:py-2.5 text-slate-200 hover:text-white font-semibold transition drop-shadow"
            onClick={onSignIn}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-all text-sm sm:text-base border border-teal-400/20"
            onClick={onGetStarted}
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}

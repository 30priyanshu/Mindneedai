import { Activity } from 'lucide-react';

export const Header = () => (
  <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-600 flex items-center justify-center rounded-lg">
            <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">MindNeedAI</h1>
            <p className="text-sm text-neutral-600 mt-0.5">Mental Wellness Analysis Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-sage-50 rounded-lg border border-sage-200">
          <div className="w-2 h-2 bg-sage-600 rounded-full" />
          <span className="text-sm font-medium text-sage-800">System Active</span>
        </div>
      </div>
    </div>
  </header>
);

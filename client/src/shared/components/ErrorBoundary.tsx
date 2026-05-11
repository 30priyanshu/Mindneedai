import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log in non-production; never expose stack to API responses
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
        <div className="max-w-md w-full bg-white dark:bg-dark-surface rounded-xl shadow-xl p-6 md:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-dark-text mb-2">Something went wrong</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">We encountered an unexpected error. Please try again.</p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-6 text-left bg-neutral-50 dark:bg-dark-bg rounded-lg p-4 text-xs">
              <summary className="cursor-pointer font-medium text-neutral-700 dark:text-neutral-300 mb-2">Error Details</summary>
              <pre className="text-red-600 dark:text-red-400 overflow-auto">{this.state.error.toString()}</pre>
            </details>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-neutral-200 dark:bg-dark-border hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-dark-text rounded-lg transition-colors font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

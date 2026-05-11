import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import App from './App';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { initializeNotifications } from '@/core/initializeNotifications';
import { queryClient } from '@/core/queryClient';
import './index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});

initializeNotifications();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Mount element #root not found.');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

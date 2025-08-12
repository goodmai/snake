import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
// Sentry init (no-op if VITE_SENTRY_DSN empty)
try {
  const dsn = import.meta?.env?.VITE_SENTRY_DSN;
  if (dsn) {
    const Sentry = await import('@sentry/react');
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  }
} catch {}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));

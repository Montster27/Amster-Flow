import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking
 * Only enabled if VITE_SENTRY_DSN environment variable is set
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  // Only initialize if DSN is provided
  if (!dsn) {
    console.info('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      // Replay integration for session replay
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Session Replay
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 0, // 10% in prod, disabled in dev
    replaysOnErrorSampleRate: 1.0, // Always capture on error

    // Filter out errors we don't care about
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter out network errors from browser extensions
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (
          message.includes('Extension context invalidated') ||
          message.includes('chrome-extension://') ||
          message.includes('moz-extension://')
        ) {
          return null;
        }
      }

      return event;
    },
  });
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error,
  context?: {
    user?: { id: string; email?: string };
    extra?: Record<string, any>;
    tags?: Record<string, string>;
  }
) {
  // Always log to console in development
  if (import.meta.env.DEV) {
    console.error('Error captured:', error, context);
  }

  // Send to Sentry if configured
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context?.user) {
        scope.setUser(context.user);
      }
      if (context?.tags) {
        scope.setTags(context.tags);
      }
      if (context?.extra) {
        scope.setExtras(context.extra);
      }
      Sentry.captureException(error);
    });
  } else {
    // Fallback to console.error if Sentry not configured
    console.error(error);
  }
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console[level === 'error' ? 'error' : 'log'](message);
  }
}

/**
 * Set user context for all future events
 */
export function setUser(user: { id: string; email?: string } | null) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info',
    });
  }
}

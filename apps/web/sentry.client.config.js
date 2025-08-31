import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  
  // Session replay for debugging
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Ignore certain errors
  ignoreErrors: [
    // Ignore common browser errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Script error.',
    // Ignore network errors that are not critical
    'Network request failed',
    'Failed to fetch',
  ],
  
  // Custom context
  beforeSend(event) {
    // Add user context if available
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('baseAppUser');
      if (user) {
        try {
          const userData = JSON.parse(user);
          event.user = {
            id: userData.id,
            username: userData.username,
          };
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
    return event;
  },
});

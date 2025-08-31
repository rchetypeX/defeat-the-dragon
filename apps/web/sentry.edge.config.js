import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 0.1,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.APP_VERSION || '1.0.0',
  
  // Custom context
  beforeSend(event) {
    // Add edge function context
    event.tags = {
      ...event.tags,
      service: 'defeat-the-dragon-web',
      component: 'edge',
    };
    return event;
  },
});

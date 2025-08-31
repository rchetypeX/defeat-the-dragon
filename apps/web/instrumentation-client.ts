// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Add optional integrations for additional features
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Set sampling rate for session replay
      // Adjust this value in production
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Distributed tracing configuration
  // This enables end-to-end tracing across client, server, and edge runtimes
  tracePropagationTargets: [
    "localhost", 
    "127.0.0.1",
    /^https:\/\/dtd\.rchetype\.xyz/,
    /^https:\/\/.*\.vercel\.app/,
    /^https:\/\/.*\.vercel\.com/
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
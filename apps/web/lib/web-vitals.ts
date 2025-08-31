import * as Sentry from '@sentry/nextjs';

// Performance thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay (ms)
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint (ms)
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint (ms)
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte (ms)
};

// Helper function to determine metric rating
function getRating(value: number, thresholds: { good: number; needsImprovement: number }) {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Helper function to log metrics to console in development
function logMetric(metric: any) {
  if (process.env.NODE_ENV === 'development') {
    const rating = getRating(metric.value, THRESHOLDS[metric.name as keyof typeof THRESHOLDS]);
    console.log(`📊 ${metric.name}: ${metric.value} (${rating})`);
  }
}

// Helper function to send metrics to Sentry
function sendToSentry(metric: any) {
  const rating = getRating(metric.value, THRESHOLDS[metric.name as keyof typeof THRESHOLDS]);
  
  // Send poor metrics as performance issues
  if (rating === 'poor') {
    Sentry.captureMessage(`Poor ${metric.name} performance: ${metric.value}`, {
      level: 'warning',
      tags: {
        metric: metric.name,
        rating,
        value: metric.value,
      },
      contexts: {
        performance: {
          metric: metric.name,
          value: metric.value,
          rating,
          threshold: THRESHOLDS[metric.name as keyof typeof THRESHOLDS],
        },
      },
    });
  }
}

// Initialize Web Vitals monitoring (simplified version)
export function initWebVitals() {
  // For now, just log that monitoring is initialized
  // We'll implement actual metrics collection later
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vitals monitoring initialized');
  }
  
  // TODO: Implement actual web vitals collection when we resolve import issues
  // This could involve using a different library or implementing custom metrics
}

// Custom performance monitoring for game-specific metrics
export function trackGamePerformance(metric: string, value: number, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎮 Game Performance - ${metric}: ${value}`, context);
  }
}

// Track focus session performance
export function trackFocusSessionPerformance(duration: number, success: boolean, interruptions: number) {
  trackGamePerformance('focus_session_duration', duration, {
    success,
    interruptions,
    session_type: 'focus',
  });
}

// Track game loading performance
export function trackGameLoadPerformance(loadTime: number, assetsLoaded: number) {
  trackGamePerformance('game_load_time', loadTime, {
    assets_loaded: assetsLoaded,
    load_type: 'initial',
  });
}

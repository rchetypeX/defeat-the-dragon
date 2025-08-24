'use client';

/**
 * Base App Debugging Utilities
 * Following the official "Common Issues & Debugging" documentation
 */

// Types for debugging
export interface DebugConfig {
  enableEruda: boolean;
  enableConsoleLogging: boolean;
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  enableManifestValidation: boolean;
}

export interface DebugInfo {
  isBaseApp: boolean;
  isMobile: boolean;
  userAgent: string;
  viewport: { width: number; height: number };
  manifestUrl: string;
  frameMetadata: boolean;
  walletConnection: boolean;
  errors: string[];
  warnings: string[];
}

// Debug configuration
const DEBUG_CONFIG: DebugConfig = {
  enableEruda: process.env.NODE_ENV === 'development' && typeof window !== 'undefined',
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
  enableManifestValidation: true,
};

/**
 * Initialize Eruda for mobile debugging
 * Following Base App debugging guidelines
 */
export async function initializeEruda(): Promise<void> {
  if (!DEBUG_CONFIG.enableEruda) return;

  try {
    // Only load Eruda in development and not on localhost
    if (typeof window !== 'undefined' && 
        process.env.NODE_ENV === 'development' && 
        !window.location.hostname.includes('localhost')) {
      
      const eruda = await import('eruda');
      eruda.default.init();
      
      console.log('🔧 Eruda mobile console initialized');
    }
  } catch (error) {
    console.warn('Failed to initialize Eruda:', error);
  }
}

/**
 * Validate manifest configuration
 * Following Base App manifest requirements
 */
export async function validateManifest(): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz';
    const manifestUrl = `${baseUrl}/.well-known/farcaster.json`;
    
    const response = await fetch(manifestUrl);
    
    if (!response.ok) {
      errors.push(`Manifest not accessible: ${response.status} ${response.statusText}`);
      return { isValid: false, errors, warnings };
    }

    const manifest = await response.json();
    
    // Validate required fields
    if (!manifest.accountAssociation) {
      errors.push('Missing accountAssociation in manifest');
    }
    
    if (!manifest.frame) {
      errors.push('Missing frame configuration in manifest');
    }
    
    if (!manifest.frame.primaryCategory) {
      errors.push('Missing primaryCategory (required for searchability)');
    }
    
    if (!manifest.frame.name) {
      errors.push('Missing app name in manifest');
    }
    
    if (!manifest.frame.iconUrl) {
      errors.push('Missing iconUrl in manifest');
    }
    
    // Validate image accessibility
    const imageUrls = [
      manifest.frame.iconUrl,
      manifest.frame.splashImageUrl,
      manifest.frame.heroImageUrl,
      ...(manifest.frame.screenshotUrls || [])
    ].filter(Boolean);

    for (const imageUrl of imageUrls) {
      try {
        const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageResponse.ok) {
          warnings.push(`Image not accessible: ${imageUrl}`);
        }
      } catch (error) {
        warnings.push(`Failed to validate image: ${imageUrl}`);
      }
    }

    // Validate HTTPS
    if (!baseUrl.startsWith('https://')) {
      errors.push('Domain must be accessible via HTTPS');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    errors.push(`Manifest validation failed: ${error}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Validate frame metadata
 * Following Base App embed requirements
 */
export function validateFrameMetadata(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if fc:frame metadata exists
    const frameMeta = document.querySelector('meta[name="fc:frame"]');
    if (!frameMeta) {
      errors.push('Missing fc:frame metadata');
    } else {
      try {
        const frameData = JSON.parse(frameMeta.getAttribute('content') || '{}');
        
        if (!frameData.imageUrl) {
          errors.push('Missing imageUrl in fc:frame metadata');
        }
        
        if (!frameData.button) {
          errors.push('Missing button configuration in fc:frame metadata');
        }
      } catch (error) {
        errors.push('Invalid fc:frame metadata JSON');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`Frame metadata validation failed: ${error}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Collect comprehensive debug information
 */
export function collectDebugInfo(): DebugInfo {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Detect environment
  const isBaseApp = typeof window !== 'undefined' && 
    (window.location.hostname.includes('base.org') || 
     window.navigator.userAgent.includes('BaseApp'));
  
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Check wallet connection
  let walletConnection = false;
  try {
    walletConnection = typeof window !== 'undefined' && 
      typeof window.ethereum !== 'undefined' && 
      window.ethereum.isMetaMask;
  } catch (error) {
    warnings.push('Failed to detect wallet connection');
  }

  // Check viewport
  const viewport = {
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  };

  return {
    isBaseApp,
    isMobile,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    viewport,
    manifestUrl: `${process.env.NEXT_PUBLIC_URL || 'https://dtd.rchetype.xyz'}/.well-known/farcaster.json`,
    frameMetadata: !!document.querySelector('meta[name="fc:frame"]'),
    walletConnection,
    errors,
    warnings,
  };
}

/**
 * Performance monitoring
 */
export function monitorPerformance(): void {
  if (!DEBUG_CONFIG.enablePerformanceMonitoring) return;

  if (typeof window !== 'undefined') {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('📊 Performance Metrics:', {
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
              firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime,
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'paint'] });
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        console.log('🧠 Memory Usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
        });
      }, 30000); // Every 30 seconds
    }
  }
}

/**
 * Error tracking and reporting
 */
export function setupErrorTracking(): void {
  if (!DEBUG_CONFIG.enableErrorTracking) return;

  if (typeof window !== 'undefined') {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('🚨 Global Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled Promise Rejection:', {
        reason: event.reason,
        timestamp: new Date().toISOString(),
      });
    });

    // Console error interceptor
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      
      // Log additional context
      console.log('🔍 Error Context:', {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    };
  }
}

/**
 * Quick diagnostic workflow
 * Following Base App debugging guidelines
 */
export async function runQuickDiagnostic(): Promise<{
  status: 'pass' | 'fail' | 'warning';
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  console.log('🔍 Running Base App Quick Diagnostic...');

  // 1. Check manifest accessibility
  const manifestValidation = await validateManifest();
  if (!manifestValidation.isValid) {
    issues.push(...manifestValidation.errors);
  }
  if (manifestValidation.warnings.length > 0) {
    recommendations.push(...manifestValidation.warnings);
  }

  // 2. Check frame metadata
  const frameValidation = validateFrameMetadata();
  if (!frameValidation.isValid) {
    issues.push(...frameValidation.errors);
  }

  // 3. Check environment
  const debugInfo = collectDebugInfo();
  
  if (!debugInfo.isBaseApp && process.env.NODE_ENV === 'production') {
    recommendations.push('Test in Base App environment for full functionality');
  }

  if (!debugInfo.isMobile) {
    recommendations.push('Test on mobile devices for optimal experience');
  }

  // 4. Check wallet connection
  if (!debugInfo.walletConnection) {
    recommendations.push('Wallet connection not detected - ensure MetaMask or similar is available');
  }

  // 5. Check viewport
  if (debugInfo.viewport.width < 320 || debugInfo.viewport.height < 568) {
    recommendations.push('Viewport size may be too small for optimal experience');
  }

  const status = issues.length > 0 ? 'fail' : recommendations.length > 0 ? 'warning' : 'pass';

  console.log(`🔍 Diagnostic ${status.toUpperCase()}:`, {
    issues,
    recommendations,
    debugInfo,
  });

  return { status, issues, recommendations };
}

/**
 * Debug logging utility
 */
export function debugLog(category: string, message: string, data?: any): void {
  if (!DEBUG_CONFIG.enableConsoleLogging) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${category}]`;
  
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

/**
 * Initialize all debugging tools
 */
export async function initializeDebugging(): Promise<void> {
  console.log('🔧 Initializing Base App debugging tools...');

  // Initialize Eruda for mobile debugging
  await initializeEruda();

  // Setup error tracking
  setupErrorTracking();

  // Setup performance monitoring
  monitorPerformance();

  // Run initial diagnostic
  await runQuickDiagnostic();

  console.log('✅ Base App debugging tools initialized');
}

// Export debug configuration for external use
export { DEBUG_CONFIG };

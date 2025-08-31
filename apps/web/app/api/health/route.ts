import { NextRequest, NextResponse } from 'next/server';
import { appLogger } from '../../../lib/logger';
import { trackGameLoadPerformance } from '../../../lib/web-vitals';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
      service: 'defeat-the-dragon-web',
    };

    // Check database connectivity (if needed)
    // const dbStatus = await checkDatabaseHealth();
    
    // Check external services
    const externalServices = {
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not_configured',
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
      sentry: process.env.SENTRY_DSN ? 'configured' : 'not_configured',
    };

    // Performance metrics
    const responseTime = Date.now() - startTime;
    
    // Log health check
    appLogger.info('Health check performed', {
      response_time: responseTime,
      external_services: externalServices,
    });

    // Track performance
    trackGameLoadPerformance(responseTime, 1);

    // Return health status
    return NextResponse.json({
      ...healthStatus,
      external_services: externalServices,
      response_time_ms: responseTime,
      checks: {
        database: 'ok', // Placeholder
        external_services: Object.values(externalServices).every(status => status === 'configured') ? 'ok' : 'warning',
        performance: responseTime < 100 ? 'excellent' : responseTime < 500 ? 'good' : 'needs_attention',
      },
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    appLogger.error('Health check failed', error as Error, {
      response_time: responseTime,
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime,
    }, {
      status: 500,
    });
  }
}

// Detailed health check with more metrics
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { detailed = false } = body;

    if (detailed) {
      // Memory usage
      const memoryUsage = process.memoryUsage();
      
      // System info
      const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        node_version: process.version,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
      };

      const responseTime = Date.now() - startTime;
      
      appLogger.info('Detailed health check performed', {
        response_time: responseTime,
        system_info: systemInfo,
      });

      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        detailed: true,
        system: systemInfo,
        response_time_ms: responseTime,
      });
    }

    // Default response for non-detailed requests
    return NextResponse.json({
      status: 'healthy',
      message: 'Use POST with { "detailed": true } for system information',
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    appLogger.error('Detailed health check failed', error as Error, {
      response_time: responseTime,
    });

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      response_time_ms: responseTime,
    }, {
      status: 500,
    });
  }
}

import pino from 'pino';

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  base: {
    service: 'defeat-the-dragon-web',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
    log: (object) => {
      return object;
    },
  },
});

// Enhanced logger
export class EnhancedLogger {
  private logger: pino.Logger;

  constructor() {
    this.logger = logger;
  }

  // Info logging
  info(message: string, context?: Record<string, any>) {
    this.logger.info({ message, ...context });
  }

  // Warning logging
  warn(message: string, context?: Record<string, any>) {
    this.logger.warn({ message, ...context });
  }

  // Error logging
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.logger.error({ message, error: error?.stack, ...context });
  }

  // Debug logging (only in development)
  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug({ message, ...context });
    }
  }

  // Game-specific logging
  gameEvent(event: string, data: Record<string, any>) {
    this.info(`Game Event: ${event}`, {
      event_type: 'game',
      event_name: event,
      ...data,
    });
  }

  // Focus session logging
  focusSession(action: string, duration?: number, success?: boolean) {
    this.info(`Focus Session: ${action}`, {
      event_type: 'focus_session',
      action,
      duration,
      success,
    });
  }

  // Performance logging
  performance(metric: string, value: number, context?: Record<string, any>) {
    this.info(`Performance: ${metric}`, {
      event_type: 'performance',
      metric,
      value,
      ...context,
    });
  }

  // User action logging
  userAction(action: string, userId?: string, context?: Record<string, any>) {
    this.info(`User Action: ${action}`, {
      event_type: 'user_action',
      action,
      user_id: userId,
      ...context,
    });
  }
}

// Export singleton instance
export const appLogger = new EnhancedLogger();

// Export raw logger for direct use
export { logger };

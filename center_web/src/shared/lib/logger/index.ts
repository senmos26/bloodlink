/**
 * ==========================================
 * UNIFIED LOGGING SYSTEM
 * ==========================================
 * Production-ready logging with different levels and structured output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
  originalError?: unknown;  // Original error object for tracking services
}

// Type for error objects that can be logged
interface LoggableError {
  message: string;
  stack?: string;
  code?: string | number;
  name?: string;
}

// Helper function to safely convert unknown error to LoggableError
function toLoggableError(error: unknown): LoggableError {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    return {
      message: String(errorObj.message || 'Unknown error'),
      stack: typeof errorObj.stack === 'string' ? errorObj.stack : undefined,
      code: typeof errorObj.code === 'string' || typeof errorObj.code === 'number' ? errorObj.code : undefined,
      name: typeof errorObj.name === 'string' ? errorObj.name : undefined,
    };
  }
  
  return {
    message: String(error || 'Unknown error'),
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = this.parseLogLevel(process.env.LOG_LEVEL);

  private parseLogLevel(level: string | undefined): LogLevel {
    const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    if (level && validLevels.includes(level as LogLevel)) {
      return level as LogLevel;
    }
    return 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private hashUserId(userId: string): string {
    // Simple hash for GDPR compliance - in production use proper cryptographic hashing
    return `user_${userId.slice(0, 8)}_${userId.slice(-4)}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    
    console.debug(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    } else {
      // In production, you might want to send to external service
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    
    console.error(this.formatMessage('error', message, context));
    
    // In production, you might want to send to error tracking service
    if (!this.isDevelopment && context?.originalError) {
      // Example: Send to Sentry, LogRocket, etc.
      // this.sendToErrorTracking(message, context);
    }
  }

  // Utility methods for common patterns
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context);
  }

  apiError(method: string, path: string, error: unknown, context?: LogContext): void {
    const loggableError = toLoggableError(error);
    this.error(`API ${method} ${path} failed`, {
      ...context,
      error: loggableError.message,
      stack: loggableError.stack,
      code: loggableError.code,
      originalError: error,
    });
  }

  dbQuery(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB ${operation} on ${table}`, context);
  }

  dbError(operation: string, error: unknown, context?: LogContext): void {
    const loggableError = toLoggableError(error);
    this.error(`DB ${operation} failed`, {
      ...context,
      error: loggableError.message,
      stack: loggableError.stack,
      code: loggableError.code,
      originalError: error,
    });
  }

  authEvent(event: string, userId?: string, context?: LogContext): void {
    // Hash userId for GDPR compliance
    const hashedUserId = userId ? this.hashUserId(userId) : undefined;
    this.info(`Auth ${event}`, {
      ...context,
      userId: hashedUserId,
    });
  }

  authError(event: string, error: unknown, context?: LogContext): void {
    const loggableError = toLoggableError(error);
    this.error(`Auth ${event} failed`, {
      ...context,
      error: loggableError.message,
      stack: loggableError.stack,
      code: loggableError.code,
      originalError: error,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for external use
export type { LogLevel, LogContext, LoggableError };

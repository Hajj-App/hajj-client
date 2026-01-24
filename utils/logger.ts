/**
 * Production-Safe Logger for React Native
 * Only logs detailed errors in development mode
 */

// React Native's __DEV__ global
declare const __DEV__: boolean;

const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  showTimestamp?: boolean;
}

class Logger {
  private prefix: string;
  private showTimestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '[App]';
    this.showTimestamp = options.showTimestamp ?? isDevelopment;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.showTimestamp ? `[${new Date().toISOString()}]` : '';
    return `${timestamp} ${this.prefix} [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  error(message: string, error?: unknown): void {
    if (isDevelopment) {
      console.error(this.formatMessage('error', message), error);
    } else {
      // In production, only log the message without sensitive error details
      console.error(this.formatMessage('error', message));
    }
  }

  /**
   * Log an error and return a user-friendly message
   */
  errorWithUserMessage(
    internalMessage: string,
    userMessage: string,
    error?: unknown
  ): string {
    this.error(internalMessage, error);
    return userMessage;
  }
}

// Default logger instance
export const logger = new Logger({ prefix: '[Hajj App]' });

// Create a logger with a custom prefix
export function createLogger(prefix: string): Logger {
  return new Logger({ prefix });
}

// User-friendly error messages for common errors
export const ERROR_MESSAGES = {
  LOAD_FAILED: 'Failed to load content. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PERMISSION_DENIED: 'Permission denied. Please grant the required permissions.',
  LOCATION_ERROR: 'Unable to get your location. Please enable location services.',
  STORAGE_ERROR: 'Failed to access storage. Please try again.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  OFFLINE: 'You are offline. Some features may not be available.',
  CACHE_ERROR: 'Failed to load cached data.',
} as const;

/**
 * Get a user-friendly error message based on error type
 */
export function getUserErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return ERROR_MESSAGES.PERMISSION_DENIED;
    }
    if (message.includes('location')) {
      return ERROR_MESSAGES.LOCATION_ERROR;
    }
    if (message.includes('storage') || message.includes('asyncstorage')) {
      return ERROR_MESSAGES.STORAGE_ERROR;
    }
    if (message.includes('auth')) {
      return ERROR_MESSAGES.AUTH_FAILED;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

export default logger;

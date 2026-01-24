/**
 * Retry Utilities
 * Implements retry logic with exponential backoff
 */
import { RETRY_CONFIG } from '@/constants/api';
import { logger } from './logger';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number => {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Default error classifier - determines if error is retryable
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors are retryable
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      return true;
    }
    
    // Server errors (5xx) are retryable
    if (message.includes('500') || message.includes('502') || 
        message.includes('503') || message.includes('504')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Execute a function with retry logic
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Result of the function or throws after max retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    initialDelayMs = RETRY_CONFIG.INITIAL_DELAY_MS,
    maxDelayMs = RETRY_CONFIG.MAX_DELAY_MS,
    backoffMultiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER,
    shouldRetry = (error) => isRetryableError(error),
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or if error is not retryable
      if (attempt === maxRetries || !shouldRetry(error, attempt)) {
        throw error;
      }

      const delay = calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier);
      
      logger.debug(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      
      if (onRetry) {
        onRetry(error, attempt + 1);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Fetch with retry support
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, {
      ...options,
      // Add timeout via AbortController
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok && response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    return response;
  }, retryOptions);
}

export default { withRetry, fetchWithRetry };

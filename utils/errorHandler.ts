/**
 * User-Friendly Error Handling Utilities
 * 
 * This module provides utilities for displaying user-friendly error messages
 * instead of raw technical errors to users.
 */

import { Alert, Platform } from 'react-native';
import { logger } from './logger';

// Error codes mapped to user-friendly messages
const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  // Network errors
  'network-error': {
    title: 'Connection Problem',
    message: 'Please check your internet connection and try again.',
  },
  'network/timeout': {
    title: 'Request Timeout',
    message: 'The request took too long. Please check your connection and try again.',
  },
  
  // Firebase Auth errors
  'auth/network-request-failed': {
    title: 'Connection Problem',
    message: 'Unable to connect. Please check your internet connection.',
  },
  'auth/user-not-found': {
    title: 'Session Expired',
    message: 'Please restart the app and try again.',
  },
  
  // Firebase Storage errors
  'storage/unauthorized': {
    title: 'Access Denied',
    message: 'Unable to access the requested content. Please try again later.',
  },
  'storage/object-not-found': {
    title: 'Content Not Found',
    message: 'The requested content is not available.',
  },
  'storage/quota-exceeded': {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again later.',
  },
  
  // Firestore errors
  'permission-denied': {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this content.',
  },
  'unavailable': {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again later.',
  },
  'not-found': {
    title: 'Not Found',
    message: 'The requested content was not found.',
  },
  
  // Location errors
  'location/permission-denied': {
    title: 'Location Access Needed',
    message: 'Please enable location access in your device settings to use this feature.',
  },
  'location/unavailable': {
    title: 'Location Unavailable',
    message: 'Unable to determine your location. Please try again.',
  },
  
  // Generic errors
  'unknown': {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};

/**
 * Get user-friendly error message from error code or error object
 */
export function getUserFriendlyError(
  error: unknown
): { title: string; message: string } {
  // Handle Firebase errors with code property
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
  }
  
  // Handle string error codes
  if (typeof error === 'string' && ERROR_MESSAGES[error]) {
    return ERROR_MESSAGES[error];
  }
  
  // Handle Error objects with message
  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES['network-error'];
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ERROR_MESSAGES['permission-denied'];
    }
    if (message.includes('not found')) {
      return ERROR_MESSAGES['not-found'];
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES['network/timeout'];
    }
  }
  
  return ERROR_MESSAGES['unknown'];
}

/**
 * Show a user-friendly error alert
 * Logs the actual error for debugging but shows a friendly message to users
 */
export function showErrorAlert(
  error: unknown,
  context?: string,
  options?: {
    onRetry?: () => void;
    showRetryButton?: boolean;
  }
): void {
  // Log the actual error for debugging
  logger.error(context || 'Error occurred', error);
  
  // Get user-friendly message
  const { title, message } = getUserFriendlyError(error);
  
  // Build alert buttons
  const buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }> = [
    { text: 'OK', style: 'cancel' },
  ];
  
  if (options?.onRetry || options?.showRetryButton) {
    buttons.unshift({
      text: 'Retry',
      onPress: options.onRetry,
    });
  }
  
  Alert.alert(title, message, buttons);
}

/**
 * Show a simple info alert (not an error)
 */
export function showInfoAlert(title: string, message: string): void {
  Alert.alert(title, message, [{ text: 'OK' }]);
}

/**
 * Show a confirmation alert
 */
export function showConfirmAlert(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
): void {
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, onPress: onConfirm },
  ]);
}

/**
 * Format error for display in UI (inline, not alert)
 * Returns a user-friendly string for displaying in error views
 */
export function formatErrorForDisplay(error: unknown): string {
  const { message } = getUserFriendlyError(error);
  return message;
}

/**
 * Check if error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return code.includes('network') || code === 'unavailable';
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || message.includes('fetch') || message.includes('timeout');
  }
  
  return false;
}

/**
 * Check if error is a permission error (user should not retry)
 */
export function isPermissionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return code.includes('unauthorized') || code.includes('permission');
  }
  
  return false;
}

export default {
  getUserFriendlyError,
  showErrorAlert,
  showInfoAlert,
  showConfirmAlert,
  formatErrorForDisplay,
  isNetworkError,
  isPermissionError,
};

/**
 * Input Sanitization Utilities for React Native
 * Prevents XSS attacks and validates user input
 */

// HTML special characters that need escaping (for WebView content)
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML special characters to prevent XSS in WebViews
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes a string by trimming whitespace
 */
export function sanitizeString(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim();
}

/**
 * Sanitizes an array of strings
 */
export function sanitizeStringArray(input: string[] | undefined | null): string[] {
  if (!Array.isArray(input)) return [];
  return input.map(sanitizeString).filter(Boolean);
}

/**
 * Removes all HTML tags from a string
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Validates and sanitizes a search query
 */
export function sanitizeSearchQuery(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  // Remove special regex characters and trim
  return input.trim().replace(/[.*+?^${}()|[\]\\]/g, '').slice(0, 100);
}

/**
 * Validates a URL is safe for navigation
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return false;
    }
  }
  
  // Allow http, https, tel, mailto, and maps links
  const allowedProtocols = ['http:', 'https:', 'tel:', 'mailto:', 'geo:'];
  try {
    const parsed = new URL(url);
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    // Allow relative URLs and common deep links
    return trimmedUrl.startsWith('/') || 
           trimmedUrl.includes('google.com/maps') ||
           trimmedUrl.includes('maps.google.com');
  }
}

/**
 * Sanitizes a URL for safe usage
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  if (!isValidUrl(url)) return '';
  return url.trim();
}

/**
 * Validates a phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  // Basic phone validation - allows digits, spaces, + - ( )
  const phoneRegex = /^[\d\s+\-()]{7,20}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validates latitude value
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validates longitude value
 */
export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
}

/**
 * Validates coordinates
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

// Named exports object
const sanitizeUtils = {
  escapeHtml,
  sanitizeString,
  sanitizeStringArray,
  stripHtml,
  sanitizeSearchQuery,
  isValidUrl,
  sanitizeUrl,
  isValidPhoneNumber,
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
};

export default sanitizeUtils;

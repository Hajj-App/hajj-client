/**
 * API Configuration
 * Centralized API endpoints and configuration
 */

export const API = {
  // Weather API (using HTTPS)
  WEATHER: {
    BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
    getUrl: (city: string, apiKey: string) => 
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`,
  },
  
  // Prayer Times API
  PRAYER: {
    BASE_URL: 'https://api.aladhan.com/v1/calendar',
    getUrl: (year: number, month: number, lat: number, lng: number, method = 15, tune = '0,2,0,5,1,3,0,-1') =>
      `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${method}&tune=${tune}`,
  },
  
  // External Links
  LINKS: {
    HAJ_COMMITTEE: 'https://www.hajcommittee.gov.in/',
    // TODO: Replace with actual WhatsApp group link
    WHATSAPP_GROUP: '', // Empty means feature is disabled
    WHATSAPP_SUPPORT: '', // For direct support
  },
} as const;

/**
 * Cache durations in milliseconds
 */
export const CACHE_DURATIONS = {
  PRAYER_TIMES: 1000 * 60 * 60 * 24, // 24 hours
  WEATHER: 1000 * 60 * 30, // 30 minutes
  LIVE_UPDATES: 1000 * 60 * 15, // 15 minutes
  TRAVEL_ADVISORIES: 1000 * 60 * 30, // 30 minutes
  UPCOMING_EVENTS: 1000 * 60 * 30, // 30 minutes
  RITUALS: 1000 * 60 * 60, // 1 hour
  HISTORIC_PLACES: 1000 * 60 * 60, // 1 hour
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

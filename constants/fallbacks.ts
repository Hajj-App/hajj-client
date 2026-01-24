/**
 * Fallback Constants
 * Default values and placeholder content for graceful degradation
 */

// Default placeholder image (using existing app image)
export const PLACEHOLDER_IMAGE = require('@/assets/images/umrah.png');

// Fallback images by category
export const FALLBACK_IMAGES = {
  MAKKAH: require('@/assets/images/makkah/makkah-img.webp'),
  MADINAH: require('@/assets/images/madina/madina-banner.webp'),
  RITUAL: require('@/assets/images/umrah.png'),
  EVENT: require('@/assets/images/umrah.png'),
  UPDATE: require('@/assets/images/makkah/makkah-img.webp'),
  HISTORIC: require('@/assets/images/madinah.png'),
} as const;

// Default text values
export const FALLBACK_TEXT = {
  LOCATION: 'Unknown Location',
  PRAYER_TIME: '--:--',
  TEMPERATURE: '--°C',
  WEATHER_DESC: 'Loading...',
  ERROR_TITLE: 'Something went wrong',
  ERROR_MESSAGE: 'Please check your connection and try again.',
  NO_DATA: 'No data available',
  LOADING: 'Loading...',
} as const;

// Default prayer times (for when API fails)
export const FALLBACK_PRAYER_TIMES = {
  Fajr: '05:00',
  Sunrise: '06:30',
  Dhuhr: '12:30',
  Asr: '16:00',
  Maghrib: '18:30',
  Isha: '20:00',
} as const;

// Default weather (for when API fails)
export const FALLBACK_WEATHER = {
  Makka: { temp: 35, description: 'Hot and sunny (offline)' },
  Madinah: { temp: 33, description: 'Hot and sunny (offline)' },
} as const;

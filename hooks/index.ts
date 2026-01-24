/**
 * Hooks Index
 * Central export for all custom hooks
 */

export { useNetworkStatus, isOnline, waitForNetwork } from './useNetworkStatus';
export { useOfflineData } from './useOfflineData';
export { useFirestoreData } from './useFirestoreData';
export { getCurrentCity, getCurrentLocation, locationPermission } from './useUserLocation';

// Re-export types
export type { NetworkStatus } from './useNetworkStatus';

// Re-export existing hooks
export { useColorScheme } from './useColorScheme';
export { useThemeColor } from './useThemeColor';


/**
 * Network Status Hook
 * Provides real-time network connectivity status
 */
import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { logger } from '../utils/logger';

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
}

/**
 * Hook for monitoring network connectivity
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  });

  useEffect(() => {
    const updateStatus = (state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      });

      if (!state.isConnected) {
        logger.info('Device is offline');
      } else if (state.isConnected && !state.isInternetReachable) {
        logger.warn('Connected but internet not reachable');
      }
    };

    // Get initial state
    NetInfo.fetch().then(updateStatus);

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(updateStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}

/**
 * Check if device is currently online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    logger.error('Error checking network status', error);
    return false;
  }
}

/**
 * Wait for network to become available
 */
export function waitForNetwork(timeoutMs: number = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    let subscription: NetInfoSubscription | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (subscription) subscription();
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Check initial state
    NetInfo.fetch().then((state) => {
      if (state.isConnected && state.isInternetReachable) {
        cleanup();
        resolve(true);
        return;
      }
    });

    // Subscribe to changes
    subscription = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        cleanup();
        resolve(true);
      }
    });

    // Timeout
    timeoutId = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);
  });
}

// Named exports
const networkUtils = {
  useNetworkStatus,
  isOnline,
  waitForNetwork,
};

export default networkUtils;

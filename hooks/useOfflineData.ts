/**
 * Offline-First Data Hook
 * Provides data fetching with automatic offline support and sync
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { fetchWithCache, getCachedData, forceRefresh, clearCache } from '../utils/cache';
import { isOnline } from './useNetworkStatus';
import { logger, ERROR_MESSAGES } from '../utils/logger';

interface UseOfflineDataOptions {
  /** How often to refresh data in ms (default: 15 minutes) */
  refreshInterval?: number;
  /** Whether to auto-refresh when app comes to foreground */
  refreshOnFocus?: boolean;
  /** Whether to show stale data while loading fresh data */
  staleWhileRevalidate?: boolean;
}

interface UseOfflineDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  isStale: boolean;
  refresh: () => Promise<void>;
  clearData: () => Promise<void>;
}

/**
 * Hook for fetching data with offline-first support
 * @param collectionName Firestore collection name
 * @param cacheKey Cache storage key
 * @param options Configuration options
 */
export function useOfflineData<T extends { id: string }>(
  collectionName: string,
  cacheKey: string,
  options: UseOfflineDataOptions = {}
): UseOfflineDataResult<T> {
  const {
    refreshInterval = 15 * 60 * 1000, // 15 minutes
    refreshOnFocus = true,
    staleWhileRevalidate = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async (forceNetwork = false) => {
    try {
      // Check network status
      const online = await isOnline();
      setIsOffline(!online);

      // If offline and we already have data, just return
      if (!online && data.length > 0 && !forceNetwork) {
        setIsStale(true);
        logger.info(`Offline: using cached ${collectionName} data`);
        return;
      }

      // If offline and no data, try to get from cache
      if (!online) {
        const cached = await getCachedData<T[]>(cacheKey);
        if (cached) {
          setData(cached);
          setIsStale(true);
          logger.info(`Offline: loaded ${cached.length} items from cache`);
        } else {
          setError(ERROR_MESSAGES.OFFLINE);
        }
        return;
      }

      // Online: fetch fresh data
      setLoading(true);
      setError(null);

      // If staleWhileRevalidate and we have data, show it while fetching
      if (staleWhileRevalidate && data.length > 0) {
        setIsStale(true);
      }

      const freshData = forceNetwork 
        ? await forceRefresh(collectionName, cacheKey) as T[]
        : await fetchWithCache<T>(collectionName, cacheKey);

      setData(freshData);
      setIsStale(false);
      lastFetchRef.current = Date.now();
      logger.info(`Fetched ${freshData.length} items from ${collectionName}`);
    } catch (err) {
      logger.error(`Error fetching ${collectionName}`, err);
      
      // Try to use cached data on error
      const cached = await getCachedData<T[]>(cacheKey);
      if (cached) {
        setData(cached);
        setIsStale(true);
        setError(null);
        logger.info('Using cached data after fetch error');
      } else {
        setError(err instanceof Error ? err.message : ERROR_MESSAGES.LOAD_FAILED);
      }
    } finally {
      setLoading(false);
    }
  }, [collectionName, cacheKey, data.length, staleWhileRevalidate]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const clearData = useCallback(async () => {
    await clearCache(cacheKey);
    setData([]);
    setIsStale(false);
  }, [cacheKey]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        // Only refresh if it's been at least refreshInterval since last fetch
        if (Date.now() - lastFetchRef.current >= refreshInterval) {
          fetchData();
        }
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, fetchData]);

  // Refresh on app focus
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Only refresh if data is stale or we've been away for a while
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        if (isStale || timeSinceLastFetch > refreshInterval / 2) {
          fetchData();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [refreshOnFocus, fetchData, refreshInterval, isStale]);

  return {
    data,
    loading,
    error,
    isOffline,
    isStale,
    refresh,
    clearData,
  };
}

export default useOfflineData;

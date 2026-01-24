/**
 * Unified Firestore Data Fetching Hook
 * Combines caching, network checking, retry logic, and error handling
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { collection, getDocs, query, orderBy as firestoreOrderBy, QueryConstraint } from 'firebase/firestore';
import { firestore } from '@/utils/firebase';
import { getCachedData, setCachedData, clearCache } from '@/utils/cache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { logger } from '@/utils/logger';
import { CACHE_DURATIONS } from '@/constants/api';
import { withRetry } from '@/utils/retry';

interface UseFirestoreDataOptions<T> {
  /** Cache key for storing data locally */
  cacheKey?: string;
  /** Cache duration in milliseconds */
  cacheDuration?: number;
  /** Field to order results by */
  orderByField?: string;
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
  /** Whether to fetch immediately on mount */
  fetchOnMount?: boolean;
  /** Refresh when app comes to foreground */
  refreshOnFocus?: boolean;
  /** Transform raw Firestore data */
  transform?: (data: Record<string, unknown>[]) => T[];
  /** Enable/disable the query */
  enabled?: boolean;
}

interface UseFirestoreDataResult<T> {
  /** Fetched data */
  data: T[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether currently refreshing (data exists but updating) */
  isRefreshing: boolean;
  /** Whether data is from cache (potentially stale) */
  isStale: boolean;
  /** Whether device is offline */
  isOffline: boolean;
  /** Manual refresh function */
  refresh: (force?: boolean) => Promise<void>;
  /** Clear cached data */
  clearCachedData: () => Promise<void>;
}

export function useFirestoreData<T extends { id: string }>(
  collectionName: string,
  options: UseFirestoreDataOptions<T> = {}
): UseFirestoreDataResult<T> {
  const {
    cacheKey = `${collectionName}_cache`,
    cacheDuration = CACHE_DURATIONS.RITUALS,
    orderByField = 'order',
    orderDirection = 'asc',
    fetchOnMount = true,
    refreshOnFocus = true,
    transform,
    enabled = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const { isConnected } = useNetworkStatus();
  const isOffline = isConnected === false;
  const lastFetchTime = useRef<number>(0);
  const isMounted = useRef(true);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    const now = Date.now();
    const hasData = data.length > 0;

    // Show refreshing indicator if we already have data
    if (hasData) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Check cache first (unless forcing network)
      if (!force) {
        const cached = await getCachedData<T[]>(cacheKey);
        if (cached) {
          if (isMounted.current) {
            setData(cached);
            setLoading(false);
            setIsStale(now - lastFetchTime.current > cacheDuration);
          }
          
          // If we're offline, don't try to fetch from network
          if (isOffline) {
            setIsRefreshing(false);
            return;
          }
        }
      }

      // If offline and no cache, show error
      if (isOffline && data.length === 0) {
        throw new Error('No internet connection and no cached data available');
      }

      // Skip network fetch if offline but we have cache
      if (isOffline) {
        setIsRefreshing(false);
        setIsStale(true);
        return;
      }

      // Fetch from Firestore
      await withRetry(async () => {
        if (!firestore) {
          throw new Error('Firebase not initialized');
        }

        // Auth is handled globally in _layout.tsx
        const constraints: QueryConstraint[] = [];
        if (orderByField) {
          constraints.push(firestoreOrderBy(orderByField, orderDirection));
        }

        const collectionRef = collection(firestore, collectionName);
        const q = constraints.length > 0 
          ? query(collectionRef, ...constraints)
          : query(collectionRef);
        
        const snapshot = await getDocs(q);
        
        let fetchedData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];

        // Apply custom transform if provided
        if (transform) {
          fetchedData = transform(fetchedData as unknown as Record<string, unknown>[]);
        }

        // Update state and cache
        if (isMounted.current) {
          setData(fetchedData);
          setIsStale(false);
          lastFetchTime.current = Date.now();
        }

        await setCachedData(cacheKey, fetchedData);
      });

    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch data';
      
      logger.error(`Error fetching ${collectionName}`, err);
      
      if (isMounted.current) {
        // Only show error if we don't have any data
        if (data.length === 0) {
          setError(errorMessage);
        } else {
          // We have stale data, mark as stale but don't show error
          setIsStale(true);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [
    enabled, 
    cacheKey, 
    cacheDuration, 
    collectionName, 
    orderByField, 
    orderDirection, 
    isOffline, 
    data.length,
    transform
  ]);

  const clearCachedData = useCallback(async () => {
    await clearCache(cacheKey);
    setData([]);
    setIsStale(false);
  }, [cacheKey]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    
    if (fetchOnMount && enabled) {
      fetchData();
    }

    return () => {
      isMounted.current = false;
    };
  }, [fetchOnMount, enabled]); // Don't include fetchData to avoid infinite loops

  // Refresh on app focus
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && enabled) {
        // Only refresh if it's been a while since last fetch
        const timeSinceLastFetch = Date.now() - lastFetchTime.current;
        if (timeSinceLastFetch > cacheDuration / 2) {
          fetchData();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refreshOnFocus, enabled, cacheDuration, fetchData]);

  return {
    data,
    loading,
    error,
    isRefreshing,
    isStale,
    isOffline,
    refresh: fetchData,
    clearCachedData,
  };
}

export default useFirestoreData;

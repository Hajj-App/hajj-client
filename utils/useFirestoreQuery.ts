/**
 * Custom Firestore Query Hooks
 * 
 * Reusable hooks for fetching data from Firestore with loading states,
 * error handling, and caching support.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { logger } from './logger';

// Types
export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if available and not expired
 */
function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Set data in cache
 */
function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Hook for fetching a single document from Firestore
 */
export function useDocument<T = DocumentData>(
  collectionName: string,
  documentId: string | undefined,
  options?: {
    enabled?: boolean;
    useCache?: boolean;
  }
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const { enabled = true, useCache = true } = options || {};

  const fetchDocument = useCallback(async () => {
    if (!documentId || !enabled || !firestore) {
      setLoading(false);
      return;
    }

    const cacheKey = `doc:${collectionName}:${documentId}`;

    // Check cache first
    if (useCache) {
      const cachedData = getCachedData<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const docRef = doc(firestore, collectionName, documentId);
      const snapshot = await getDoc(docRef);

      if (!isMounted.current) return;

      if (snapshot.exists()) {
        const docData = { id: snapshot.id, ...snapshot.data() } as T;
        setData(docData);
        if (useCache) {
          setCachedData(cacheKey, docData);
        }
      } else {
        setData(null);
        setError(new Error('Document not found'));
      }
    } catch (err) {
      if (!isMounted.current) return;
      logger.error(`Error fetching document ${collectionName}/${documentId}`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [collectionName, documentId, enabled, useCache]);

  useEffect(() => {
    isMounted.current = true;
    fetchDocument();
    return () => {
      isMounted.current = false;
    };
  }, [fetchDocument]);

  const refetch = useCallback(async () => {
    const cacheKey = `doc:${collectionName}:${documentId}`;
    cache.delete(cacheKey);
    await fetchDocument();
  }, [collectionName, documentId, fetchDocument]);

  return { data, loading, error, refetch };
}

/**
 * Hook for fetching a collection from Firestore
 */
export function useCollection<T = DocumentData>(
  collectionName: string,
  constraints?: QueryConstraint[],
  options?: {
    enabled?: boolean;
    useCache?: boolean;
  }
): UseCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const { enabled = true, useCache = true } = options || {};

  // Create a stable key for constraints
  const constraintsKey = JSON.stringify(constraints || []);

  const fetchCollection = useCallback(async () => {
    if (!enabled || !firestore) {
      setLoading(false);
      return;
    }

    const cacheKey = `col:${collectionName}:${constraintsKey}`;

    // Check cache first
    if (useCache) {
      const cachedData = getCachedData<T[]>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const collectionRef = collection(firestore, collectionName);
      const q = constraints?.length
        ? query(collectionRef, ...constraints)
        : query(collectionRef);

      const snapshot = await getDocs(q);

      if (!isMounted.current) return;

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];

      setData(docs);
      if (useCache) {
        setCachedData(cacheKey, docs);
      }
    } catch (err) {
      if (!isMounted.current) return;
      logger.error(`Error fetching collection ${collectionName}`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [collectionName, constraintsKey, enabled, useCache]);

  useEffect(() => {
    isMounted.current = true;
    fetchCollection();
    return () => {
      isMounted.current = false;
    };
  }, [fetchCollection]);

  const refetch = useCallback(async () => {
    const cacheKey = `col:${collectionName}:${constraintsKey}`;
    cache.delete(cacheKey);
    await fetchCollection();
  }, [collectionName, constraintsKey, fetchCollection]);

  return { data, loading, error, refetch };
}

/**
 * Hook for fetching rituals by type
 */
export function useRitualsByType(
  type: 'hajj' | 'umrah' | 'madina',
  options?: { enabled?: boolean }
) {
  return useCollection(
    'rituals',
    [where('type', '==', type), orderBy('order', 'asc')],
    options
  );
}

/**
 * Hook for fetching historic places by location
 */
export function useHistoricPlaces(
  location: 'makkah' | 'madinah',
  options?: { enabled?: boolean }
) {
  return useCollection(
    'historic_places',
    [where('location', '==', location), orderBy('order', 'asc')],
    options
  );
}

/**
 * Hook for fetching updates
 */
export function useUpdates(options?: { enabled?: boolean; activeOnly?: boolean }) {
  const constraints = options?.activeOnly
    ? [where('isActive', '==', true), orderBy('order', 'desc')]
    : [orderBy('order', 'desc')];

  return useCollection('updates', constraints, options);
}

/**
 * Hook for fetching advisories
 */
export function useAdvisories(options?: { enabled?: boolean; activeOnly?: boolean }) {
  const constraints = options?.activeOnly
    ? [where('isActive', '==', true), orderBy('order', 'asc')]
    : [orderBy('order', 'asc')];

  return useCollection('advisories', constraints, options);
}

/**
 * Hook for fetching events
 */
export function useEvents(options?: { enabled?: boolean; activeOnly?: boolean }) {
  const constraints = options?.activeOnly
    ? [where('isActive', '==', true), orderBy('order', 'asc')]
    : [orderBy('order', 'asc')];

  return useCollection('events', constraints, options);
}

export default {
  useDocument,
  useCollection,
  useRitualsByType,
  useHistoricPlaces,
  useUpdates,
  useAdvisories,
  useEvents,
  clearCache,
};

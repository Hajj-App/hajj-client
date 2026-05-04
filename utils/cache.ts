/**
 * Caching Utilities
 * Provides caching layer for Firestore data with proper error handling.
 *
 * Features:
 *  - Stale-while-revalidate: returns cache immediately, refreshes in background
 *  - Per-collection TTL: static data (24h), live data (5min)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { firestore } from "./firebase";
import { logger, ERROR_MESSAGES } from "./logger";

// Cache size cap (bytes) — evict LRU entries if total exceeds this
const MAX_CACHE_BYTES = 5 * 1024 * 1024; // 5 MB
const CACHE_KEY_PREFIX = "cache_";

// ────────────────────────────────────────────────────────────────
// Per-collection TTLs (ms)
// ────────────────────────────────────────────────────────────────
const TTL_STATIC = 1000 * 60 * 60 * 24; // 24 hours — rituals, historic_places
const TTL_LIVE = 1000 * 60 * 5; // 5 minutes — updates, advisories, events

const COLLECTION_TTLS: Record<string, number> = {
  rituals: TTL_STATIC,
  historic_places: TTL_STATIC,
  live_updates: TTL_LIVE,
  travel_advisories: TTL_LIVE,
  upcoming_events: TTL_LIVE,
  // legacy collections inherit live TTL to stay fresh during migration
  hajj_uploads: TTL_LIVE,
  umrah_uploads: TTL_LIVE,
  madina_uploads: TTL_LIVE,
  historic_places_makkah: TTL_STATIC,
  historic_places_madina: TTL_STATIC,
};

const getTTL = (collectionName: string): number =>
  COLLECTION_TTLS[collectionName] ?? TTL_STATIC;

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
interface CacheData<T = unknown> {
  data: T;
  timestamp: number;
  version?: string;
  lastAccess?: number;
}

// Base document type - just requires an id
interface BaseDocument {
  id: string;
  order?: number;
}

// ────────────────────────────────────────────────────────────────
// Cache version — increment when data structure changes
// ────────────────────────────────────────────────────────────────
const CACHE_VERSION = "1.1.0";

// ────────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────────
const getTimestampMs = (item: BaseDocument): number => {
  const anyItem = item as BaseDocument & { timestamp?: string };
  if (!anyItem.timestamp) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(anyItem.timestamp);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const dedupeByOrder = (items: BaseDocument[]): BaseDocument[] => {
  const byOrder = new Map<number, BaseDocument>();
  const noOrder: BaseDocument[] = [];

  for (const item of items) {
    if (item.order === undefined || item.order === null) {
      noOrder.push(item);
      continue;
    }

    const existing = byOrder.get(item.order);
    if (!existing || getTimestampMs(item) >= getTimestampMs(existing)) {
      byOrder.set(item.order, item);
    }
  }

  return [
    ...Array.from(byOrder.values()).sort(
      (a, b) => (a.order || 0) - (b.order || 0),
    ),
    ...noOrder,
  ];
};

// ────────────────────────────────────────────────────────────────
// Core cache read / write
// ────────────────────────────────────────────────────────────────

/**
 * Get cached data if it exists and is not expired.
 * Returns { data, stale } so callers can decide whether to revalidate.
 */
export const getCachedEntry = async <T>(
  key: string,
  ttl: number,
): Promise<{ data: T; stale: boolean } | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp, version }: CacheData<T> = JSON.parse(cached);

    // Version mismatch — treat as miss
    if (version !== CACHE_VERSION) {
      logger.debug(`Cache version mismatch for ${key}, clearing...`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    const age = Date.now() - timestamp;
    const stale = age > ttl;

    if (stale) {
      logger.debug(`Stale cache for ${key} (age=${Math.round(age / 1000)}s)`);
    } else {
      logger.debug(`Cache hit for ${key}`);
    }

    return { data, stale };
  } catch (error) {
    logger.error("Error reading cache", error);
    return null;
  }
};

/**
 * Get cached data if it exists and is not expired (convenience wrapper, backward-compat).
 */
export const getCachedData = async <T>(
  key: string,
  ttl = TTL_STATIC,
): Promise<T | null> => {
  const entry = await getCachedEntry<T>(key, ttl);
  if (!entry || entry.stale) return null;
  return entry.data;
};

/**
 * Set cached data with timestamp and version. Evicts LRU entries if total exceeds cap.
 */
export const setCachedData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      lastAccess: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    logger.debug(`Cache set for ${key}`);
    // Fire-and-forget eviction
    enforceCacheSizeLimit().catch(() => {});
  } catch (error) {
    logger.error("Error writing to cache", error);
  }
};

/**
 * Enforce overall cache size by evicting least-recently-used entries.
 */
const enforceCacheSizeLimit = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length === 0) return;

    const entries = await AsyncStorage.multiGet(cacheKeys);
    let totalBytes = 0;
    const meta: { key: string; bytes: number; lastAccess: number }[] = [];

    for (const [key, raw] of entries) {
      if (!raw) continue;
      const bytes = raw.length;
      totalBytes += bytes;
      let lastAccess = 0;
      try {
        const parsed = JSON.parse(raw) as CacheData;
        lastAccess = parsed.lastAccess ?? parsed.timestamp ?? 0;
      } catch {
        lastAccess = 0;
      }
      meta.push({ key, bytes, lastAccess });
    }

    if (totalBytes <= MAX_CACHE_BYTES) return;

    // Evict oldest first until under cap
    meta.sort((a, b) => a.lastAccess - b.lastAccess);
    const toRemove: string[] = [];
    for (const m of meta) {
      if (totalBytes <= MAX_CACHE_BYTES) break;
      toRemove.push(m.key);
      totalBytes -= m.bytes;
    }
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
      logger.info(`Cache LRU eviction: removed ${toRemove.length} entries`);
    }
  } catch (error) {
    logger.error("Error enforcing cache size limit", error);
  }
};

/**
 * Clear specific cache entry
 */
export const clearCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    logger.debug(`Cache cleared for ${key}`);
  } catch (error) {
    logger.error("Error clearing cache", error);
  }
};

/**
 * Clear all cached data
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith("cache_"));
    await AsyncStorage.multiRemove(cacheKeys);
    logger.info(`Cleared ${cacheKeys.length} cache entries`);
  } catch (error) {
    logger.error("Error clearing all cache", error);
  }
};

// ────────────────────────────────────────────────────────────────
// Firestore fetch (shared logic)
// ────────────────────────────────────────────────────────────────
const fetchFromFirestore = async <T extends BaseDocument>(
  collectionName: string,
): Promise<T[]> => {
  if (!firestore) {
    throw new Error(ERROR_MESSAGES.STORAGE_ERROR);
  }

  const collectionRef = collection(firestore, collectionName);
  const q = query(collectionRef, orderBy("order", "asc"));
  const querySnapshot = await getDocs(q);

  const data: BaseDocument[] = querySnapshot.docs.map((doc) => {
    const docData = doc.data();
    const { order: orderField, folderId, ...rest } = docData;
    return {
      id: doc.id,
      order: orderField !== undefined ? orderField : folderId || 0,
      ...rest,
    };
  });

  const sortedData = data.sort((a, b) => {
    const aOrder = a.order;
    const bOrder = b.order;
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;
    return 0;
  });

  return dedupeByOrder(sortedData) as T[];
};

// ────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────

/**
 * Fetch data with stale-while-revalidate caching.
 *
 * - If cache is fresh   → return cached data immediately (no network call)
 * - If cache is stale   → return stale data immediately AND kick off background refresh
 * - If no cache at all  → fetch from Firestore, cache result, return it
 *
 * The `onRevalidate` callback (optional) is called once the background refresh
 * completes, letting the UI update if needed.
 */
export const fetchWithCache = async <T extends BaseDocument = BaseDocument>(
  collectionName: string,
  cacheKey: string,
  onRevalidate?: (freshData: T[]) => void,
): Promise<T[]> => {
  const ttl = getTTL(collectionName);
  const entry = await getCachedEntry<T[]>(cacheKey, ttl);

  if (entry) {
    if (!entry.stale) {
      // Fresh cache — return immediately
      return entry.data;
    }

    // Stale cache — return immediately, revalidate in background (network-aware)
    logger.debug(`SWR: returning stale cache for ${cacheKey}, revalidating...`);

    NetInfo.fetch()
      .then((state) => {
        // Skip background revalidate on slow/offline links — saves bandwidth on cellular pilgrims
        if (!state.isConnected || state.type === "none") return;
        const cellularGen = (state.details as { cellularGeneration?: string })
          ?.cellularGeneration;
        if (cellularGen === "2g") return;

        return fetchFromFirestore<T>(collectionName)
          .then(async (freshData) => {
            await setCachedData(cacheKey, freshData);
            logger.debug(`SWR: background refresh done for ${cacheKey}`);
            onRevalidate?.(freshData);
          })
          .catch((err) =>
            logger.error(`SWR: background refresh failed for ${cacheKey}`, err),
          );
      })
      .catch(() => {
        // NetInfo failed — fall back to attempting refresh anyway
        fetchFromFirestore<T>(collectionName)
          .then(async (freshData) => {
            await setCachedData(cacheKey, freshData);
            onRevalidate?.(freshData);
          })
          .catch(() => {});
      });

    return entry.data; // return stale immediately
  }

  // No cache — fetch synchronously, cache, return
  try {
    const data = await fetchFromFirestore<T>(collectionName);
    await setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    logger.error(`Error fetching ${collectionName}`, error);
    throw error;
  }
};

/**
 * Force refresh data by clearing cache and fetching fresh
 */
export const forceRefresh = async (
  collectionName: string,
  cacheKey: string,
): Promise<BaseDocument[]> => {
  await clearCache(cacheKey);
  return fetchWithCache(collectionName, cacheKey);
};

// Named exports object
const cacheUtils = {
  getCachedData,
  getCachedEntry,
  setCachedData,
  clearCache,
  clearAllCache,
  fetchWithCache,
  forceRefresh,
  TTL_STATIC,
  TTL_LIVE,
};

export default cacheUtils;

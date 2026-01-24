/**
 * Caching Utilities
 * Provides caching layer for Firestore data with proper error handling
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firestore } from './firebase';
import { logger, ERROR_MESSAGES } from './logger';

const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

interface CacheData<T = unknown> {
  data: T;
  timestamp: number;
  version?: string;
}

// Base document type - just requires an id
interface BaseDocument {
  id: string;
  order?: number;
}

// Cache version - increment when data structure changes
const CACHE_VERSION = '1.0.0';

/**
 * Get cached data if it exists and is not expired
 */
export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp, version }: CacheData<T> = JSON.parse(cached);
    
    // Check if cache version matches
    if (version !== CACHE_VERSION) {
      logger.debug(`Cache version mismatch for ${key}, clearing...`);
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      logger.debug(`Cache expired for ${key}, clearing...`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    logger.debug(`Cache hit for ${key}`);
    return data;
  } catch (error) {
    logger.error('Error reading cache', error);
    return null;
  }
};

/**
 * Set cached data with timestamp and version
 */
export const setCachedData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    logger.debug(`Cache set for ${key}`);
  } catch (error) {
    logger.error('Error writing to cache', error);
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
    logger.error('Error clearing cache', error);
  }
};

/**
 * Clear all cached data
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
    logger.info(`Cleared ${cacheKeys.length} cache entries`);
  } catch (error) {
    logger.error('Error clearing all cache', error);
  }
};

/**
 * Fetch data with caching support
 * Returns cached data if available, otherwise fetches from Firestore
 */
export const fetchWithCache = async <T extends BaseDocument = BaseDocument>(
  collectionName: string,
  cacheKey: string
): Promise<T[]> => {
  // Try to get cached data first
  const cachedData = await getCachedData<T[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If no cache, fetch from Firestore
  if (!firestore) {
    throw new Error(ERROR_MESSAGES.STORAGE_ERROR);
  }
  
  try {
    const collectionRef = collection(firestore, collectionName);
    
    // Create query with orderBy for 'order' field
    const q = query(collectionRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const data: BaseDocument[] = querySnapshot.docs.map(doc => {
      const docData = doc.data();
      // Remove internal fields from the data
      const { order: orderField, folderId, ...rest } = docData;
      return {
        id: doc.id,
        // Use folderId as fallback when order is 0 or not present
        order: orderField !== undefined && orderField !== 0 ? orderField : (folderId || 0),
        ...rest
      };
    });

    // Sort the data array to ensure proper ordering
    const sortedData = data.sort((a, b) => {
      const aOrder = a.order;
      const bOrder = b.order;
      
      // If both have order, compare by order
      if (aOrder !== undefined && bOrder !== undefined) {
        return aOrder - bOrder;
      }
      // If only one has order, prioritize the one with order
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      // If neither has order, maintain original order
      return 0;
    });

    // Cache the new data
    await setCachedData(cacheKey, sortedData);
    
    return sortedData as T[];
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
  cacheKey: string
): Promise<BaseDocument[]> => {
  await clearCache(cacheKey);
  return fetchWithCache(collectionName, cacheKey);
};

// Named exports object
const cacheUtils = {
  getCachedData,
  setCachedData,
  clearCache,
  clearAllCache,
  fetchWithCache,
  forceRefresh,
  CACHE_EXPIRY,
};

export default cacheUtils;
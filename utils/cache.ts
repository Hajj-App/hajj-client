import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firestore } from './firebase';

const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

interface CacheData {
  data: any;
  timestamp: number;
}

export const getCachedData = async (key: string): Promise<any | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp }: CacheData = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

export const setCachedData = async (key: string, data: any): Promise<void> => {
  try {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const fetchWithCache = async (
  collectionName: string,
  cacheKey: string
): Promise<any[]> => {
  // Try to get cached data first
  const cachedData = await getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If no cache, fetch from Firestore
  if (!firestore) {
    throw new Error('Firestore is not initialized');
  }
  
  const collectionRef = collection(firestore, collectionName);
  
  // Create query with orderBy for 'order' field if it exists, otherwise fallback to 'folderId'
  const q = query(collectionRef, orderBy('order', 'asc'));
  const querySnapshot = await getDocs(q);
  
  const data = querySnapshot.docs.map(doc => {
    const docData = doc.data();
    // Remove order and folderId from the data
    const { order, folderId, ...rest } = docData;
    return {
      id: doc.id,
      // Use folderId as fallback when order is 0 or not present
      order: order !== undefined && order !== 0 ? order : (folderId || 0),
      ...rest
    };
  });

  // Sort the data array to ensure items without order come after items with order
  const sortedData = data.sort((a, b) => {
    // If both have order, compare by order
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // If only one has order, prioritize the one with order
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    // If neither has order, maintain original order
    return 0;
  });

  // Cache the new data
  await setCachedData(cacheKey, sortedData);
  
  return sortedData;
}; 
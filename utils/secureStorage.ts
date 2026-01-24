/**
 * Secure Storage Utilities
 * Uses expo-secure-store for sensitive data and AsyncStorage for regular data
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

// Keys for secure storage
export const SECURE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Keys for regular storage
export const STORAGE_KEYS = {
  LANGUAGE: 'app_language',
  THEME: 'app_theme',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  DIKR_SETTINGS: 'dikr_settings',
  CACHED_RITUALS: 'cached_rituals',
  CACHED_PLACES: 'cached_places',
  LAST_SYNC: 'last_sync',
} as const;

/**
 * Save sensitive data securely
 * Uses device's secure enclave/keychain
 */
export async function saveSecure(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    logger.debug(`Saved secure item: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Failed to save secure item: ${key}`, error);
    return false;
  }
}

/**
 * Get sensitive data from secure storage
 */
export async function getSecure(key: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value;
  } catch (error) {
    logger.error(`Failed to get secure item: ${key}`, error);
    return null;
  }
}

/**
 * Delete sensitive data from secure storage
 */
export async function deleteSecure(key: string): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key);
    logger.debug(`Deleted secure item: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete secure item: ${key}`, error);
    return false;
  }
}

/**
 * Save data to regular storage (for non-sensitive data)
 */
export async function saveStorage(key: string, value: unknown): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    logger.debug(`Saved storage item: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Failed to save storage item: ${key}`, error);
    return false;
  }
}

/**
 * Get data from regular storage
 */
export async function getStorage<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue === null) return null;
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    logger.error(`Failed to get storage item: ${key}`, error);
    return null;
  }
}

/**
 * Delete data from regular storage
 */
export async function deleteStorage(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    logger.debug(`Deleted storage item: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete storage item: ${key}`, error);
    return false;
  }
}

/**
 * Clear all app data (for logout/reset)
 */
export async function clearAllData(): Promise<boolean> {
  try {
    // Clear secure storage
    for (const key of Object.values(SECURE_KEYS)) {
      await deleteSecure(key);
    }
    
    // Clear regular storage
    await AsyncStorage.clear();
    
    logger.info('Cleared all app data');
    return true;
  } catch (error) {
    logger.error('Failed to clear all data', error);
    return false;
  }
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(): Promise<{ keys: string[]; size: number }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // Approximate size in bytes (UTF-16)
      }
    }
    
    return { keys: [...keys], size: totalSize };
  } catch (error) {
    logger.error('Failed to get storage info', error);
    return { keys: [], size: 0 };
  }
}

// Named exports object
const secureStorageUtils = {
  saveSecure,
  getSecure,
  deleteSecure,
  saveStorage,
  getStorage,
  deleteStorage,
  clearAllData,
  getStorageInfo,
  SECURE_KEYS,
  STORAGE_KEYS,
};

export default secureStorageUtils;

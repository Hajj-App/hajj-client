/**
 * Firebase Configuration for React Native
 * Centralized Firebase initialization with proper error handling
 */
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFirestore, Firestore } from "firebase/firestore";
import {
  initializeAuth,
  signInAnonymously,
  Auth,
  User,
  onAuthStateChanged,
  // @ts-expect-error - React Native persistence is available in react-native env
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "./logger";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// Validate configuration
const validateConfig = (): boolean => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  
  for (const field of requiredFields) {
    const value = firebaseConfig[field as keyof typeof firebaseConfig];
    if (!value || value.includes('YOUR_') || value.includes('your_')) {
      logger.warn(`Firebase ${field} is not properly configured`);
      return false;
    }
  }
  return true;
};

const hasValidConfig = validateConfig();

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | null = null;
let storage: FirebaseStorage | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

try {
  // Use existing app if already initialized
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  if (app) {
    storage = getStorage(app);
    firestore = getFirestore(app);
    
    // Initialize auth with React Native persistence
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (authError) {
      // Auth might already be initialized
      logger.warn("Auth initialization warning", authError);
    }
    
    logger.info("Firebase initialized successfully");
  }
} catch (error) {
  logger.error("Error initializing Firebase", error);
}

// Authentication state
let currentUser: User | null = null;
let authInitialized = false;

/**
 * Sign in anonymously to Firebase
 * Required for storage and firestore operations
 */
export const signInAnonymousUser = async (): Promise<boolean> => {
  if (!hasValidConfig || !auth) {
    logger.warn("Firebase not properly configured. Skipping authentication.");
    return false;
  }

  try {
    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
    logger.info("Signed in anonymously");
    return true;
  } catch (error) {
    logger.error("Error signing in anonymously", error);
    return false;
  }
};

/**
 * Initialize auth state listener
 */
export const initAuthListener = (): Promise<User | null> => {
  return new Promise((resolve) => {
    if (!auth) {
      resolve(null);
      return;
    }

    if (authInitialized) {
      resolve(currentUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      authInitialized = true;
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => currentUser;

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => currentUser !== null;

/**
 * Check if Firebase is properly configured
 */
export const isFirebaseConfigured = (): boolean => hasValidConfig;

// Export instances
export { app, storage, firestore, auth };
export default app;

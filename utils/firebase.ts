import { initializeApp, FirebaseApp } from "firebase/app";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFirestore, Firestore } from "firebase/firestore";
import {
  initializeAuth,
  getReactNativePersistence,
  signInAnonymously,
  Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let storage: FirebaseStorage | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize other services only if app initialization succeeds
  if (app) {
    storage = getStorage(app);
    firestore = getFirestore(app);
    
    // Initialize auth with persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Check if configuration has actual values
const hasValidConfig = Object.values(firebaseConfig).every(
  (value) => value && !value.includes("YOUR_")
);

// Anonymous sign-in
export const signInAnonymousUser = async (): Promise<void> => {
  if (!hasValidConfig || !auth) {
    console.warn("Firebase not properly configured. Skipping authentication.");
    return;
  }

  try {
    await signInAnonymously(auth);
    console.log("Signed in anonymously to Firebase");
  } catch (error) {
    console.error("Error signing in anonymously:", error);
  }
};

export { app, storage, firestore, auth };
export default app;
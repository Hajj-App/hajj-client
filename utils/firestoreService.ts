/**
 * Firestore Service - Version 2.0
 * 
 * Centralized Firestore operations with:
 * - Auto-generated IDs
 * - Server timestamps
 * - Type-safe operations
 * - Optimized queries
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter, // Import startAfter
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryConstraint,
  DocumentSnapshot, // Import types
} from 'firebase/firestore';

// ... (rest of imports)

/**
 * Get rituals of a specific type with pagination
 */
export const getRitualsByType = async (
  type: RitualType,
  limitCount: number = 10,
  lastVisible?: DocumentSnapshot
): Promise<{ rituals: Ritual[]; lastVisible: DocumentSnapshot | null }> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    let constraints: QueryConstraint[] = [
      where('type', '==', type),
      orderBy('order', 'asc'),
      limit(limitCount)
    ];

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }
    
    const q = query(collection(firestore, COLLECTIONS.RITUALS), ...constraints);
    
    const snapshot = await getDocs(q);
    const rituals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Ritual[];

    return {
      rituals,
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    };
  } catch (error) {
    logger.error(`Error getting rituals of type ${type}`, error);
    throw error;
  }
};

// ...

/**
 * Get historic places by location with pagination
 */
export const getHistoricPlaces = async (
  location?: PlaceLocation,
  limitCount: number = 10,
  lastVisible?: DocumentSnapshot
): Promise<{ places: HistoricPlace[]; lastVisible: DocumentSnapshot | null }> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    let constraints: QueryConstraint[] = [orderBy('order', 'asc')];
    
    if (location) {
      constraints.unshift(where('location', '==', location));
    }

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    constraints.push(limit(limitCount));
    
    const q = query(collection(firestore, COLLECTIONS.HISTORIC_PLACES), ...constraints);
    const snapshot = await getDocs(q);
    
    const places = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as HistoricPlace[];

    return {
      places,
      lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    };
  } catch (error) {
    logger.error('Error getting historic places', error);
    throw error;
  }
};

/**
 * Get Q&A / Lessons by type
 */
export const getQnAItems = async (
  type: 'audio' | 'text'
): Promise<any[]> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const q = query(
      collection(firestore, 'qna_uploads'),
      where('fileType', '==', type)
    );
    
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client side sort since we want to avoid index issues for simplicity
    return items.sort((a: any, b: any) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  } catch (error) {
    logger.error(`Error getting Q&A items of type ${type}`, error);
    throw error;
  }
};
import { firestore } from './firebase';
import { logger } from './logger';
import {
  COLLECTIONS,
  CURRENT_SCHEMA_VERSION,
  Ritual,
  RitualType,
  RitualInput,
  LiveUpdate,
  LiveUpdateInput,
  TravelAdvisory,
  TravelAdvisoryInput,
  UpcomingEvent,
  UpcomingEventInput,
  HistoricPlace,
  HistoricPlaceInput,
  PlaceLocation,
} from '../types/firestore';

// ============================================
// Generic Helpers
// ============================================

/**
 * Generate a new document with auto-ID
 */
const createDocRef = (collectionName: string) => {
  if (!firestore) throw new Error('Firestore not initialized');
  return doc(collection(firestore, collectionName));
};

/**
 * Get server timestamp fields for new documents
 */
const getTimestampFields = () => ({
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  schemaVersion: CURRENT_SCHEMA_VERSION,
});

/**
 * Get server timestamp for updates
 */
const getUpdateTimestamp = () => ({
  updatedAt: serverTimestamp(),
});

// ============================================
// Rituals (Hajj, Umrah, Madinah)
// ============================================

/**
 * Create a new ritual
 */
export const createRitual = async (
  type: RitualType,
  data: Omit<RitualInput, 'createdAt' | 'updatedAt' | 'schemaVersion' | 'type'>
): Promise<string> => {
  try {
    const docRef = createDocRef(COLLECTIONS.RITUALS);
    
    const ritualData: RitualInput = {
      ...data,
      type,
      ...getTimestampFields(),
    };
    
    await setDoc(docRef, ritualData);
    logger.info(`Created ritual: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating ritual', error);
    throw error;
  }
};

/**
 * Get a ritual by ID
 */
export const getRitual = async (ritualId: string): Promise<Ritual | null> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const docRef = doc(firestore, COLLECTIONS.RITUALS, ritualId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Ritual;
  } catch (error) {
    logger.error('Error getting ritual', error);
    throw error;
  }
};



/**
 * Update a ritual
 */
export const updateRitual = async (
  ritualId: string,
  data: Partial<Omit<Ritual, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>>
): Promise<void> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const docRef = doc(firestore, COLLECTIONS.RITUALS, ritualId);
    await updateDoc(docRef, {
      ...data,
      ...getUpdateTimestamp(),
    });
    logger.info(`Updated ritual: ${ritualId}`);
  } catch (error) {
    logger.error('Error updating ritual', error);
    throw error;
  }
};

/**
 * Delete a ritual
 */
export const deleteRitual = async (ritualId: string): Promise<void> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const docRef = doc(firestore, COLLECTIONS.RITUALS, ritualId);
    await deleteDoc(docRef);
    logger.info(`Deleted ritual: ${ritualId}`);
  } catch (error) {
    logger.error('Error deleting ritual', error);
    throw error;
  }
};

// ============================================
// Live Updates
// ============================================

/**
 * Create a new update
 */
export const createUpdate = async (
  data: Omit<LiveUpdateInput, 'createdAt' | 'updatedAt' | 'schemaVersion'>
): Promise<string> => {
  try {
    const docRef = createDocRef(COLLECTIONS.UPDATES);
    
    const updateData: LiveUpdateInput = {
      ...data,
      ...getTimestampFields(),
    };
    
    await setDoc(docRef, updateData);
    logger.info(`Created update: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating update', error);
    throw error;
  }
};

/**
 * Get all active updates
 */
export const getUpdates = async (activeOnly = true): Promise<LiveUpdate[]> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const constraints: QueryConstraint[] = [orderBy('order', 'desc')];
    if (activeOnly) {
      constraints.unshift(where('isActive', '==', true));
    }
    
    const q = query(collection(firestore, COLLECTIONS.UPDATES), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LiveUpdate[];
  } catch (error) {
    logger.error('Error getting updates', error);
    throw error;
  }
};

/**
 * Update an update
 */
export const updateUpdate = async (
  updateId: string,
  data: Partial<Omit<LiveUpdate, 'id' | 'createdAt' | 'updatedAt' | 'schemaVersion'>>
): Promise<void> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const docRef = doc(firestore, COLLECTIONS.UPDATES, updateId);
    await updateDoc(docRef, {
      ...data,
      ...getUpdateTimestamp(),
    });
    logger.info(`Updated update: ${updateId}`);
  } catch (error) {
    logger.error('Error updating update', error);
    throw error;
  }
};

/**
 * Delete an update
 */
export const deleteUpdate = async (updateId: string): Promise<void> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const docRef = doc(firestore, COLLECTIONS.UPDATES, updateId);
    await deleteDoc(docRef);
    logger.info(`Deleted update: ${updateId}`);
  } catch (error) {
    logger.error('Error deleting update', error);
    throw error;
  }
};

// ============================================
// Travel Advisories
// ============================================

/**
 * Create a new advisory
 */
export const createAdvisory = async (
  data: Omit<TravelAdvisoryInput, 'createdAt' | 'updatedAt' | 'schemaVersion'>
): Promise<string> => {
  try {
    const docRef = createDocRef(COLLECTIONS.ADVISORIES);
    
    const advisoryData: TravelAdvisoryInput = {
      ...data,
      ...getTimestampFields(),
    };
    
    await setDoc(docRef, advisoryData);
    logger.info(`Created advisory: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating advisory', error);
    throw error;
  }
};

/**
 * Get all advisories
 */
export const getAdvisories = async (activeOnly = true): Promise<TravelAdvisory[]> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const constraints: QueryConstraint[] = [orderBy('order', 'asc')];
    if (activeOnly) {
      constraints.unshift(where('isActive', '==', true));
    }
    
    const q = query(collection(firestore, COLLECTIONS.ADVISORIES), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TravelAdvisory[];
  } catch (error) {
    logger.error('Error getting advisories', error);
    throw error;
  }
};

// ============================================
// Upcoming Events
// ============================================

/**
 * Create a new event
 */
export const createEvent = async (
  data: Omit<UpcomingEventInput, 'createdAt' | 'updatedAt' | 'schemaVersion'>
): Promise<string> => {
  try {
    const docRef = createDocRef(COLLECTIONS.EVENTS);
    
    const eventData: UpcomingEventInput = {
      ...data,
      ...getTimestampFields(),
    };
    
    await setDoc(docRef, eventData);
    logger.info(`Created event: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating event', error);
    throw error;
  }
};

/**
 * Get all events
 */
export const getEvents = async (activeOnly = true): Promise<UpcomingEvent[]> => {
  try {
    if (!firestore) throw new Error('Firestore not initialized');
    
    const constraints: QueryConstraint[] = [orderBy('order', 'asc')];
    if (activeOnly) {
      constraints.unshift(where('isActive', '==', true));
    }
    
    const q = query(collection(firestore, COLLECTIONS.EVENTS), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as UpcomingEvent[];
  } catch (error) {
    logger.error('Error getting events', error);
    throw error;
  }
};

// ============================================
// Historic Places
// ============================================

/**
 * Create a new historic place
 */
export const createHistoricPlace = async (
  location: PlaceLocation,
  data: Omit<HistoricPlaceInput, 'createdAt' | 'updatedAt' | 'schemaVersion' | 'location'>
): Promise<string> => {
  try {
    const docRef = createDocRef(COLLECTIONS.HISTORIC_PLACES);
    
    const placeData: HistoricPlaceInput = {
      ...data,
      location,
      ...getTimestampFields(),
    };
    
    await setDoc(docRef, placeData);
    logger.info(`Created historic place: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating historic place', error);
    throw error;
  }
};



// ============================================
// Exports
// ============================================

export const firestoreService = {
  // Rituals
  createRitual,
  getRitual,
  getRitualsByType,
  updateRitual,
  deleteRitual,
  
  // Updates
  createUpdate,
  getUpdates,
  updateUpdate,
  deleteUpdate,
  
  // Advisories
  createAdvisory,
  getAdvisories,
  
  // Events
  createEvent,
  getEvents,
  
  // Historic Places
  createHistoricPlace,
  getHistoricPlaces,
  
  // Q&A
  getQnAItems,
};

export default firestoreService;

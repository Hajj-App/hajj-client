import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { firestore } from "./firebase";
import { getCachedData, setCachedData } from "./cache";

const CACHE_KEY = "upcoming_events_cache";
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes cache

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  url?: string;
  order: number;
  isNew: boolean;
}

export const checkForNewUpdates = async (): Promise<boolean> => {
  try {
    if (!firestore) {
      throw new Error("Firebase is not initialized");
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const eventsRef = collection(firestore, "upcoming_events");
    const querySnapshot = await getDocs(eventsRef);

    const events = querySnapshot.docs.map(doc => {
      const eventData = doc.data();
      const eventDate = new Date(eventData.date);
      const isNew = eventDate > twentyFourHoursAgo;

      return {
        ...eventData,
        id: doc.id,
        isNew
      };
    });

    return events.some(event => event.isNew);
  } catch (error) {
    console.error('Error checking for new updates:', error);
    return false;
  }
};

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    if (!firestore) {
      throw new Error("Firebase is not initialized");
    }

    const eventsRef = collection(firestore, "upcoming_events");
    const q = query(eventsRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const loadedEvents = querySnapshot.docs.map((doc) => {
      const eventData = doc.data();
      const eventDate = new Date(eventData.date);
      const isNew = eventDate > twentyFourHoursAgo;

      return {
        id: doc.id,
        title: eventData.title || '',
        date: eventData.date || '',
        location: eventData.location || '',
        description: eventData.description || '',
        url: eventData.url,
        order: eventData.order || 0,
        isNew,
      } as Event;
    });

    return loadedEvents;
  } catch (err) {
    console.error("Error fetching events:", err);
    throw err;
  }
}; 
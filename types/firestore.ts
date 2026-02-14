/**
 * Firestore Schema Types - Version 2.0
 * Optimized data structure for the Hajj app
 * 
 * MIGRATION: This replaces the old schema with:
 * - Auto-generated document IDs
 * - Firestore Timestamps instead of ISO strings
 * - Consolidated collections
 * - Schema versioning
 */

import { Timestamp, FieldValue } from 'firebase/firestore';

// ============================================
// Schema Version - increment on breaking changes
// ============================================
export const CURRENT_SCHEMA_VERSION = 2;

// ============================================
// Base Types
// ============================================

/** Base fields for all documents */
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: number;
}

/** For creating new documents (Timestamps handled by server) */
export interface BaseDocumentInput {
  createdAt: FieldValue;
  updatedAt: FieldValue;
  schemaVersion: number;
}

// ============================================
// Rituals (Hajj, Umrah, Madinah)
// ============================================

export type RitualType = 'hajj' | 'umrah' | 'madina';

/** Main ritual document */
export interface Ritual extends BaseDocument {
  name: string;
  description: string[];
  contentImageUrl?: string;
  type: RitualType;
  order: number;
  hasMedia: boolean;
  // Paragraphs stored inline for simplicity (unless very large)
  paragraphs: RitualParagraph[];
  // Media references
  video_link?: string;
  files?: string[];
  // Legacy reference for storage path resolution
  _legacyFolderId?: number;
  _legacyCollection?: string;
}

/** Ritual paragraph/section */
export interface RitualParagraph {
  title: string;
  content: string[];
  description?: string | string[]; // Legacy compat
  order: number;
}

/** Input for creating a ritual */
export interface RitualInput extends Omit<Ritual, 'id' | 'createdAt' | 'updatedAt'>, BaseDocumentInput {}

// ============================================
// Live Updates / Announcements
// ============================================

export interface LiveUpdate extends BaseDocument {
  title: string;
  content: string;
  date: string; // Display date
  imageUrl?: string;
  order: number;
  isActive: boolean;
}

export interface LiveUpdateInput extends Omit<LiveUpdate, 'id' | 'createdAt' | 'updatedAt'>, BaseDocumentInput {}

// ============================================
// Travel Advisories
// ============================================

export interface TravelAdvisory extends BaseDocument {
  title: string;
  content: string;
  date: string;
  order: number;
  isActive: boolean;
}

export interface TravelAdvisoryInput extends Omit<TravelAdvisory, 'id' | 'createdAt' | 'updatedAt'>, BaseDocumentInput {}

// ============================================
// Upcoming Events
// ============================================

export interface UpcomingEvent extends BaseDocument {
  title: string;
  description: string;
  date: string;
  endDate?: string;
  location?: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
}

export interface UpcomingEventInput extends Omit<UpcomingEvent, 'id' | 'createdAt' | 'updatedAt'>, BaseDocumentInput {}

// ============================================
// Historic Places
// ============================================

export type PlaceLocation = 'makkah' | 'madinah';

export interface HistoricPlace extends BaseDocument {
  name: string;
  description: string;
  imageUrl?: string;
  location: PlaceLocation;
  order: number;
}

export interface HistoricPlaceInput extends Omit<HistoricPlace, 'id' | 'createdAt' | 'updatedAt'>, BaseDocumentInput {}

// ============================================
// Collection Names (centralized)
// ============================================

export const COLLECTIONS = {
  RITUALS: 'rituals',
  UPDATES: 'updates',
  ADVISORIES: 'advisories',
  EVENTS: 'events',
  HISTORIC_PLACES: 'historic_places',
  
  // Legacy collections (for migration reference)
  LEGACY: {
    HAJJ_UPLOADS: 'hajj_uploads',
    UMRAH_UPLOADS: 'umrah_uploads',
    MADINA_UPLOADS: 'madina_uploads',
    LIVE_UPDATES: 'live_updates',
    TRAVEL_ADVISORIES: 'travel_advisories',
    UPCOMING_EVENTS: 'upcoming_events',
    HISTORIC_PLACES_MAKKAH: 'historic_places_makkah',
    HISTORIC_PLACES_MADINA: 'historic_places_madina',
  }
} as const;

// ============================================
// Helper functions
// ============================================

/**
 * Get the storage path for ritual media
 */
export const getRitualStoragePath = (type: RitualType, ritualId: string): string => {
  return `rituals/${type}/${ritualId}`;
};

/**
 * Get the legacy storage path (for migration)
 */
export const getLegacyStoragePath = (type: RitualType, folderId: number): string => {
  return `${type}/${folderId}`;
};

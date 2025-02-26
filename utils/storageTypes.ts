/**
 * Storage file metadata     interface
 */
export interface StorageFileMetadata {
  contentType?: string | null;
  size?: number;
  timeCreated?: string;
  updated?: string;
  customMetadata?: Record<string, string>;
  md5Hash?: string;
  generation?: string;
  fullPath?: string;
  name?: string;
  bucket?: string;
}

/**
 * Storage file information interface
 */
export interface StorageFile {
  name: string;
  fullPath: string;
  downloadURL: string;
  contentType?: string | null;
  size?: number;
  timeCreated?: string;
  updated?: string;
}

/**
 * Storage file list results interface
 */
export interface StorageListResult {
  items: Array<{
    name: string;
    fullPath: string;
    getDownloadURL: () => Promise<string>;
    getMetadata: () => Promise<StorageFileMetadata>;
  }>;
  prefixes: Array<{
    name: string;
    fullPath: string;
  }>;
}

/**
 * Storage file list component props
 */
export interface StorageFilesListProps {
  storagePath: string;
  onSelectFile?: (file: StorageFile) => void;
  showImages?: boolean;
}

/**
 * File preview component props
 */
export interface FilePreviewProps {
  file: StorageFile | null;
} 
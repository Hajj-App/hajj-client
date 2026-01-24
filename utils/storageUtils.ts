import { storage } from './firebase';
import * as ImagePicker from 'expo-image-picker';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL as getFirebaseDownloadURL, 
  listAll, 
  getMetadata as getFirebaseMetadata, 
  deleteObject 
} from 'firebase/storage';
import { StorageFile, StorageFileMetadata, StorageListResult } from './storageTypes';
import { logger } from './logger';

/**
 * Upload a file to Firebase Storage
 * @param {string} uri - Local URI of the file to upload
 * @param {string} path - Path in Firebase Storage where the file should be stored
 * @param {Record<string, any>} metadata - Metadata for the file (optional)
 * @returns {Promise<string>} - Download URL of the uploaded file
 */
export const uploadFile = async (
  uri: string, 
  path: string, 
  metadata: Record<string, unknown> = {}
): Promise<string> => {
  try {
    if (!storage) {
      throw new Error("Firebase storage is not initialized");
    }
    
    const storageRef = ref(storage, path);
    
    const response = await fetch(uri);
    const blob = await response.blob();
  
    const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
    
    return new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          logger.debug(`Upload is ${progress}% complete`);
        },
        (error) => {
          logger.error('Upload failed', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getFirebaseDownloadURL(storageRef);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    logger.error('Error uploading file', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} path - Path of the file in Firebase Storage
 * @returns {Promise<void>}
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    // Check if storage is initialized
    if (!storage) {
      throw new Error("Firebase storage is not initialized");
    }
    
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    logger.info('File deleted successfully');
  } catch (error) {
    logger.error('Error deleting file', error);
    throw error;
  }
};

/**
 * Pick an image from the device library and upload it to Firebase Storage
 * @param {string} storagePath - Path in Firebase Storage where the image should be stored
 * @returns {Promise<{downloadURL: string, fileName: string}>} - Download URL and file name of the uploaded image
 */
export const pickImageAndUpload = async (
  storagePath: string
): Promise<{downloadURL: string, fileName: string}> => {
  try {
    // Ask for permission to access the device library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permission to access media library was denied');
    }
    
    // Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      
      // Generate a unique file name
      const fileName = selectedImage.uri.split('/').pop() || '';
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${Date.now()}.${fileExtension}`;
      const filePath = `${storagePath}/${uniqueFileName}`;
      
      // Upload the image
      const downloadURL = await uploadFile(selectedImage.uri, filePath);
      
      return {
        downloadURL,
        fileName: uniqueFileName
      };
    }
    
    throw new Error('No image selected');
  } catch (error) {
    logger.error('Error picking and uploading image', error);
    throw error;
  }
};

/**
 * Get download URL for a file in Firebase Storage
 * @param {string} path - Path of the file in Firebase Storage
 * @returns {Promise<string>} - Download URL of the file
 */
export const getDownloadURL = async (path: string): Promise<string> => {
  try {
    // Check if storage is initialized
    if (!storage) {
      throw new Error("Firebase storage is not initialized");
    }
    
    const storageRef = ref(storage, path);
    const url = await getFirebaseDownloadURL(storageRef);
    return url;
  } catch (error) {
    logger.error('Error getting download URL', error);
    throw error;
  }
};

/**
 * List all files in a directory in Firebase Storage
 * @param {string} path - Path of the directory in Firebase Storage
 * @returns {Promise<StorageListResult>} - Array of file references
 */
export const listFiles = async (path: string): Promise<StorageListResult> => {
  try {
    // Check if storage is initialized
    if (!storage) {
      throw new Error("Firebase storage is not initialized. Check your Firebase configuration.");
    }

    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    // Convert Firebase ListResult to our StorageListResult interface
    return {
      items: result.items.map(item => ({
        name: item.name,
        fullPath: item.fullPath,
        getDownloadURL: () => getFirebaseDownloadURL(item),
        getMetadata: () => getFirebaseMetadata(item) as Promise<StorageFileMetadata>
      })),
      prefixes: result.prefixes.map(prefix => ({
        name: prefix.name,
        fullPath: prefix.fullPath
      }))
    };
  } catch (error: unknown) {
    const err = error as { code?: string };
    logger.error('Error listing files', error);
    
    // Provide more helpful error messages
    if (err.code === 'storage/unauthorized') {
      logger.warn('PERMISSION DENIED: Update your Firebase Storage rules to allow read access to this path.');
    } else if (err.code === 'storage/object-not-found') {
      logger.warn(`The path "${path}" does not exist in Firebase Storage.`);
    } else if (err.code === 'storage/invalid-argument') {
      logger.warn('Invalid storage path provided.');
    } else if (err.code === 'storage/unknown') {
      logger.warn('Unknown storage error. Check your Firebase configuration.');
    }
    
    throw error;
  }
};

/**
 * Get file metadata from Firebase Storage
 * @param {string} path - Path of the file in Firebase Storage
 * @returns {Promise<StorageFileMetadata>} - File metadata
 */
export const getFileMetadata = async (path: string): Promise<StorageFileMetadata> => {
  try {
    // Check if storage is initialized
    if (!storage) {
      throw new Error("Firebase storage is not initialized");
    }
    
    const storageRef = ref(storage, path);
    const metadata = await getFirebaseMetadata(storageRef);
    return metadata as StorageFileMetadata;
  } catch (error) {
    logger.error('Error getting file metadata', error);
    throw error;
  }
};

/**
 * Download a file from Firebase Storage
 * @param {string} path - Path of the file in Firebase Storage
 * @returns {Promise<Blob>} - File data as a blob
 */
export const downloadFile = async (path: string): Promise<Blob> => {
  try {
    // Check if storage is initialized
    if (!storage) {
      throw new Error("Firebase storage is not initialized");
    }
    
    const storageRef = ref(storage, path);
    const url = await getFirebaseDownloadURL(storageRef);
    const response = await fetch(url);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    logger.error('Error downloading file', error);
    throw error;
  }
};

/**
 * Get all files from a directory with their download URLs
 * @param {string} path - Path of the directory in Firebase Storage
 * @returns {Promise<StorageFile[]>} - Array of objects with file name and download URL
 */
export const getFilesWithUrls = async (path: string): Promise<StorageFile[]> => {
  try {
    // Check if storage is initialized
    if (!storage) {
      throw new Error("Firebase storage is not initialized. Check your Firebase configuration.");
    }
    
    const result = await listFiles(path);
    
    if (result.items.length === 0) {
      logger.warn(`No files found at path "${path}"`);
      return [];
    }
    
    // Get download URLs for all items
    const filePromises = result.items.map(async (item) => {
      try {
        const url = await item.getDownloadURL();
        const metadata = await item.getMetadata().catch(metaError => {
          logger.warn(`Could not fetch metadata for ${item.fullPath}`);
          return {} as StorageFileMetadata;
        });
        
        return {
          name: item.name,
          fullPath: item.fullPath,
          downloadURL: url,
          contentType: metadata.contentType,
          size: metadata.size,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated
        };
      } catch (itemError) {
        logger.warn(`Error processing file ${item.fullPath}`);
        // Return file with basic information
        return {
          name: item.name,
          fullPath: item.fullPath,
          downloadURL: '',
          contentType: '',
          size: 0
        };
      }
    });
    
    return Promise.all(filePromises);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    logger.error('Error getting files with URLs', error);
    
    // Add more context to the error for easier debugging
    if (err.code === 'storage/unauthorized') {
      throw new Error(`Access denied to path "${path}". Update your Firebase Storage rules to allow read access.`);
    }
    
    throw error;
  }
}; 
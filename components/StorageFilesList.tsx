import React, { useState, useEffect, FC } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ListRenderItemInfo } from 'react-native';
import { getFilesWithUrls, getFileMetadata } from '../utils/storageUtils';
import { StorageFile, StorageFilesListProps } from '../utils/storageTypes';

/**
 * Component to list and display files from Firebase Storage
 */
const StorageFilesList: FC<StorageFilesListProps> = ({ 
  storagePath, 
  onSelectFile,
  showImages = true 
}) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [storagePath]);

  const fetchFiles = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const filesData = await getFilesWithUrls(storagePath);
      
      // Get additional metadata for each file
      const filesWithMetadata = await Promise.all(
        filesData.map(async (file) => {
          try {
            const metadata = await getFileMetadata(file.fullPath);
            return {
              ...file,
              contentType: metadata.contentType,
              size: metadata.size,
              timeCreated: metadata.timeCreated,
              updated: metadata.updated
            };
          } catch (err) {
            // If metadata fetch fails, return file without metadata
            return file;
          }
        })
      );
      
      setFiles(filesWithMetadata);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files from storage');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = (file: StorageFile): void => {
    setSelectedFile(file);
    if (onSelectFile) {
      onSelectFile(file);
    }
  };

  const isImage = (contentType?: string | null): boolean => {
    return Boolean(contentType && contentType.startsWith('image/'));
  };

  const renderFileItem = ({ item }: ListRenderItemInfo<StorageFile>) => {
    const isFileImage = isImage(item.contentType ?? '');
    
    return (
      <TouchableOpacity 
        style={[
          styles.fileItem, 
          selectedFile?.name === item.name && styles.selectedFileItem
        ]}
        onPress={() => handleSelectFile(item)}
      >
        <View style={styles.fileInfo}>
          {showImages && isFileImage && (
            <View style={styles.thumbnailContainer}>
              <Image 
                source={{ uri: item.downloadURL }} 
                style={styles.thumbnail} 
                resizeMode="cover"
              />
            </View>
          )}
          
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
              {item.name}
            </Text>
            
            {item.contentType && (
              <Text style={styles.fileType}>
                {item.contentType}
              </Text>
            )}
            
            {item.size !== undefined && (
              <Text style={styles.fileSize}>
                {formatFileSize(item.size)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading files...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchFiles}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (files.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No files found in this location</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.fullPath}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingVertical: 8,
  },
  fileItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedFileItem: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
    borderWidth: 1,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 50,
    height: 50,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#888',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#ff4d4f',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default StorageFilesList; 
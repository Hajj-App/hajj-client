import React, { useState, FC } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { downloadFile } from '../utils/storageUtils';
import { FilePreviewProps } from '../utils/storageTypes';

/**
 * Component to preview different file types from Firebase Storage
 */
const FilePreview: FC<FilePreviewProps> = ({ file }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);

  if (!file) {
    return (
      <View style={styles.container}>
        <Text style={styles.noFileText}>No file selected</Text>
      </View>
    );
  }

  const { width } = Dimensions.get('window');
  const previewWidth = width * 0.9;
  const previewHeight = previewWidth * 0.75;

  const isImage = file.contentType?.startsWith('image/');
  const isPdf = file.contentType === 'application/pdf';
  const isVideo = file.contentType?.startsWith('video/');
  const isAudio = file.contentType?.startsWith('audio/');
  const isText = file.contentType?.startsWith('text/');

  const handleDownload = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // For text files, videos, PDFs, etc., we may need to download them first
      if (!isImage) {
        const blob = await downloadFile(file.fullPath);
        
        // Convert blob to a local URI via FileSystem
        const fileUri = FileSystem.documentDirectory + file.name;
        const fileString = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to read file as data URL'));
            }
          };
          reader.onerror = reject;
        });
        
        // Write the file to the local filesystem
        await FileSystem.writeAsStringAsync(
          fileUri,
          fileString.split(',')[1],
          { encoding: FileSystem.EncodingType.Base64 }
        );
        
        setLocalUri(fileUri);
      }
    } catch (err) {
      console.error('Error downloading file for preview:', err);
      setError('Failed to download file for preview');
    } finally {
      setLoading(false);
    }
  };

  // Rendering the preview based on file type
  const renderPreview = () => {
    if (loading) {
      return (
        <View style={[styles.previewContainer, { height: previewHeight }]}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Preparing preview...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.previewContainer, { height: previewHeight }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleDownload}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isImage) {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: file.downloadURL }}
            style={[styles.image, { width: previewWidth, height: previewHeight }]}
            resizeMode="contain"
          />
        </View>
      );
    }

    if (isPdf) {
      return (
        <View style={[styles.previewContainer, { height: previewHeight }]}>
          <WebView
            source={{ uri: file.downloadURL }}
            style={{ width: previewWidth, height: previewHeight }}
          />
        </View>
      );
    }

    if (isVideo && localUri) {
      return (
        <View style={[styles.previewContainer, { height: previewHeight }]}>
          <WebView
            source={{ uri: localUri }}
            style={{ width: previewWidth, height: previewHeight }}
          />
        </View>
      );
    }

    if (isAudio && localUri) {
      return (
        <View style={[styles.previewContainer, { height: 100 }]}>
          <WebView
            source={{ uri: localUri }}
            style={{ width: previewWidth, height: 100 }}
          />
        </View>
      );
    }

    if (isText && localUri) {
      return (
        <View style={[styles.previewContainer, { height: previewHeight }]}>
          <WebView
            source={{ uri: localUri }}
            style={{ width: previewWidth, height: previewHeight }}
          />
        </View>
      );
    }

    // Default preview (or unsupported file type)
    return (
      <View style={[styles.previewContainer, { height: previewHeight }]}>
        <Text style={styles.fileTypeText}>{file.contentType || 'Unknown file type'}</Text>
        <Text style={styles.fileNameText}>{file.name}</Text>
        
        {!localUri && (
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <Text style={styles.downloadButtonText}>Download for Preview</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.previewTitle}>File Preview</Text>
      {renderPreview()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  previewContainer: {
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#f0f0f0',
  },
  fileTypeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  fileNameText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
    textAlign: 'center',
  },
  noFileText: {
    color: '#888',
    fontSize: 16,
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
  downloadButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: '500',
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

export default FilePreview; 
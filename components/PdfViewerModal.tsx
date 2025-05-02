import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { AntDesign } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { downloadFile } from '../utils/storageUtils';

interface PdfViewerModalProps {
  visible: boolean;
  pdfUrl: string;
  onClose: () => void;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  visible,
  pdfUrl,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      const blob = await downloadFile(pdfUrl);
      
      // Convert blob to a local URI via FileSystem
      const fileName = pdfUrl.split('/').pop() || 'document.pdf';
      const fileUri = FileSystem.documentDirectory + fileName;
      
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
    } catch (err) {
      console.error('Error handling PDF:', err);
      setError('Failed to load PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && pdfUrl) {
      handleDownload();
    }
  }, [visible, pdfUrl]);

  // Clean up local file when modal is closed
  useEffect(() => {
    return () => {
      if (localUri) {
        FileSystem.deleteAsync(localUri, { idempotent: true })
          .catch(err => console.error('Error cleaning up PDF file:', err));
      }
    };
  }, [localUri]);

  const renderWebView = () => {
    if (!localUri) return null;

    // Create a simple HTML wrapper for the PDF
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
            embed { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <embed src="${localUri}" type="application/pdf" />
        </body>
      </html>
    `;

    return (
      <WebView
        source={{ html }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#34D399" />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setError('Failed to display PDF. Please try again.');
        }}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Document Viewer</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#34D399" />
              <Text style={styles.loadingText}>Loading document...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleDownload}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderWebView()
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    margin: 20,
    marginTop: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#34D399',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PdfViewerModal; 
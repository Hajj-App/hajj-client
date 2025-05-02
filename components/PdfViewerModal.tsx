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
import { Share } from 'react-native';


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
  const [pdfData, setPdfData] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      const blob = await downloadFile(pdfUrl);
      
      // Convert blob to base64
      const base64 = await new Promise<string>((resolve, reject) => {
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
      
      setPdfData(base64);
    } catch (err) {
      console.error('Error handling PDF:', err);
      setError('Failed to load PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this PDF: ${pdfUrl}`,
        url: pdfUrl, // Some platforms use this
        title: 'Shared PDF',
      });
    } catch (error) {
      console.error('Error sharing PDF:', error);
    }
  };
  

  useEffect(() => {
    if (visible && pdfUrl) {
      handleDownload();
    }
  }, [visible, pdfUrl]);

  const renderWebView = () => {
    if (!pdfUrl) return null;
  
    const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;
  
    return (
    <WebView
  source={{ uri: googleDocsUrl }} // or Google Docs URL if used
  style={{ flex: 1, margin: 5 }}
  containerStyle={{ borderRadius: 8 }}
  scalesPageToFit={true}
  bounces={false}
  startInLoadingState
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

            {/* share button */}
            <View className='flex items-center flex-row gap-8'>

            <TouchableOpacity onPress={handleShare} style={{ marginRight:1 }}>
                    <AntDesign name="sharealt" size={20} color="black" />
              </TouchableOpacity>
              {/* close button */}
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>

            </View>

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
    margin: 10,
    marginTop: 10,
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
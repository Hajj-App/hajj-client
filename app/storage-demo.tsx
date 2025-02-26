import React, { useState, FC } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import StorageFilesList from '../components/StorageFilesList';
import FilePreview from '../components/FilePreview';
import { StorageFile } from '../utils/storageTypes';

export default function StorageDemo() {
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  
  const handleSelectFile = (file: StorageFile): void => {
    console.log('Selected file:', file);
    setSelectedFile(file);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Firebase Storage Demo</Text>
        <Text style={styles.description}>
          Fetching and displaying files from Firebase Storage
        </Text>
        
        <View style={styles.mainContainer}>
          <View style={styles.filesContainer}>
            <Text style={styles.sectionTitle}>Files from Storage:</Text>
            
            <StorageFilesList 
              storagePath="hajj-app-images" 
              onSelectFile={handleSelectFile}
              showImages={true}
            />
          </View>
          
          <View style={styles.previewContainer}>
            <FilePreview file={selectedFile} />
          </View>
        </View>
        
        <Text style={styles.note}>
          Note: Make sure to replace the Firebase configuration in utils/firebase.ts
          with your own Firebase project configuration.
        </Text>
      </ScrollView>
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  mainContainer: {
    flex: 1,
    marginBottom: 16,
  },
  filesContainer: {
    minHeight: 300,
    marginBottom: 20,
  },
  previewContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ref, listAll, getDownloadURL, getMetadata, StorageReference } from 'firebase/storage';
import { storage } from '@/utils/firebase';
import { signInAnonymousUser } from '@/utils/firebase';
import ShimmerPlaceholder, { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'expo-linear-gradient';

const Shimmer = createShimmerPlaceholder(LinearGradient as unknown as React.ComponentClass<any>);

type Advisory = {
  id: string;
  title: string;
  date: string;
  description: string;
  lastModified: string;
};

const TravelAdvisories = () => {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvisories = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }

      await signInAnonymousUser();

      const advisoriesRef: StorageReference = ref(storage, 'travel_advisories/');
      const result = await listAll(advisoriesRef);

      const advisoryPromises = result.prefixes.map(async (folderRef) => {
        try {
          const folderItems = await listAll(folderRef);
          const advisoryFile = folderItems.items.find(item => 
            item.name === 'advisory_data.json'
          );

          if (advisoryFile) {
            const [url, metadata] = await Promise.all([
              getDownloadURL(advisoryFile),
              getMetadata(advisoryFile),
            ]);
            const response = await fetch(url);
            const data = await response.json();

            return {
              ...data,
              id: `${folderRef.name}-${metadata.name}`,
              lastModified: metadata.updated,
            };
          }
        } catch (err) {
          console.error(`Error processing folder ${folderRef.name}:`, err);
          return null;
        }
        return null;
      });

      const loadedAdvisories = (await Promise.all(advisoryPromises))
        .filter((adv): adv is Advisory => adv !== null);

      setAdvisories(loadedAdvisories);
    } catch (err) {
      console.error('Error fetching advisories:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to load travel advisories'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisories();
  }, []);

  const renderShimmerAdvisory = () => (
    <View style={styles.advisoryItem}>
      <View style={styles.advisoryHeader}>
        <Shimmer 
          style={{ width: '60%', height: 20, marginBottom: 8 }}
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <Shimmer 
          style={{ width: '30%', height: 16 }}
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
      </View>
      <Shimmer 
        style={{ width: '100%', height: 16, marginBottom: 4 }}
        shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      />
      <Shimmer 
        style={{ width: '90%', height: 16, marginBottom: 4 }}
        shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      />
      <Shimmer 
        style={{ width: '80%', height: 16, marginBottom: 4 }}
        shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      />
      <Shimmer 
        style={{ width: '40%', height: 14, marginTop: 8 }}
        shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.section}>
         <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Travel Advisories</Text>
      
        {[1, 2, 3].map((_, index) => (
          <React.Fragment key={index}>
            {renderShimmerAdvisory()}
          </React.Fragment>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchAdvisories}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Travel Advisories</Text>

      {advisories.length > 0 ? (
        advisories.map((advisory) => (
          <View key={advisory.id} style={styles.advisoryItem}>
            <View style={styles.advisoryHeader}>
              <Text style={styles.advisoryTitle}>{advisory.title}</Text>
              <Text style={styles.advisoryDate}>{advisory.date}</Text>
            </View>
            <Text style={styles.advisoryDescription}>{advisory.description}</Text>
            {advisory.lastModified && (
              <Text style={styles.lastUpdated}>
                Last updated: {new Date(advisory.lastModified).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noAdvisoriesText}>No travel advisories available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
    height: 28, // Added for shimmer
  },
  advisoryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  advisoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  advisoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  advisoryDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 10,
  },
  advisoryDescription: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginTop: 6,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noAdvisoriesText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontStyle: 'italic',
    marginVertical: 20,
  },
});

export default TravelAdvisories;
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  Dimensions, 
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { storage } from '@/utils/firebase';
import { signInAnonymousUser } from '@/utils/firebase';

const { width: screenWidth } = Dimensions.get('window');

type UpdateItem = {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl?: string;
  lastModified?: string;
};

const LatestUpdates = () => {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      } 

      await signInAnonymousUser();

      const updatesRef = ref(storage, 'live_updates/');
      const result = await listAll(updatesRef);

      const updatePromises = result.prefixes.map(async (folderRef) => {
        try {
          const folderItems = await listAll(folderRef);
          
          // Find both the JSON data file and any image
          const updateFile = folderItems.items.find(item => 
            item.name === 'update_data.json'
          );
          
          const imageFile = folderItems.items.find(item => 
            item.name.startsWith('image_')
          );

          if (updateFile) {
            const [dataUrl, metadata, imageUrl] = await Promise.all([
              getDownloadURL(updateFile),
              getMetadata(updateFile),
              imageFile ? getDownloadURL(imageFile) : Promise.resolve(null)
            ]);

            const response = await fetch(dataUrl);
            const data = await response.json();

            return {
              ...data,
              id: `${folderRef.name}-${metadata.name}`,
              lastModified: metadata.updated,
              imageUrl: imageUrl || undefined
            };
          }
        } catch (err) {
          console.error(`Error processing folder ${folderRef.name}:`, err);
          return null;
        }
        return null;
      });

      const loadedUpdates = (await Promise.all(updatePromises))
        .filter((update): update is UpdateItem => update !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setUpdates(loadedUpdates);
    } catch (err) {
      console.error('Error fetching updates:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to load live updates'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / (screenWidth - 60));
    setActiveSlide(currentIndex);
  };

  const renderUpdate = ({ item }: { item: UpdateItem }) => (
    <View style={styles.updateItem}>
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.updateImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.updateContent}>
        <View style={styles.updateHeader}>
          <Text style={styles.updateTitle}>{item.title}</Text>
          <Text style={styles.updateDate}>{item.date}</Text>
        </View>
        <Text style={styles.updateDescription}>{item.description}</Text>
        {item.lastModified && (
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(item.lastModified).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
        <Text style={styles.loadingText}>Loading updates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchUpdates}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Latest Updates</Text>

      {updates.length > 0 ? (
        <>
          <FlatList
            ref={carouselRef}
            data={updates}
            renderItem={renderUpdate}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={screenWidth - 60}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={handleScroll}
          />
          <View style={styles.pagination}>
            {updates.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { 
                    backgroundColor: index === activeSlide ? '#31C462' : '#D9D9D9',
                    width: index === activeSlide ? 12 : 8,
                  }
                ]}
              />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.noUpdatesText}>No updates available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 20,
    color: '#2c3e50',
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  updateItem: {
    width: screenWidth - 60,
    marginRight: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  updateImage: {
    width: '100%',
    height: 150,
  },
  updateContent: {
    padding: 16,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  updateDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginLeft: 10,
  },
  updateDescription: {
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
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
  noUpdatesText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontStyle: 'italic',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
});

export default LatestUpdates;
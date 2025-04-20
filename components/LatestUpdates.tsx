import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  Dimensions, 
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { storage } from '@/utils/firebase';
import { signInAnonymousUser } from '@/utils/firebase';
import ShimmerPlaceholder, { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const Shimmer = createShimmerPlaceholder(LinearGradient as unknown as React.ComponentClass<any>);

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
  const scrollInterval = useRef<NodeJS.Timeout>();
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  // Auto-scroll functionality
  useEffect(() => {
    if (updates.length > 1) {
      scrollInterval.current = setInterval(() => {
        setActiveSlide(prev => {
          const nextSlide = prev === updates.length - 1 ? 0 : prev + 1;
          carouselRef.current?.scrollToIndex({
            index: nextSlide,
            animated: true
          });
          return nextSlide;
        });
      }, 3000); // Change slide every 3 seconds
    }
    
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, [updates.length]);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / (screenWidth - 60));
    setActiveSlide(currentIndex);
  };

  const openModal = (item: UpdateItem) => {
    setSelectedUpdate(item);
    setModalVisible(true);
    // Pause auto-scrolling when modal is open
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    // Resume auto-scrolling when modal is closed
    if (updates.length > 1) {
      scrollInterval.current = setInterval(() => {
        setActiveSlide(prev => {
          const nextSlide = prev === updates.length - 1 ? 0 : prev + 1;
          carouselRef.current?.scrollToIndex({
            index: nextSlide,
            animated: true
          });
          return nextSlide;
        });
      }, 3000);
    }
  };

  const renderUpdate = ({ item }: { item: UpdateItem }) => (
    <TouchableOpacity 
      style={styles.carouselItem}
      activeOpacity={0.9}
      onPress={() => openModal(item)}
    >
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.carouselImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.carouselContent}>
        <Text style={styles.carouselTitle}>{item.title}</Text>
        <Text style={styles.carouselDate}>{item.date}</Text>
        <Text style={styles.carouselDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderShimmerItem = () => (
    <View style={styles.carouselItem}>
      <Shimmer 
        style={styles.carouselImage} 
        shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      />
      <View style={styles.carouselContent}>
        <Shimmer 
          style={{ width: '70%', height: 20, marginBottom: 8 }} 
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <Shimmer 
          style={{ width: '40%', height: 16, marginBottom: 12 }} 
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <Shimmer 
          style={{ width: '100%', height: 14, marginBottom: 4 }} 
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <Shimmer 
          style={{ width: '90%', height: 14, marginBottom: 4 }} 
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <Shimmer 
          style={{ width: '80%', height: 14 }} 
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.section}>
        {/* Title is shown normally while content loads */}
        <Text style={styles.sectionTitle}>Latest Updates</Text>
        
        {/* Only the content has shimmer effect */}
        <FlatList
          data={[1, 2, 3]} // Render 3 shimmer items
          renderItem={renderShimmerItem}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={screenWidth - 60}
          snapToAlignment="center"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          getItemLayout={(_, index) => ({
            length: screenWidth - 60,
            offset: (screenWidth - 60) * index,
            index,
          })}
        />
        <View style={styles.paginationContainer}>
          {[1, 2, 3].map((_, index) => (
            <Shimmer
              key={index}
              style={styles.paginationDot}
              shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
            />
          ))}
        </View>
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
            contentContainerStyle={{ paddingHorizontal: 20 }}
            onMomentumScrollEnd={handleScroll}
            initialScrollIndex={0}
            getItemLayout={(_, index) => ({
              length: screenWidth - 60,
              offset: (screenWidth - 60) * index,
              index,
            })}
          />
          <View style={styles.paginationContainer}>
            {updates.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { backgroundColor: index === activeSlide ? '#31C462' : '#D9D9D9' }
                ]}
              />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.noUpdatesText}>No updates available</Text>
      )}

      {/* Detailed View Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar backgroundColor="#31C462" barStyle="light-content" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Details</Text>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedUpdate?.imageUrl && (
              <Image 
                source={{ uri: selectedUpdate.imageUrl }} 
                style={styles.modalImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.modalBody}>
              <Text style={styles.modalUpdateTitle}>{selectedUpdate?.title}</Text>
              <Text style={styles.modalUpdateDate}>{selectedUpdate?.date}</Text>
              <Text style={styles.modalUpdateDescription}>
                {selectedUpdate?.description}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  carouselItem: {
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: screenWidth - 60,
    marginRight: 20,
  },
  carouselImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  carouselContent: {
    padding: 15,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  carouselDate: {
    fontSize: 14,
    color: '#31C462',
    marginBottom: 8,
  },
  carouselDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
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
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    backgroundColor: '#31C462',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalBody: {
    padding: 20,
  },
  modalUpdateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalUpdateDate: {
    fontSize: 16,
    color: '#31C462',
    marginBottom: 15,
  },
  modalUpdateDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default LatestUpdates;
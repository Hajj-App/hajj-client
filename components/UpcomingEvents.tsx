import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Dimensions
} from 'react-native';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '@/utils/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import ShimmerPlaceholder, { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const Shimmer = createShimmerPlaceholder(LinearGradient as unknown as React.ComponentClass<any>);

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  lastModified?: string;
};

const UpcomingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }

      const eventsRef = ref(storage, 'upcoming_events/');
      const result = await listAll(eventsRef);

      const eventPromises = result.prefixes.map(async (folderRef) => {
        try {
          const folderItems = await listAll(folderRef);
          const eventFile = folderItems.items.find(item => 
            item.name === 'event_data.json'
          );

          if (eventFile) {
            const downloadURL = await getDownloadURL(eventFile);
            const response = await fetch(downloadURL);
            const data = await response.json();
            return {
              ...data,
              id: folderRef.name
            };
          }
        } catch (err) {
          console.error(`Error processing folder ${folderRef.name}:`, err);
          return null;
        }
        return null;
      });

      const loadedEvents = (await Promise.all(eventPromises))
        .filter((event): event is Event => event !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(loadedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to load upcoming events'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / (screenWidth - 60));
    setActiveSlide(currentIndex);
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventIconContainer}>
        <MaterialIcons name="event" size={24} color="#31C462" />
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>{item.date}</Text>
        <Text style={styles.eventLocation}>{item.description}</Text>
      </View>
    </View>
  );

  const renderShimmerItem = () => (
    <View style={styles.eventItem}>
      <Shimmer 
        style={styles.eventIconContainer} 
        shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      >
        <View style={{ width: 24, height: 24 }} />
      </Shimmer>
      <View style={styles.eventContent}>
        <Shimmer 
          style={{ width: '70%', height: 18, marginBottom: 8 }} 
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <Shimmer 
          style={{ width: '50%', height: 14, marginBottom: 6 }} 
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <Shimmer 
          style={{ width: '90%', height: 14 }} 
          shimmerColors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.section}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Upcoming Events</Text>
        <FlatList
          data={[1, 2, 3]} // Render 3 shimmer items
          renderItem={renderShimmerItem}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={screenWidth - 60}
          snapToAlignment="center"
          contentContainerStyle={styles.carouselContent}
          getItemLayout={(_, index) => ({
            length: screenWidth - 60,
            offset: (screenWidth - 60) * index,
            index,
          })}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchEvents}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>

      {events.length > 0 ? (
        <>
          <FlatList
            ref={carouselRef}
            data={events}
            renderItem={renderEvent}
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
        </>
      ) : (
        <Text style={styles.noEventsText}>No upcoming events scheduled</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
    color: '#333',
    height: 24, // Added height for shimmer
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: screenWidth - 80,
  },
  eventIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(49, 196, 98, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  eventDate: {
    fontSize: 14,
    color: '#31C462',
    marginBottom: 3,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#31C462',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  noEventsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});

export default UpcomingEvents;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ref, listAll, getDownloadURL, StorageReference } from 'firebase/storage';
import { storage } from '@/utils/firebase'; // Ensure this utility initializes `storage`
import { signInAnonymousUser } from '@/utils/firebase'; // Anonymous authentication utility

type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
};

const UpcomingEvents = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure Firebase storage is initialized
      if (!storage) {
        throw new Error('Firebase Storage is not initialized.');
      }

      // Sign in anonymously
      await signInAnonymousUser();

      // Reference to the upcoming events folder in Firebase Storage
      const eventsRef: StorageReference = ref(storage, 'upcoming_events/');
      const result = await listAll(eventsRef);

      // Fetch all events
      const eventPromises = result.items.map(async (itemRef) => {
        try {
          const url = await getDownloadURL(itemRef); // Get the event file URL
          const response = await fetch(url); // Fetch the file content
          const data = await response.json();

          // Use the file name (without extension) as a unique ID
          return {
            id: itemRef.name.split('.')[0],
            ...data,
          };
        } catch (err) {
          console.error(`Error processing event ${itemRef.name}:`, err);
          return null;
        }
      });

      // Resolve all promises and filter out any null results
      const loadedEvents = (await Promise.all(eventPromises)).filter(
        (event): event is Event => event !== null
      );

      setUpcomingEvents(loadedEvents);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load upcoming events.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>{item.date}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
        <Text style={styles.loadingText}>Loading upcoming events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUpcomingEvents}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      {upcomingEvents.length > 0 ? (
        <FlatList
          data={upcomingEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
        />
      ) : (
        <Text style={styles.noEventsText}>No upcoming events available.</Text>
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
  },
  eventItem: {
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
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  eventDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#34495e',
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
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
    color: '#ffffff',
    fontWeight: '600',
  },
  noEventsText: {
    textAlign: 'center',
    color: '#95a5a6',
    fontStyle: 'italic',
    marginVertical: 20,
  },
});

export default UpcomingEvents;

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  Linking,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { firestore } from "@/utils/firebase";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import LinearGradient from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const { width: screenWidth } = Dimensions.get("window");
const CACHE_KEY = "upcomingEventsCache";
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes cache

const Shimmer = createShimmerPlaceholder(
  LinearGradient as unknown as React.ComponentClass<any>
);

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  url?: string;
  lastModified?: string;
  isNew?: boolean;
  order: number;
};

const BlinkingNewIndicator = () => {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity((prev) => (prev === 1 ? 0.7 : 1));
    }, 1000); // Blink every second
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.newIndicator, { opacity }]}>
      <Text style={styles.newIndicatorText}>NEW</Text>
    </View>
  );
};

const EventModal = ({
  event,
  visible,
  onClose,
}: {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!event) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{event.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalField}>
              <MaterialIcons
                name="date-range"
                size={20}
                color="#31C462"
                style={styles.modalIcon}
              />
              <Text style={styles.modalText}>{event.date}</Text>
            </View>

            {event.location && (
              <View style={styles.modalField}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color="#31C462"
                  style={styles.modalIcon}
                />
                <Text style={styles.modalText}>{event.location}</Text>
              </View>
            )}

            <View style={styles.modalDescription}>
              <Text style={styles.modalDescriptionText}>{event.description}</Text>
            </View>

            {/* {event.url && (
              <View style={styles.modalField}>
                <MaterialIcons
                  name="link"
                  size={20}
                  color="#31C462"
                  style={styles.modalIcon}
                />
                <Text 
                  style={[styles.modalText, { color: '#31C462' }]}
                  onPress={() => Linking.openURL(event.url!)}
                >
                  {event.url}
                </Text>
              </View>
            )} */}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const UpcomingEvents = React.memo(() => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const scrollInterval = useRef<number>();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Cache helper functions
  const getCachedData = async (key: string): Promise<Event[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  };

  const setCachedData = async (key: string, data: Event[]): Promise<void> => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error writing to cache:", error);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = await getCachedData(CACHE_KEY);
      if (cachedData) {
        setEvents(cachedData);
        setLoading(false);
      }

      if (!firestore) {
        throw new Error("Firebase is not initialized");
      }

      const eventsRef = collection(firestore, "upcoming_events");
      const q = query(eventsRef, orderBy("order", "asc"));
      const querySnapshot = await getDocs(q);

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const loadedEvents = querySnapshot.docs.map((doc) => {
        const eventData = doc.data();
        const eventDate = eventData.lastModified
          ? new Date(eventData.lastModified)
          : new Date();
        return {
          id: doc.id,
          ...eventData,
          isNew: eventDate > twentyFourHoursAgo,
        } as Event;
      });

      // Update cache
      await setCachedData(CACHE_KEY, loadedEvents);
      setEvents(loadedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load upcoming events"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-scroll functionality
  const startAutoScroll = useCallback(() => {
    if (events.length > 1) {
      scrollInterval.current = setInterval(() => {
        setActiveSlide((prev) => {
          const nextSlide = prev === events.length - 1 ? 0 : prev + 1;
          carouselRef.current?.scrollToIndex({
            index: nextSlide,
            animated: true,
          });
          return nextSlide;
        });
      }, 5000); // Change slide every 5 seconds
    }
  }, [events.length]);

  useEffect(() => {
    fetchEvents();

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchEvents, CACHE_EXPIRY);
    return () => {
      clearInterval(refreshInterval);
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, [fetchEvents]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, [startAutoScroll]);

  const handleScroll = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffset / (screenWidth - 60));
    setActiveSlide(currentIndex);
  }, []);

  const handleEventPress = useCallback((event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedEvent(null);
  }, []);

  const renderEvent = useCallback(
    ({ item }: { item: Event }) => (
      <Pressable
        style={styles.eventItem}
        onPress={() => handleEventPress(item)}
      >
        {item.isNew && <BlinkingNewIndicator />}
        <View style={styles.eventIconContainer}>
          <MaterialIcons name="event" size={24} color="#31C462" />
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.eventDate}>{item.date}</Text>
          <Text style={styles.eventLocation} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </Pressable>
    ),
    [handleEventPress]
  );

  const renderShimmerItem = useCallback(
    () => (
      <View style={styles.eventItem}>
        <Shimmer
          style={styles.eventIconContainer}
          shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
        >
          <View style={{ width: 24, height: 24 }} />
        </Shimmer>
        <View style={styles.eventContent}>
          <Shimmer
            style={styles.shimmerTitle}
            shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
          />
          <Shimmer
            style={styles.shimmerDate}
            shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
          />
          <Shimmer
            style={styles.shimmerDescription}
            shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
          />
        </View>
      </View>
    ),
    []
  );

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("upcomingEvents")}</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("upcomingEvents")}</Text>

      {/* Modal for event details */}
      <EventModal
        event={selectedEvent}
        visible={modalVisible}
        onClose={closeModal}
      />

      {loading ? (
        <FlatList
          data={Array(3).fill(null)}
          renderItem={renderShimmerItem}
          keyExtractor={(_, index) => index.toString()}
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
      ) : events.length > 0 ? (
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
            windowSize={3}
            maxToRenderPerBatch={3}
            updateCellsBatchingPeriod={100}
            initialNumToRender={3}
          />
          {events.length > 1 && (
            <View style={styles.paginationContainer}>
              {events.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor:
                        index === activeSlide ? "#31C462" : "#D9D9D9",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.noEventsText}>
          {t("noUpcomingEventsScheduled")}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    paddingHorizontal: 20,
    color: "#333",
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  eventItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: screenWidth - 80,
    marginBottom: 5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  eventIconContainer: {
    width: 50,
    height: "auto",
    borderRadius: 5,
    backgroundColor: "rgba(49, 196, 98, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  eventDate: {
    fontSize: 14,
    color: "#31C462",
    marginBottom: 3,
  },
  eventLocation: {
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#ffeeee",
    borderRadius: 8,
    marginHorizontal: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: "#31C462",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  noEventsText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    paddingHorizontal: 20,
  },
  shimmerTitle: {
    width: "70%",
    height: 18,
    marginBottom: 8,
  },
  shimmerDate: {
    width: "50%",
    height: 14,
    marginBottom: 6,
  },
  shimmerDescription: {
    width: "90%",
    height: 14,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  newIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF5722",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  newIndicatorText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  modalField: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalIcon: {
    marginRight: 10,
  },
  modalText: {
    fontSize: 16,
    color: "#555",
  },
  modalDescription: {
    marginTop: 8,
    marginBottom: 16,
  },
  modalDescriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  urlButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 8,
  },
  urlButtonText: {
    color: "#31C462",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 6,
  },
});

export default UpcomingEvents;

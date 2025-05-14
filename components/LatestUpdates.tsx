import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { firestore } from "@/utils/firebase";
import { signInAnonymousUser } from "@/utils/firebase";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import LinearGradient from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const { width: screenWidth } = Dimensions.get("window");
const CACHE_KEY = "latestUpdatesCache";
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes cache

const Shimmer = createShimmerPlaceholder(
  LinearGradient as unknown as React.ComponentClass<any>
);

type UpdateItem = {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl?: string;
  order: number;
};

const LatestUpdates = () => {
  const { t } = useTranslation();
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const scrollInterval = useRef<number | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<UpdateItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Cache helper functions
  const getCachedData = async (key: string): Promise<UpdateItem[] | null> => {
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

  const setCachedData = async (key: string, data: UpdateItem[]): Promise<void> => {
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

  // Memoized fetch function with caching
  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = await getCachedData(CACHE_KEY);
      if (cachedData) {
        setUpdates(cachedData);
        setLoading(false);
      }

      if (!firestore) {
        throw new Error("Firebase is not initialized");
      }

      await signInAnonymousUser();

      const updatesRef = collection(firestore, 'live_updates');
      const q = query(updatesRef, orderBy("order", "desc"));
      const querySnapshot = await getDocs(q);

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const loadedUpdates = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const updateDate = data.lastModified 
          ? new Date(data.lastModified)
          : new Date();
        return {
          id: doc.id,
          title: data.title || '',
          date: data.date || '',
          description: data.description || '',
          order: data.order || 0,
          imageUrl: data.imageUrl,
          isNew: updateDate > twentyFourHoursAgo,
        } as UpdateItem;
      });

      // Update cache
      await setCachedData(CACHE_KEY, loadedUpdates);
      setUpdates(loadedUpdates);
    } catch (err) {
      console.error("Error fetching updates:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load live updates"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-scroll functionality with cleanup
  const startAutoScroll = useCallback(() => {
    if (updates.length > 1) {
      scrollInterval.current = setInterval(() => {
        setActiveSlide((prev) => {
          const nextSlide = prev === updates.length - 1 ? 0 : prev + 1;
          carouselRef.current?.scrollToIndex({
            index: nextSlide,
            animated: true,
          });
          return nextSlide;
        });
      }, 5000);
    }
  }, [updates.length]);

  useEffect(() => {
    fetchUpdates();

    // Refresh data periodically
    const refreshInterval = setInterval(fetchUpdates, CACHE_EXPIRY);
    return () => {
      clearInterval(refreshInterval);
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, [fetchUpdates]);

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

  const openModal = useCallback((item: UpdateItem) => {
    setSelectedUpdate(item);
    setModalVisible(true);
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    startAutoScroll();
  }, [startAutoScroll]);

  // Memoized components for better performance
  const renderUpdate = useCallback(
    ({ item }: { item: UpdateItem }) => (
      <TouchableOpacity
        style={styles.carouselItem}
        activeOpacity={0.9}
        onPress={() => openModal(item)}
      >

        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.carouselImage}
            resizeMode="cover"
            progressiveRenderingEnabled
          />
        ) : (
          <View style={[styles.carouselImage, styles.imagePlaceholder]}>
            <AntDesign name="picture" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.carouselContent}>
          <Text style={styles.carouselTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.carouselDate}>{item.date}</Text>
          <Text style={styles.carouselDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [openModal]
  );

  const renderShimmerItem = useCallback(
    () => (
      <View style={styles.carouselItem}>
        <Shimmer
          style={styles.carouselImage}
          shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
        />
        <View style={styles.carouselContent}>
          <Shimmer
            style={styles.shimmerTitle}
            shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
          />
          <Shimmer
            style={styles.shimmerDate}
            shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
          />
          <Shimmer
            style={styles.shimmerDescLine1}
            shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
          />
          <Shimmer
            style={styles.shimmerDescLine2}
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
        <Text style={styles.sectionTitle}>{t("latestUpdates")}</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUpdates}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("latestUpdates")}</Text>

      {loading ? (
        <>
          <FlatList
            data={Array(3).fill(null)}
            renderItem={renderShimmerItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={screenWidth - 60}
            snapToAlignment="center"
            contentContainerStyle={styles.carouselContentContainer}
            getItemLayout={(_, index) => ({
              length: screenWidth - 60,
              offset: (screenWidth - 60) * index,
              index,
            })}
          />
          <View style={styles.paginationContainer}>
            {[0, 1, 2].map((index) => (
              <Shimmer
                key={index}
                style={styles.paginationDot}
                shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
              />
            ))}
          </View>
        </>
      ) : updates.length > 0 ? (
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
            contentContainerStyle={styles.carouselContentContainer}
            onMomentumScrollEnd={handleScroll}
            initialScrollIndex={0}
            windowSize={3}
            maxToRenderPerBatch={3}
            updateCellsBatchingPeriod={100}
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
                  {
                    backgroundColor:
                      index === activeSlide ? "#31C462" : "#D9D9D9",
                  },
                ]}
              />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.noUpdatesText}>{t("noUpdatesAvailable")}</Text>
      )}

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar backgroundColor="#31C462" barStyle="light-content" />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <AntDesign name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t("updateDetails")}</Text>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {selectedUpdate?.imageUrl ? (
              <Image
                source={{ uri: selectedUpdate.imageUrl }}
                style={styles.modalImage}
                resizeMode="cover"
                progressiveRenderingEnabled
              />
            ) : (
              <View style={[styles.modalImage, styles.imagePlaceholder]}>
                <AntDesign name="picture" size={60} color="#ccc" />
              </View>
            )}
            <View style={styles.modalBody}>
              <Text style={styles.modalUpdateTitle}>
                {selectedUpdate?.title}
              </Text>
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    paddingHorizontal: 20,
    color: "#333",
  },
  carouselItem: {
    backgroundColor: "white",
    borderRadius: 15,
    overflow: "hidden",
    width: screenWidth - 60,
    marginRight: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  carouselImage: {
    width: "100%",
    height: 180,
  },
  imagePlaceholder: {
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  carouselContent: {
    padding: 15,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  carouselDate: {
    fontSize: 14,
    color: "#31C462",
    marginBottom: 8,
  },
  carouselDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  carouselContentContainer: {
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
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
    backgroundColor: "#ffeeee",
    borderRadius: 8,
    marginHorizontal: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#31C462",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  noUpdatesText: {
    textAlign: "center",
    color: "#95a5a6",
    fontStyle: "italic",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  // Shimmer styles
  shimmerTitle: {
    width: "70%",
    height: 20,
    marginBottom: 8,
  },
  shimmerDate: {
    width: "40%",
    height: 16,
    marginBottom: 12,
  },
  shimmerDescLine1: {
    width: "100%",
    height: 14,
    marginBottom: 4,
  },
  shimmerDescLine2: {
    width: "90%",
    height: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    backgroundColor: "#31C462",
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingBottom: 30,
  },
  modalImage: {
    width: "100%",
    height: 250,
  },
  modalBody: {
    padding: 20,
  },
  modalUpdateTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalUpdateDate: {
    fontSize: 16,
    color: "#31C462",
    marginBottom: 15,
  },
  modalUpdateDescription: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },

});

export default React.memo(LatestUpdates);

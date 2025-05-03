import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  ref,
  listAll,
  getDownloadURL,
  getMetadata,
  StorageReference,
} from "firebase/storage";
import { storage } from "@/utils/firebase";
import { signInAnonymousUser } from "@/utils/firebase";
import { createShimmerPlaceholder } from "react-native-shimmer-placeholder";
import LinearGradient from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
const Shimmer = createShimmerPlaceholder(
  LinearGradient as unknown as React.ComponentClass<any>
);

type Advisory = {
  id: string;
  title: string;
  date: string;
  description: string;
  lastModified: string;
};

const CACHE_KEY = "travelAdvisoriesCache";
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes cache

const TravelAdvisories = React.memo(() => {
  const { t } = useTranslation();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache helper functions
  const getCachedData = async (key: string): Promise<Advisory[] | null> => {
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

  const setCachedData = async (
    key: string,
    data: Advisory[]
  ): Promise<void> => {
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

  const fetchAdvisories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = await getCachedData(CACHE_KEY);
      if (cachedData) {
        setAdvisories(cachedData);
        setLoading(false);
      }

      if (!storage) {
        throw new Error("Firebase Storage is not initialized");
      }

      await signInAnonymousUser();

      const advisoriesRef: StorageReference = ref(
        storage,
        "travel_advisories/"
      );
      const result = await listAll(advisoriesRef);

      // Process folders in parallel
      const advisoryPromises = result.prefixes.map(async (folderRef) => {
        try {
          const folderItems = await listAll(folderRef);
          const advisoryFile = folderItems.items.find(
            (item) => item.name === "advisory_data.json"
          );

          if (!advisoryFile) return null;

          // Parallelize all async operations
          const [url, metadata] = await Promise.all([
            getDownloadURL(advisoryFile),
            getMetadata(advisoryFile),
          ]);

          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch advisory data");

          const data = await response.json();

          return {
            ...data,
            id: `${folderRef.name}-${metadata.updated}`,
            lastModified: metadata.updated,
          };
        } catch (err) {
          console.error(`Error processing folder ${folderRef.name}:`, err);
          return null;
        }
      });

      const loadedAdvisories = (await Promise.all(advisoryPromises)).filter(
        (adv): adv is Advisory => adv !== null
      );

      // Update cache
      await setCachedData(CACHE_KEY, loadedAdvisories);
      setAdvisories(loadedAdvisories);
    } catch (err) {
      console.error("Error fetching advisories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load travel advisories"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvisories();

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchAdvisories, CACHE_EXPIRY);
    return () => clearInterval(refreshInterval);
  }, [fetchAdvisories]);

  const renderShimmerAdvisory = useCallback(
    () => (
      <View style={styles.advisoryItem}>
        <View style={styles.advisoryHeader}>
          <Shimmer
            style={styles.shimmerTitle}
            shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
          />
          <Shimmer
            style={styles.shimmerDate}
            shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
          />
        </View>
        <Shimmer
          style={styles.shimmerDescLine1}
          shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
        />
        <Shimmer
          style={styles.shimmerDescLine2}
          shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
        />
        <Shimmer
          style={styles.shimmerDescLine3}
          shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
        />
        <Shimmer
          style={styles.shimmerLastUpdated}
          shimmerColors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
        />
      </View>
    ),
    []
  );

  const renderAdvisory = useCallback(
    (advisory: Advisory) => (
      <View key={advisory.id} style={styles.advisoryItem}>
        <View style={styles.advisoryHeader}>
          <Text style={styles.advisoryTitle} numberOfLines={1}>
            {advisory.title}
          </Text>
          <Text style={styles.advisoryDate}>{advisory.date}</Text>
        </View>
        <Text style={styles.advisoryDescription} numberOfLines={3}>
          {advisory.description}
        </Text>
        {advisory.lastModified && (
          <Text style={styles.lastUpdated}>
            {t("lastUpdated")}:{" "}
            {new Date(advisory.lastModified).toLocaleDateString()}
          </Text>
        )}
      </View>
    ),
    []
  );

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("travelAdvisories")}</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAdvisories}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t("travelAdvisories")}</Text>

      {loading ? (
        <>
          {[1, 2, 3].map((_, index) => (
            <React.Fragment key={`shimmer-${index}`}>
              {renderShimmerAdvisory()}
            </React.Fragment>
          ))}
        </>
      ) : advisories.length > 0 ? (
        <>{advisories.map(renderAdvisory)}</>
      ) : (
        <Text style={styles.noAdvisoriesText}>
          {t("noTravelAdvisoriesAvailable")}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2c3e50",
  },
  advisoryItem: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  advisoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  advisoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  advisoryDate: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 10,
  },
  advisoryDescription: {
    fontSize: 14,
    color: "#34495e",
    lineHeight: 20,
    marginTop: 6,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 8,
    fontStyle: "italic",
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#ffeeee",
    borderRadius: 8,
    marginTop: 12,
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
  noAdvisoriesText: {
    textAlign: "center",
    color: "#95a5a6",
    fontStyle: "italic",
    marginVertical: 20,
  },
  // Shimmer styles
  shimmerTitle: {
    width: "60%",
    height: 20,
    marginBottom: 8,
  },
  shimmerDate: {
    width: "30%",
    height: 16,
  },
  shimmerDescLine1: {
    width: "100%",
    height: 16,
    marginBottom: 4,
  },
  shimmerDescLine2: {
    width: "90%",
    height: 16,
    marginBottom: 4,
  },
  shimmerDescLine3: {
    width: "80%",
    height: 16,
    marginBottom: 4,
  },
  shimmerLastUpdated: {
    width: "40%",
    height: 14,
    marginTop: 8,
  },
});

export default TravelAdvisories;

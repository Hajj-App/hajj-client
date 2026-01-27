import { useLocalSearchParams, useRouter } from "expo-router";
import HajjRituals from "@/components/common/hajj-rituals";
import React, { useEffect, useState, useCallback } from "react";
import {
  ImageBackground,
  Pressable,
  FlatList,
  Text,
  View,
  Platform,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { fetchWithCache, forceRefresh } from "@/utils/cache";

import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";
import { getRitualsByType, getHistoricPlaces } from "@/utils/firestoreService";
import { Ritual, HistoricPlace as HistoricPlaceType, COLLECTIONS } from "@/types/firestore";

// Unified interface that works with both old and new schema
interface RitualDisplay {
  id: string;
  name: string;
  description: string | string[];
  content_image?: string;
  contentImageUrl?: string;
  order?: number;
}

interface HistoricPlace {
  id: string;
  name: string;
  description: string;
  image?: string;
  imageUrl?: string;
  content_image?: string;
}

import { DocumentSnapshot } from 'firebase/firestore';

const Makkah = () => {
  const params = useLocalSearchParams();
  const routerInstance = useRouter();
  
  const [selected, setSelected] = useState(0);
  const [uploads, setUploads] = useState<RitualDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (params.selected) {
      const tabIndex = Number(params.selected);
      if (tabIndex === 0 || tabIndex === 1) {
        setSelected(tabIndex);
      }
    }
  }, [params.selected]);

  const handleTabSwitch = (index: number) => {
    if (index !== selected) {
      setSelected(index);
      routerInstance.setParams({ selected: index.toString() });
      // Reset pagination on tab switch
      setUploads([]);
      setLastVisible(null);
      setHasMore(true);
    }
  };

  const fetchUploads = useCallback(async (forceNetwork = false) => {
    try {
      setLoading(true);
      setError(null);

      const ritualType = selected === 0 ? 'hajj' : 'umrah';
      
      // Try new schema first
      try {
        const { rituals, lastVisible: nextCursor } = await getRitualsByType(ritualType, 10);
        
        if (rituals.length > 0) {
          // Map new schema to display format
          const mapped = rituals.map((r: Ritual) => ({ // Type explicit
            id: r.id,
            name: r.name,
            description: r.description,
            content_image: r.contentImageUrl, // Check if this field exists on Ritual
            contentImageUrl: r.contentImageUrl,
            order: r.order,
          }));
          
          setUploads(mapped);
          setLastVisible(nextCursor);
          setHasMore(!!nextCursor);
          return;
        } else {
           setHasMore(false);
        }
      } catch (newSchemaError) {
        logger.debug("New schema not available, falling back to legacy", newSchemaError);
      }
      
      // Fallback to legacy schema (No pagination support for legacy in this implementation?)
      // We can implement it if needed, but assuming migration is priority.
      const collectionName = selected === 0 ? "hajj_uploads" : "umrah_uploads";
      const cacheKey = `${collectionName}_cache`;
      
      const uploadsData = forceNetwork 
        ? await forceRefresh(collectionName, cacheKey) as RitualDisplay[]
        : await fetchWithCache<RitualDisplay>(collectionName, cacheKey);
      setUploads(uploadsData);
      // Legacy doesn't support pagination here yet
      setHasMore(false);
    } catch (err) {
      logger.error("Error fetching uploads", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selected]);



  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);



  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUploads(true),
    ]);
    setRefreshing(false);
  }, [fetchUploads]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !lastVisible) return;

    try {
      setLoadingMore(true);
      const ritualType = selected === 0 ? 'hajj' : 'umrah';
      
      const { rituals, lastVisible: nextCursor } = await getRitualsByType(ritualType, 10, lastVisible);
      
      if (rituals.length > 0) {
        const mapped = rituals.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          content_image: r.contentImageUrl,
          contentImageUrl: r.contentImageUrl,
          order: r.order,
        }));
        
        setUploads(prev => [...prev, ...mapped]);
        setLastVisible(nextCursor);
        setHasMore(!!nextCursor);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      logger.error("Error loading more", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderSkeleton = () => (
    <View className="gap-5 pt-5">
      <Skeleton className="h-8 w-40 ml-5" />
      <View className="flex-row gap-4 px-5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-[180px] h-[110px] rounded-lg" />
        ))}
      </View>
    </View>
  );
  const renderVerticalSkeleton = () => (
    <View className="gap-5 pt-5">
      <Skeleton className="h-8 w-40 ml-5" />
      <View className="flex-col gap-4 px-5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </View>
    </View>
  );

  return (
    <View className="flex-1 w-full h-full">
      <ImageBackground
        source={require("@/assets/images/makkah/makkah-img.webp")}
        resizeMode="cover"
        className="w-full h-[350px] items-center justify-start pt-14"
      />

      <View className="w-full h-28 bg-white mt-[-50px] rounded-t-[50px] items-center justify-center">
        <View className="bg-[#F8F9FA] flex-row items-center justify-center rounded-md">
          <Pressable
            onPress={() => handleTabSwitch(0)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selected === 0
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-[#E4E5E6]"
            }`}
          >
            <Text className="text-lg py-2 text-center">{t("hajj")}</Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabSwitch(1)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selected === 1
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-slate-100/20"
            }`}
          >
            <Text className="text-lg py-2 text-center">{t("umrah")}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={uploads}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#31C462"]}
            tintColor="#31C462"
          />
        }
        ListHeaderComponent={
          <>
            {/* Error UI */}
            {error && (
              <View className="mx-5 my-4 p-4 bg-red-50 rounded-lg">
                <Text className="text-red-600 text-center mb-2">{error}</Text>
                <TouchableOpacity
                  onPress={() => fetchUploads(true)}
                  className="bg-red-500 py-2 px-4 rounded-md self-center"
                >
                  <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
              </View>
            )}



            {/* Rituals Title or Skeleton */}
            {loading && uploads.length === 0 ? (
              renderVerticalSkeleton()
            ) : (
              <View className="mt-5 mb-2">
                <Text className="text-2xl font-bold ml-5">{t("rituals")}</Text>
              </View>
            )}
            
            {/* Empty State */}
            {!loading && !error && uploads.length === 0 && (
              <View className="items-center justify-center py-10">
                <Text className="text-gray-500 text-center">
                  {t("noContentAvailable") || "No content available"}
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View className="mx-5">
             <Pressable
                onPress={() => routerInstance.push({
                  pathname: `/${selected === 0 ? "hajj-rituals" : "umrah-rituals"}/${item.id}` as any,
                })}
                className="w-full h-28 bg-gray-200 items-center justify-start my-2 rounded-xl flex-row p-5 gap-3"
              >
                {/* Image Logic similar to HajjRituals */}
                {item.content_image || item.contentImageUrl ? (
                  <Image
                    source={{ uri: item.content_image || item.contentImageUrl }}
                    className="w-20 h-20 rounded-xl"
                  />
                ) : (
                  <View className="w-20 h-20 rounded-xl bg-gray-300 items-center justify-center">
                    <Text className="text-gray-500 text-xs">No Image</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-lg font-bold">{item.name}</Text>
                  <Text
                    className="text-sm text-wrap mr-5 text-gray-500"
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {Array.isArray(item.description) ? item.description[0] : item.description}
                  </Text>
                </View>
              </Pressable>
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-5 items-center">
              <ActivityIndicator size="small" color="#31C462" />
            </View>
          ) : <View className="h-5" />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 80 : 5,
  }
});

export default Makkah;
import React, { useEffect, useState, useCallback } from "react";
import { 
  ImageBackground, 
  Platform, 
  FlatList,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import HajjRituals from "@/components/common/hajj-rituals";

import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";
import { getRitualsByType, getHistoricPlaces } from "@/utils/firestoreService";

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

const Madinah = () => {
  const { t } = useTranslation();
  const routerInstance = useRouter(); // Initialize router
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<RitualDisplay[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMadinaUploads = useCallback(async (_forceNetwork = false) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getRitualsByType('madina', 100);
      const items: RitualDisplay[] = result.rituals.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        content_image: r.contentImageUrl,
        contentImageUrl: r.contentImageUrl,
        order: r.order,
      })).sort((a: RitualDisplay, b: RitualDisplay) => (a.order ?? 0) - (b.order ?? 0));

      setUploads(items);
    } catch (err) {
      logger.error("Error fetching madina uploads", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMadinaUploads();
  }, [fetchMadinaUploads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMadinaUploads(true),
    ]);
    setRefreshing(false);
  }, [fetchMadinaUploads]);

  // Skeleton loading component
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
    <View className="flex-1">
      <ImageBackground
        source={require("@/assets/images/madina/madina-banner.webp")}
        resizeMode="cover"
        className="w-full h-[350px] items-center justify-start pt-14"
      >
        {/* <View className="w-full flex-row items-center justify-between px-10">
          <Text className="text-3xl text-white">Madinah</Text>
          <View className="w-10 h-10 bg-white rounded-full"></View>
        </View> */}
      </ImageBackground>

      <View className="h-20 bg-white mt-[-50px] rounded-t-[50px] items-center justify-center pt-10 overflow-hidden" />
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
                  onPress={() => fetchMadinaUploads(true)}
                  className="bg-red-500 py-2 px-4 rounded-md self-center"
                >
                  <Text className="text-white font-semibold">Try Again</Text>
                </TouchableOpacity>
              </View>
            )}


            
            {loading && uploads.length === 0 ? (
              renderVerticalSkeleton()
            ) : (
              <View className="gap-5 mt-5 mb-2">
                <Text className="text-2xl font-bold ml-5">{t("rituals")}</Text>
              </View>
            )}

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
                pathname: `/madina-rituals/${item.id}` as any,
              })}
              className="w-full h-28 bg-gray-200 items-center justify-start my-2 rounded-xl flex-row p-5 gap-3"
            >
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
        ListFooterComponent={<View className="h-5" />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 80 : 5, 
  }
});

export default Madinah;
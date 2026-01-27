import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { Entypo } from "@expo/vector-icons";
import {
  ImageBackground,
  Pressable,
  FlatList,
  View,
  Text,
  Platform,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { DocumentSnapshot } from 'firebase/firestore';
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHistoricPlaces, createHistoricPlace } from "@/utils/firestoreService";
import { PlaceLocation } from "@/types/firestore";

interface HistoricPlace {
  id: string;
  name: string;
  description: string;
  image?: string;
  imageUrl?: string;
  content_image?: string;
}

import { fetchWithCache, forceRefresh } from "@/utils/cache";

const HistoricPlacesScreen = () => {
  const routerInstance = useRouter();
  const [selectedTab, setSelectedTab] = useState(0); // 0 for Makka, 1 for Madina
  const [places, setPlaces] = useState<HistoricPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const fetchPlaces = useCallback(async (isRefresh = false, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const location: PlaceLocation = selectedTab === 0 ? 'makkah' : 'madinah';
      
      // 1. Try New Schema (Pagination supported)
      try {
        const currentLastVisible = isLoadMore && lastVisible ? lastVisible : undefined;
        
        const { places: newPlaces, lastVisible: nextCursor } = await getHistoricPlaces(
          location,
          10, 
          currentLastVisible
        );

        if (newPlaces.length > 0) {
          const mappedPlaces = newPlaces.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            image: p.imageUrl,
            imageUrl: p.imageUrl,
            content_image: p.imageUrl || p.content_image,
          }));

          if (isLoadMore) {
            setPlaces(prev => [...prev, ...mappedPlaces]);
          } else {
            setPlaces(mappedPlaces);
          }
          
          setLastVisible(nextCursor);
          setHasMore(!!nextCursor);
          return;
        }
      } catch (newSchemaError) {
        // Continue to fallback
      }

      // 2. Fallback to Legacy Schema (Fetch All - No pagination in legacy for now)
      // Only do this on initial load/refresh, not loadMore (legacy doesn't support pagination here)
      if (!isLoadMore) {
        const collectionName = selectedTab === 0 ? "historic_places_makkah" : "historic_places_madina";
        const cacheKey = `${collectionName}_cache`;
        
        const placesData = isRefresh 
          ? await forceRefresh(collectionName, cacheKey) as HistoricPlace[]
          : await fetchWithCache<HistoricPlace>(collectionName, cacheKey);
          
        setPlaces(placesData || []);
        setHasMore(false); // Legacy loads all at once
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error("Error fetching historic places:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [selectedTab, lastVisible]);

  useEffect(() => {
    // Initial fetch on tab change
    fetchPlaces();
  }, [selectedTab]);

  const onRefresh = () => {
    setRefreshing(true);
    setLastVisible(null);
    setHasMore(true);
    // We need to reset state first, actually creating a separate function for clean fetch is better
    // But fetchPlaces depends on state 'lastVisible' which is stale here?
    // Pagination reset logic: passing undefined as lastVisible to fetchPlaces forces reset
    // fetchPlaces(true) calls with isRefresh=true logic
    // Actually, simply calling fetchPlaces(true, false) implies refresh logic? 
    // My fetchPlaces implementation uses `lastVisible` from state if `isLoadMore` is true.
    // If not `isLoadMore`, it uses undefined. So it works.
    fetchPlaces(true); 
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchPlaces(false, true);
    }
  };

  const handleTabSwitch = (index: number) => {
    if (selectedTab !== index) {
      setSelectedTab(index);
      setPlaces([]);
      setLastVisible(null);
      setHasMore(true);
      // useEffect will trigger fetch
    }
  };

  return (
    <SafeAreaView className="flex-1 w-full h-full" edges={['bottom']}>
      <ImageBackground
        source={require("@/assets/images/historic-places.webp")}
        resizeMode="cover"
        className="w-full h-[280px] items-center justify-start pt-12"
      >
        <View className="w-full px-5 flex-row items-center justify-start">
           <Pressable 
              onPress={() => routerInstance.back()}
              className="bg-white/50 p-2 rounded-full"
           >
              <Entypo name="chevron-small-left" size={30} color="black" />
           </Pressable>
        </View>
      </ImageBackground>

      <View className="w-full h-24 bg-white mt-[-100px] rounded-t-[50px] items-center justify-center">
        <View className="bg-[#F8F9FA] flex-row items-center justify-center rounded-md">
          <Pressable
            onPress={() => handleTabSwitch(0)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selectedTab === 0
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-[#E4E5E6]"
            }`}
          >
            <Text className="text-lg py-2 text-center">{t("makka")}</Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabSwitch(1)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selectedTab === 1
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-slate-100/20"
            }`}
          >
            <Text className="text-lg py-2 text-center">{t("madina")}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={places}
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
          loading && !refreshing && places.length === 0 ? null : (
            <View className="px-5 pt-5 pb-2">
              <Text className="text-2xl font-bold">
                {selectedTab === 0 ? t("makkaHistoricPlaces") : t("madinaHistoricPlaces")}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View className="px-4">
            <Pressable
              onPress={() => routerInstance.push({
                pathname: `/${selectedTab === 0 ? "makkah-historic-places" : "madina-historic-places"}/${item.id}` as any,
              })}
              className="w-full h-28 bg-gray-200 items-center justify-start my-2 rounded-xl flex-row p-5 gap-3"
            >
               <Image
                  source={item.content_image ? { uri: item.content_image } : require("@/assets/images/makkah/historical-place.png")}
                  className="w-20 h-20 rounded-xl"
                />
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
                <Text 
                  className="text-sm text-wrap mr-5 text-gray-600 mt-1"
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {item.description}
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
          ) : loading && places.length === 0 ? (
             <View className="py-10 items-center">
                <Text>Loading...</Text>
             </View>
          ) : !loading && places.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500 text-center">
                No historic places available yet.
              </Text>
            </View>
          ) : <View className="h-5" />
        }
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === "ios" ? 80 : 5,
  },
});

export default HistoricPlacesScreen;

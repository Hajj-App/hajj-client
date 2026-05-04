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


const HistoricPlacesScreen = () => {
  const routerInstance = useRouter();
  const [selectedTab, setSelectedTab] = useState(0); // 0 for Makka, 1 for Madina
  const [places, setPlaces] = useState<HistoricPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const fetchPlaces = useCallback(async (_isRefresh = false) => {
    try {
      setLoading(true);

      const location: PlaceLocation = selectedTab === 0 ? 'makkah' : 'madinah';
      const result = await getHistoricPlaces(location, 100);
      const items: HistoricPlace[] = result.places.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.imageUrl ?? p.contentImageUrl ?? p.content_image,
        imageUrl: p.imageUrl ?? p.contentImageUrl ?? p.content_image,
        content_image: p.imageUrl ?? p.contentImageUrl ?? p.content_image,
      }));
      setPlaces(items);
      setHasMore(false);
      setLastVisible(null);
    } catch (err) {
      console.error("Error fetching historic places:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    // Initial fetch on tab change
    fetchPlaces();
  }, [selectedTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlaces(true);
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
        ListFooterComponent={
          !loading && places.length === 0 ? (
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

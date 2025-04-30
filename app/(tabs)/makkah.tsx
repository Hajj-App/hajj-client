import { useLocalSearchParams, useRouter } from "expo-router";
import HajjRituals from "@/components/common/hajj-rituals";
import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
  Platform,
  StyleSheet,
} from "react-native";
import { fetchWithCache } from "@/utils/cache";
import HistoricPlacesSlider from "@/components/common/historic-places-slider";
import { Skeleton } from "@/components/ui/skeleton";

interface HajjUpload {
  id: string;
  name: string;
  description: string;
  content_image: string;
  date: string;
}

interface HistoricPlace {
  id: string;
  name: string;
  description: string;
  image: string;
}

const Makkah = () => {
  const params = useLocalSearchParams();
  const routerInstance = useRouter();
  const [selected, setSelected] = useState(0);
  const [uploads, setUploads] = useState<HajjUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicPlaces, setHistoricPlaces] = useState<HistoricPlace[]>([]);
  const [historicPlacesLoading, setHistoricPlacesLoading] = useState(false);

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
    }
  };

  useEffect(() => {
    const fetchHajjUploads = async () => {
      try {
        setLoading(true);
        setError(null);

        const collectionName = selected === 0 ? "hajj_uploads" : "umrah_uploads";
        const cacheKey = `${collectionName}_cache`;
        
        const uploadsData = await fetchWithCache(collectionName, cacheKey);
        setUploads(uploadsData);
      } catch (err) {
        console.error("Error fetching uploads:", err);
        setError("Failed to fetch data from Firestore");
      } finally {
        setLoading(false);
      }
    };

    fetchHajjUploads();
  }, [selected]);

  useEffect(() => {
    const fetchHistoricPlaces = async () => {
      try {
        setHistoricPlacesLoading(true);
        const placesData = await fetchWithCache('historic_places_makkah', 'historic_places_makkah_cache');
        setHistoricPlaces(placesData);
      } catch (err) {
        console.error("Error fetching historic places:", err);
      } finally {
        setHistoricPlacesLoading(false);
      }
    };

    fetchHistoricPlaces();
  }, []);

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
            <Text className="text-lg py-2 text-center">Hajj</Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabSwitch(1)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selected === 1
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-slate-100/20"
            }`}
          >
            <Text className="text-lg py-2 text-center">Umrah</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white"
        contentContainerStyle={styles.scrollContent}
      >
        {historicPlacesLoading ? (
          renderSkeleton()
        ) : historicPlaces.length > 0 ? (
          <View className="gap-5">
            <Text className="text-2xl font-bold ml-5">Historic places</Text>
            <HistoricPlacesSlider 
              route="makkah-historic-places" 
              data={historicPlaces} 
            />
          </View>
        ) : null}

        {loading ? (
          renderVerticalSkeleton()
        ) : uploads.length > 0 ? (
          <View className="gap-5 mt-5">
            <Text className="text-2xl font-bold ml-5">Rituals</Text>
            <HajjRituals 
              data={uploads} 
              route={selected === 0 ? "hajj-rituals" : "umrah-rituals"} 
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 80 : 5,
  }
});

export default Makkah;
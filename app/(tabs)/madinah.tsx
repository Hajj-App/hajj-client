import React, { useEffect, useState } from "react";
import { ImageBackground, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import ritualData from "@/data/data.json";
import { fetchWithCache } from "@/utils/cache";
import HajjRituals from "@/components/common/hajj-rituals";
import HistoricPlacesSlider from "@/components/common/historic-places-slider";
import { Skeleton } from "@/components/ui/skeleton";

interface Upload {
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
  content_image: string;
}

const Madinah = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [historicPlaces, setHistoricPlaces] = useState<HistoricPlace[]>([]);
  const [historicPlacesLoading, setHistoricPlacesLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const rituals = ritualData.rituals;

  // Fetch rituals data with caching
  useEffect(() => {
    const fetchHajjUploads = async () => {
      try {
        setLoading(true);
        setError(null);

        const uploadsData = await fetchWithCache('madina_uploads', 'madina_uploads_cache');
        console.log("Fetched uploads:", uploadsData.length);
        setUploads(uploadsData);
      } catch (err) {
        console.error("Error fetching hajj uploads:", err);
        setError("Failed to fetch data from Firestore");
      } finally {
        setLoading(false);
      }
    };

    fetchHajjUploads();
  }, [selected]);

  // Fetch historic places data with caching
  useEffect(() => {
    const fetchHistoricPlaces = async () => {
      try {
        setHistoricPlacesLoading(true);
        
        const placesData = await fetchWithCache('historic_places_madina', 'historic_places_madina_cache');
        console.log("Fetched historic places:", placesData.length);
        setHistoricPlaces(placesData);
      } catch (err) {
        console.error("Error fetching historic places:", err);
      } finally {
        setHistoricPlacesLoading(false);
      }
    };

    fetchHistoricPlaces();
  }, []);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white"
        contentContainerStyle={styles.scrollContent}
      >
        {historicPlacesLoading ? (
          renderSkeleton()
        ) : historicPlaces.length > 0 ? (
          <View className="gap-5 pt-5">
            <Text className="text-2xl font-bold ml-5">Historic places</Text>
            <HistoricPlacesSlider 
              route="madina-historic-places" 
              data={historicPlaces} 
            />
          </View>
        ) : null}
        
        {loading ? (
          renderVerticalSkeleton()
        ) : uploads.length > 0 ? (
          <View className="gap-5 mt-5">
            <Text className="text-2xl font-bold ml-5">Rituals</Text>
            <HajjRituals data={uploads} route="madina-rituals" />
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

export default Madinah;
import React, { useEffect, useState } from "react";
import { ImageBackground, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import ritualData from "@/data/data.json";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/utils/firebase";
import HajjRituals from "@/components/common/hajj-rituals";
import HistoricPlacesSlider from "@/components/common/historic-places-slider";

interface Upload {
  id: string;
  name: string;
  description: string;
  content_image: string;
}

interface HistoricPlace {
  id: string;
  name: string;
  description: string;
  image: string;
}

const Madinah = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [historicPlaces, setHistoricPlaces] = useState<HistoricPlace[]>([]);
  const [historicPlacesLoading, setHistoricPlacesLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const rituals = ritualData.rituals;

  // Fetch rituals data
  useEffect(() => {
    const fetchHajjUploads = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!firestore) {
          throw new Error("Firestore is not initialized");
        }

        const uploadsCollectionRef = collection(firestore, "madina_uploads");

        const querySnapshot = await getDocs(uploadsCollectionRef);

        const uploadsData: Upload[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          uploadsData.push({
            id: doc.id,
            name: data.name || "Untitled",
            description:
              Array.isArray(data.description) && data.description.length > 0
                ? data.description[0]
                : typeof data.description === "string"
                ? data.description
                : "",
            content_image: data.content_image || "",
          });
        });

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

  // Fetch historic places data
  useEffect(() => {
    const fetchHistoricPlaces = async () => {
      try {
        setHistoricPlacesLoading(true);
        
        if (!firestore) {
          throw new Error("Firestore is not initialized");
        }

        const historicPlacesRef = collection(firestore, "historic_places_madina");
        const querySnapshot = await getDocs(historicPlacesRef);
        
        const placesData: HistoricPlace[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          placesData.push({
            id: doc.id,
            name: data.name || "Unknown Place",
            description: typeof data.description === "string" 
              ? data.description 
              : Array.isArray(data.description) 
                ? data.description.join(" ") 
                : "",
            image: data.content_image || "",
          });
        });
        
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
        {/* Only show historic places section if data exists and loading is complete */}
        {!historicPlacesLoading && historicPlaces.length > 0 && (
          <View className="gap-5 pt-5">
            <Text className="text-2xl font-bold ml-5">Historic places</Text>
            <HistoricPlacesSlider 
              route="madina-historic-places" 
              data={historicPlaces} 
            />
          </View>
        )}
        
        <View className="gap-5 mt-5">
          <Text className="text-2xl font-bold ml-5">Rituals</Text>
          <HajjRituals data={uploads} route="madina-rituals" />
        </View>
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
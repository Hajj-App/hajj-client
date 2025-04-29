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
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/utils/firebase";
import HistoricPlacesSlider from "@/components/common/historic-places-slider";

interface HajjUpload {
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

const Makkah = () => {
  const params = useLocalSearchParams();
  const routerInstance = useRouter();
  const [selected, setSelected] = useState(0);
  const [uploads, setUploads] = useState<HajjUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historicPlaces, setHistoricPlaces] = useState<HistoricPlace[]>([]);
  const [historicPlacesLoading, setHistoricPlacesLoading] = useState(false);

  // Set initial tab selection from URL parameters
  useEffect(() => {
    if (params.selected) {
      const tabIndex = Number(params.selected);
      if (tabIndex === 0 || tabIndex === 1) {
        setSelected(tabIndex);
      }
    }
  }, [params.selected]);

  // Handler for tab switching - update URL params to reflect the selected tab
  const handleTabSwitch = (index: number) => {
    // Only update parameters if the selection has changed
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

        if (!firestore) {
          throw new Error("Firestore is not initialized");
        }

        const uploadsCollectionRef = collection(
          firestore,
          selected === 0 ? "hajj_uploads" : "umrah_uploads"
        );

        const querySnapshot = await getDocs(uploadsCollectionRef);

        const uploadsData: HajjUpload[] = [];
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

        const historicPlacesRef = collection(firestore, "historic_places_makkah");
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
    <View className="flex-1 w-full h-full">
      <ImageBackground
        source={require("@/assets/images/makkah/makkah-img.webp")}
        resizeMode="cover"
        className="w-full h-[350px] items-center justify-start pt-14"
      >
        {/* <View className="w-full flex-row items-center justify-between px-10">
          <Text className="text-3xl text-white">Makkah</Text>
          <View className="w-10 h-10 bg-white rounded-full"></View>
        </View> */}
      </ImageBackground>

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
            <Text className="text-lg py-2  text-center">Hajj</Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabSwitch(1)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selected === 1
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-slate-100/20"
            }`}
          >
            <Text className="text-lg py-2  text-center">Umrah</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white"
        contentContainerStyle={styles.scrollContent}
      >
        {!historicPlacesLoading && historicPlaces.length > 0 && (
          <View className="gap-5">
            <Text className="text-2xl font-bold ml-5">Historic places</Text>
            <HistoricPlacesSlider 
              route="makkah-historic-places" 
              data={historicPlaces} 
            />
          </View>
        )}

        <View className="gap-5 mt-5">
          <Text className="text-2xl font-bold ml-5">Rituals</Text>
          <HajjRituals data={uploads} route={selected === 0 ? "hajj-rituals" : "umrah-rituals"} />
        </View>
      </ScrollView>
    </View>
  );
};

// Platform-specific styles
const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 80 : 5, // Different padding for iOS and Android
  }
});

export default Makkah;
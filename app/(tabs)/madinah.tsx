import React, { useEffect, useState } from "react";
import { ImageBackground, ScrollView, Text, View } from "react-native";
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
  content_image: string;
  location: string;
  type?: string;
  country?: string;
}

const Madinah = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [historicPlaces, setHistoricPlaces] = useState<HistoricPlace[]>([]);
  const [selected, setSelected] = useState(0);
  const rituals = ritualData.rituals;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!firestore) {
          throw new Error("Firestore is not initialized");
        }

        // Fetch rituals
        const uploadsCollectionRef = collection(firestore, "madina_uploads");
        const uploadsSnapshot = await getDocs(uploadsCollectionRef);
        const uploadsData: Upload[] = uploadsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Untitled",
          description: Array.isArray(doc.data().description) 
            ? doc.data().description[0] 
            : doc.data().description || "",
          content_image: doc.data().content_image || ""
        }));

        // Fetch historic places
        const placesCollectionRef = collection(firestore, "madina_historic_places");
        const placesSnapshot = await getDocs(placesCollectionRef);
        const placesData: HistoricPlace[] = placesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Untitled",
          description: doc.data().description || "",
          content_image: doc.data().content_image || "",
          location: "madina",
          type: doc.data().type || "Historic place in Madina",
          country: doc.data().country || "Saudi Arabia"
        }));

        setUploads(uploadsData);
        setHistoricPlaces(placesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data from Firestore");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selected]);

  return (
    <View className="flex-1">
      <ImageBackground
        source={require("@/assets/images/makkah/makkah-img.webp")}        resizeMode="cover"
        className="w-full h-[350px] items-center justify-start pt-14"
      >
        <View className="w-full flex-row items-center justify-between px-10">
          <Text className="text-3xl text-white">Madinah</Text>
          <View className="w-10 h-10 bg-white rounded-full"></View>
        </View>
      </ImageBackground>

      <View className="h-20 bg-white mt-[-50px] rounded-t-[50px] items-center justify-center pt-10 overflow-hidden" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white mb-20"
      >
        <View className="gap-5 pt-5">
          <Text className="text-2xl font-bold ml-5">Historic places</Text>
          <HistoricPlacesSlider data={historicPlaces} />
        </View>
        
        <View className="gap-5 mt-5">
          <Text className="text-2xl font-bold ml-5">Rituals</Text>
          <HajjRituals data={uploads} route="madina-rituals" />
        </View>
      </ScrollView>
    </View>
  );
};

export default Madinah;
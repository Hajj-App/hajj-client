import { router, useLocalSearchParams } from "expo-router";
import HajjRituals from "@/components/common/hajj-rituals";
import React, { useEffect, useState } from "react";
import {
  Button,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import ritualData from "@/data/data.json";
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
  content_image: string;
  location: string;
  type?: string;
  country?: string;
}

const Makkah = () => {
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState(0);
  const [uploads, setUploads] = useState<HajjUpload[]>([]);
  const [historicPlaces, setHistoricPlaces] = useState<HistoricPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.selected) {
      setSelected(Number(params.selected));
    }
  }, [params]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!firestore) {
          throw new Error("Firestore is not initialized");
        }

        // Fetch rituals
        const uploadsCollectionRef = collection(
          firestore,
          selected === 0 ? "hajj_uploads" : "umrah_uploads"
        );
        const uploadsSnapshot = await getDocs(uploadsCollectionRef);
        const uploadsData: HajjUpload[] = uploadsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Untitled",
          description: Array.isArray(doc.data().description) 
            ? doc.data().description[0] 
            : doc.data().description || "",
          content_image: doc.data().content_image || ""
        }));

        // Fetch historic places
        const placesCollectionRef = collection(firestore, "makkah_historic_places");
        const placesSnapshot = await getDocs(placesCollectionRef);
        const placesData: HistoricPlace[] = placesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "Untitled",
          description: doc.data().description || "",
          content_image: doc.data().content_image || "",
          location: "makkah",
          type: doc.data().type || "Historic place in Makkah",
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
          <Text className="text-3xl text-white">Makkah</Text>
          <View className="w-10 h-10 bg-white rounded-full"></View>
        </View>
      </ImageBackground>

      <View className="w-full h-28 bg-white mt-[-50px] rounded-t-[50px] items-center justify-center">
        <View className="bg-[#F8F9FA] flex-row items-center justify-center rounded-md">
          <Pressable
            onPress={() => setSelected(0)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selected === 0
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-[#E4E5E6]"
            }`}
          >
            <Text className="text-lg py-2 text-center">Hajj</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelected(1)}
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
        className="flex-1 bg-white mb-20"
      >
        <View className="gap-5 pt-5">
          <Text className="text-2xl font-bold ml-5">Historic places</Text>
          <HistoricPlacesSlider data={historicPlaces} />
        </View>

        <View className="gap-5 mt-5">
          <Text className="text-2xl font-bold ml-5">Rituals</Text>
          <HajjRituals 
            data={uploads} 
            route={selected === 0 ? "hajj-rituals" : "umrah-rituals"} 
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default Makkah;
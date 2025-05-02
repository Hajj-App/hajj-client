import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import HistoricPlacesList from "@/components/common/historic-places-list";

interface HistoricPlace {
  id: string;
  name: string;
  description: string;
  image: string;
  content_image: string;
}

const HistoricPlacesScreen = () => {
  const routerInstance = useRouter();
  const [selectedTab, setSelectedTab] = useState(0); // 0 for Makka, 1 for Madina
  const [makkaPlaces, setMakkaPlaces] = useState<HistoricPlace[]>([]);
  const [madinaPlaces, setMadinaPlaces] = useState<HistoricPlace[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch historic places data
  useEffect(() => {
    const fetchHistoricPlaces = async () => {
      try {
        setLoading(true);
        
        if (!firestore) {
          throw new Error("Firestore is not initialized");
        }

        // Fetch Makka historic places
        const makkaQuerySnapshot = await getDocs(collection(firestore, "historic_places_makkah"));
        const makkaData: HistoricPlace[] = makkaQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as HistoricPlace));
        setMakkaPlaces(makkaData);

        // Fetch Madina historic places
        const madinaQuerySnapshot = await getDocs(collection(firestore, "historic_places_madina"));
        const madinaData: HistoricPlace[] = madinaQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as HistoricPlace));
        setMadinaPlaces(madinaData);

      } catch (err) {
        console.error("Error fetching historic places:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricPlaces();
  }, []);

  return (
    <View className="flex-1 w-full h-full">
      <ImageBackground
        source={require("@/assets/images/historic-places.webp")}
        resizeMode="cover"
        className="w-full h-[350px] items-center justify-start pt-14"
      >
        {/* Header content can be added here */}
      </ImageBackground>

      <View className="w-full h-28 bg-white mt-[-150px] rounded-t-[50px] items-center justify-center">
        <View className="bg-[#F8F9FA] flex-row items-center justify-center rounded-md">
          <Pressable
            onPress={() => setSelectedTab(0)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selectedTab === 0
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-[#E4E5E6]"
            }`}
          >
            <Text className="text-lg py-2 text-center">Makka</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab(1)}
            className={`w-36 flex items-center justify-center rounded-md ${
              selectedTab === 1
                ? "bg-[#31C46245]/20 border-[#31C462] border-2"
                : "bg-slate-100/20"
            }`}
          >
            <Text className="text-lg py-2 text-center">Madina</Text>
          </Pressable>
        </View>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white"
        contentContainerStyle={styles.scrollContent}
      >
        <View className="p-5">
          {loading ? (
            <Text className="text-center py-4">Loading historic places...</Text>
          ) : selectedTab === 0 ? (
            <>
              <Text className="text-2xl font-bold mb-4">Makka Historic Places</Text>
              <HistoricPlacesList 
                data={makkaPlaces} 
                route="makkah-historic-places"
              />
            </>
          ) : (
            <>
              <Text className="text-2xl font-bold mb-4">Madina Historic Places</Text>
              <HistoricPlacesList 
                data={madinaPlaces} 
                route="madina-historic-places"
              />
            </>
          )}
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

export default HistoricPlacesScreen;
import HistoricPlacesSlider from "@/components/makkah/historic-places-slider";
import Rituals from "@/components/makkah/rituals";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Makkah = () => {
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState(0);
  
  useEffect(() => {
    // Set the initial selection based on the route parameter
    if (params.selected) {
      setSelected(Number(params.selected));
    }
  }, [params]);

  return (
    <View className="flex-1">
      <ImageBackground
        source={require("@/assets/images/makkah/makkah-img.webp")}
        resizeMode="cover"
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
            <Text className="text-lg py-2  text-center">Hajj</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelected(1)}
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
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-white">
        <View className="gap-5">
          <Text className="text-2xl font-bold ml-5">Historic places</Text>
          <HistoricPlacesSlider data={[1,2,3,4,5,6,7]} />
        </View>
        <View className="gap-5 mt-5">
          <Text className="text-2xl font-bold ml-5">Historic places</Text>
          <Rituals data={[1,2,3,4,5,6,7]} />
        </View>
      </ScrollView>
    </View>
  );
};

export default Makkah;

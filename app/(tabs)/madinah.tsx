import HistoricPlacesSlider from "@/components/makkah/historic-places-slider";
import Rituals from "@/components/makkah/hajj-rituals";
import React, { useState } from "react";
import { ImageBackground, ScrollView, Text, View } from "react-native";
import ritualData from "@/data/data.json";
const Madinah = () => {
  const [selected, setSelected] = useState(0);
  const rituals = ritualData.rituals;
  return (
    <View className="flex-1">
      <ImageBackground
        source={require("@/assets/images/makkah/makkah-img.webp")}
        resizeMode="cover"
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
        className="flex-1 bg-white"
      >
        <View className="gap-5 pt-5">
          <Text className="text-2xl font-bold ml-5">Historic places</Text>
          <HistoricPlacesSlider data={[1, 2, 3, 4, 5, 6, 7]} />
        </View>
        <View className="gap-5 mt-5">
          <Text className="text-2xl font-bold ml-5">Rituals</Text>
          <Rituals data={rituals} />
        </View>
      </ScrollView>
    </View>

    // </View>
  );
};

export default Madinah;

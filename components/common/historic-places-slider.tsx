import { View, Text, ScrollView, ImageBackground, Pressable } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const HistoricPlacesSlider = ({ data }: { data: number[] }) => {
    const router = useRouter()
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {data.map((item, i) => (
        <Pressable key={item} onPress={()=>router.push(`/madina-historic-places/${item}`)}>
        <ImageBackground
          source={require("@/assets/images/makkah/historical-place.png")}
          resizeMode="cover"
          
          className={`w-[250px] h-[150px] rounded-xl mx-1 items-start justify-end ${
            i === 0 ? "ml-5" : ""
          } ${data.length - 1 === i ? "mr-5" : ""}`}
          
        >
          <View className="w-full flex-col gap-0.5 p-5" >
            <Text className="text-white text-xl font-bold ">
              Hira Cave, Jabal Al-Nour
            </Text>
            <Text className="text-white text-sm font-bold ">
              Religious destination in Mecca
            </Text>
            <Text className="text-white text-sm font-bold pl-5">
              Saudi Arabia
            </Text>
          </View>
        </ImageBackground>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default HistoricPlacesSlider;

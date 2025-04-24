import { View, Text, ScrollView, ImageBackground, Pressable, Image } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

interface HistoricPlace {
  id: string;
  name: string;
  description: string;
  image: string;
}

const HistoricPlacesSlider = ({ data, route }: { data: HistoricPlace[], route: string }) => {
  const router = useRouter();
  
  // Only show the first 10 items to avoid performance issues
  const displayData = data || [];
  
  const handlePress = (id: string) => {
    if (route === "madina-historic-places") {
      router.push(`/madina-historic-places/${id}`);
    } else {
      console.log(`Navigating to ${route}/${id}`);
      router.push(`/${route}/${id}` as any);
    }
  };
  
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {displayData.length > 0 ? (
        displayData.map((item, i) => (
          <Pressable 
            key={item.id} 
            onPress={() => handlePress(item.id)}
            className={`w-[180px] h-[110px] rounded-[20px] mr-2 overflow-hidden ${
              i === 0 ? "ml-5" : ""
            } ${displayData.length - 1 === i ? "mr-5" : ""}`}
          >
            <ImageBackground
              source={item.image ? { uri: item.image } : require("@/assets/images/makkah/historical-place.png")}
              resizeMode="cover"
              className={`w-[180px] h-[110px]  items-start justify-end rounded-xl`}
            >
            <View className="w-full h-full justify-end flex-col gap-1 p-5 bg-black/50">
              <Text className="text-white text-lg font-bold">
                {item.name}
              </Text>
              <Text className="text-white text-xs font-bold w-[100%]" 
                    numberOfLines={3}
                     ellipsizeMode="tail"
                  >
                
                {item.description.length > 55 
                  ? item.description.substring(0, 55) + "..." 
                  : item.description}
              </Text>
            </View>
          </ImageBackground>
        </Pressable>
      ))
    ) : (
      <View className="ml-5 flex justify-center items-center w-[250px] h-[150px] bg-gray-200 rounded-xl">
        <Text>No historic places available</Text>
      </View>
    )}
  </ScrollView>
);
};

export default HistoricPlacesSlider;

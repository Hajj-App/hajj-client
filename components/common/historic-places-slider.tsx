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
  const displayData = data && data.length > 0 ? data.slice(0, 10) : [];
  
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
          >
            <ImageBackground
              source={item.image ? { uri: item.image } : require("@/assets/images/makkah/historical-place.png")}
              resizeMode="cover"
              className={`w-[250px] h-[150px] rounded-xl mx-1 items-start justify-end ${
                i === 0 ? "ml-5" : ""
              } ${displayData.length - 1 === i ? "mr-5" : ""}`}
            >
              <View className="w-full flex-col gap-0.5 p-5">
                <Text className="text-white text-xl font-bold">
                  {item.name}
                </Text>
                <Text className="text-white text-sm font-bold">
                  {item.description.length > 50 
                    ? item.description.substring(0, 50) + "..." 
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

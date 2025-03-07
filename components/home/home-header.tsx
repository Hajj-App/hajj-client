import { View, Text, Image } from "react-native";
import React from "react";

const HomeHeader = () => {
  return (
    <View className="flex-row p-2 mt-4 bg-white rounded-full items-center justify-between">
      <View className="flex-row gap-1 ml-4">
        <Text className="text-lg font-bold">Welcome</Text>
        <Text className="text-lg">Mudassir !</Text>
      </View>
      <Image
        source={require("@/assets/images/makkah/makkah-img.webp")}
        className="w-12 h-12 rounded-full mr-1"
      />
    </View>
  );
};
export default HomeHeader;

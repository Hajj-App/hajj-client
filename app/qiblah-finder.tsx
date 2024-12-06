import { View, Text, Image } from "react-native";
import React from "react";
import Entypo from "@expo/vector-icons/Entypo";

const QiblahFinder = () => {
  return (
    <View className="flex-1 items-center justify-center">
      <Image
        source={require("@/assets/images/qibliah-direction.png")}
        resizeMode="contain"
        className="w-96 h-96"
      />
      <View className="flex-row items-center gap-2 p-4 bg-gray-200 rounded-3xl mt-8">
        <Entypo name="location-pin" size={24} color="red" />
        <Text>30.043 31.48919</Text>
      </View>
      <Text className="text-3xl font-bold py-4">136.85°</Text>
    </View>
  );
};

export default QiblahFinder;

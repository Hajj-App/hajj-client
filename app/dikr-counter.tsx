import { View, Text, Image, Pressable } from "react-native";
import React from "react";

const DikrCounter = () => {
  return (
    <View className="flex-1 items-center justify-center">
      <Image
        source={require("@/assets/images/tally-counter.png")}
        className="w-96 h-96"
        resizeMode="contain"
      />
      <Pressable className="bg-gray-300 py-4 px-10 rounded-3xl">
        <Text className="text-lg font-bold">Reset</Text>
      </Pressable>
    </View>
  );
};

export default DikrCounter;

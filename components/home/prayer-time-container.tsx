import { View, Text } from "react-native";
import React from "react";

const PrayerTimeContainer = () => {
  return (
    <View className="bg-black p-10 rounded-3xl mt-8">
      <Text className="text-white font-bold text-xl">Zuhr</Text>
      <View className="flex-row justify-between mt-5 items-center">
        <Text className="text-gray-500 text-sm">Remaining</Text>
        <Text className="text-white font-bold text-2xl">1h 36m</Text>
      </View>
      <View className="flex-row gap-10 mt-5">
        <View className="gap-1">
          <Text className="text-gray-500 text-sm">Start at</Text>
          <Text className="text-white text-sm font-semibold">12:03 PM</Text>
        </View>
        <View className="gap-1">
          <Text className="text-gray-500 text-sm">Ends at</Text>
          <Text className="text-white text-sm font-semibold">04:43 PM</Text>
        </View>
      </View>
    </View>
  );
};

export default PrayerTimeContainer;

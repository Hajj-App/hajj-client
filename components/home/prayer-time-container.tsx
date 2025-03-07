import { View, Text } from "react-native";
import React from "react";

interface PrayerTimeProps {
  prayerName?: string;
  startTime?: string;
  endTime?: string;
  remainingTime?: string;
}

const PrayerTimeContainer: React.FC<PrayerTimeProps> = ({ prayerName, startTime, endTime, remainingTime }) => {

  return (
    <View className="bg-black p-10 rounded-[45px] mt-8 w-full">
      <Text className="text-white font-bold text-xl">{prayerName || 'Dhuhr'}</Text>
      <View className="flex-row justify-between mt-5 items-center">
        <Text className="text-gray-500 text-sm">Remaining</Text>
        <Text className="text-white font-bold text-2xl">{remainingTime}</Text>
      </View>
      <View className="flex-row gap-10 mt-5 items-center gap-5">
        <View className="rounded-full bg-green w-3 h-3 mt-1"></View>
        <View className="gap-1">
          <Text className="text-gray-500 text-sm">Start at</Text>
          <Text className="text-white text-sm font-semibold">{startTime || "N/A"}</Text>
        </View>
        <View className="gap-1">
          <Text className="text-gray-500 text-sm">Ends at</Text>
          <Text className="text-white text-sm font-semibold">{endTime || "N/A"}</Text>
        </View>
      </View>
    </View>
  );
};

export default PrayerTimeContainer;

import { View, Text } from "react-native";
import React from "react";

const PrayerList = () => {
  const prayers = [
    {
      name: "Fajr",
      time: "12:03",
    },
    {
      name: "Dhuhr",
      time: "12:03",
    },
    {
      name: "Asr",
      time: "12:03",
    },
    {
      name: "Maghrib",
      time: "12:03",
    },
    {
      name: "Isha",
      time: "12:03",
    },
  ];

  return (
    <View className="mt-5">
      {prayers.map((item, index) => (
        <View key={index} className="flex-row items-center">
          <Text className="text-lg font-bold">{item.name}</Text>
          <Text className="text-lg font-bold">{item.time}</Text>
        </View>
      ))}
    </View>
  );
};

export default PrayerList;

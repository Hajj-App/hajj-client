import { View, Text, Pressable, ScrollView } from "react-native";
import React, { useState } from "react";

const PrayerList = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const prayers = [
    {
      name: "Fajr",
      time: "12:03 PM",
    },
    {
      name: "Dhuhr",
      time: "12:03 PM",
    },
    {
      name: "Asr",
      time: "12:03 PM",
    },
    {
      name: "Maghrib",
      time: "12:03 PM",
    },
    {
      name: "Isha",
      time: "12:03 PM",
    },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="mt-8 flex-row gap-4">
        {prayers.map((item, index) => (
          <Pressable
            onPress={() => setSelectedIndex(index)}
            key={index}
            className={`flex py-4 px-3 rounded-xl items-start ${
              selectedIndex === index
                ? "bg-white border-2 border-green"
                : "bg-gray-200"
            }`}>
            <Text className="text-base font-bold">{item.name}</Text>
            <Text className="text-sm font-normal">Start at</Text>
            <Text className="text-base font-bold">{item.time}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

export default PrayerList;

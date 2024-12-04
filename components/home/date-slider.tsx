import { View, Text, ScrollView, Pressable } from "react-native";
import React, { useState } from "react";
import { getSevenDays } from "@/utils/getSevenDays";

const DateSlider = () => {
  const days = getSevenDays();
  const [selectedIndex, setSelectedIndex] = useState(0);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {days.map((day, index) => (
        <Pressable
          onPress={() => setSelectedIndex(index)}
          className={`flex-start py-3 mx-1 rounded-2xl ${
            selectedIndex === index ? "bg-green" : "bg-gray-200"
          }`}
          style={{ width: 100 }}
          key={index}>
          <Text
            className={`text-sm text-center font-semibold ${
              selectedIndex === index ? "text-white" : "text-black"
            }`}>
            {day.day}
          </Text>
          <Text
            className={`text-xs font-medium text-center ${
              selectedIndex === index ? "text-white" : "text-black"
            }`}>
            {day.month}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};
export default DateSlider;

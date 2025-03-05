import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import { router } from "expo-router";
import ritualData from "@/data/data.json";

// Define the Ritual interface
interface Ritual {
  id: number;
  card: {
    name: string;
    description: string;
  };
}

type Props = {
  data: Ritual[];
};

const Rituals = ({ data }: Props) => {


  
  return (
    <View className="flex-1 mx-5 pb-5">
      {data.map((ritual, i) => (
        <Pressable
          key={ritual.id}
          onPress={() => router.push(`/ritual-details/${ritual.id}`)}
          className="w-full h-28 bg-gray-200 items-center justify-start my-2 rounded-xl flex-row p-5 gap-3"
        >
          <Image
            source={require("@/assets/images/makkah/rituals.png")}
            className="w-20 h-20 rounded-xl"
          />
          <View className="w-full">
            <Text className="text-lg font-bold">
              {ritual.card.name}
            </Text>
            <Text className="text-sm text-wrap mr-5 text-gray-500">
              {ritual.card.description}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default Rituals;

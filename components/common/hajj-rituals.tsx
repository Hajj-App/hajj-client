import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import { router } from "expo-router";

// Define the Ritual interface
interface Ritual {
  id: string;
  name: string;
  description: string;
  content_image: string;
  date: string;       // Format: "YYYY-MM-DD"
  time?: string;      // Optional, Format: "HH:MM" (24-hour)
  datetime?: Date;    // Alternative: Combined datetime field
}

type Props = {
  data: Ritual[];
  route: "hajj-rituals" | "umrah-rituals" | "madina-rituals";
};

const HajjRituals = ({ data, route }: Props) => {
  return (
    <View className="flex-1 mx-5 pb-5">
      {data.map((ritual) => (
        <Pressable
          key={ritual.id}
          onPress={() => router.push(`/${route}/${ritual.id}` as any)}
          className="w-full h-28 bg-gray-200 items-center justify-start my-2 rounded-xl flex-row p-5 gap-3"
        >
          <Image
            source={{ uri: ritual.content_image }}
            className="w-20 h-20 rounded-xl"
          />
          <View className="flex-1">
            <Text className="text-lg font-bold">{ritual.name}</Text>
            <Text
              className="text-sm text-wrap mr-5 text-gray-500"
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {ritual.description}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default HajjRituals;

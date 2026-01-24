import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import { router } from "expo-router";

// Define the Ritual interface - supports both old and new schema
interface Ritual {
  id: string;
  name: string;
  description: string | string[];  // Can be string or array
  content_image?: string;          // Old schema
  contentImageUrl?: string;        // New schema
  date?: string;
  order?: number;
}

type Props = {
  data: Ritual[];
  route: "hajj-rituals" | "umrah-rituals" | "madina-rituals";
};

const HajjRituals = ({ data, route }: Props) => {
  // Helper to get first line of description
  const getDescriptionPreview = (description: string | string[]): string => {
    if (Array.isArray(description)) {
      return description[0] || '';
    }
    return description || '';
  };

  // Helper to get image URL (supports both schemas)
  const getImageUrl = (ritual: Ritual): string | undefined => {
    return ritual.content_image || ritual.contentImageUrl;
  };

  return (
    <View className="flex-1 mx-5 pb-5">
      {data.map((ritual) => (
        <Pressable
          key={ritual.id}
          onPress={() => router.push(`/${route}/${ritual.id}` as any)}
          className="w-full h-28 bg-gray-200 items-center justify-start my-2 rounded-xl flex-row p-5 gap-3"
        >
          {getImageUrl(ritual) ? (
            <Image
              source={{ uri: getImageUrl(ritual) }}
              className="w-20 h-20 rounded-xl"
            />
          ) : (
            <View className="w-20 h-20 rounded-xl bg-gray-300 items-center justify-center">
              <Text className="text-gray-500 text-xs">No Image</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-lg font-bold">{ritual.name}</Text>
            <Text
              className="text-sm text-wrap mr-5 text-gray-500"
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {getDescriptionPreview(ritual.description)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default HajjRituals;



import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";

interface HistoricPlace {
  id: string;
  name: string;
  description: string;
  image: string; 
  content_image: string;
}

interface Props {
  data: HistoricPlace[];
  route: string;
}

const HistoricPlacesList: React.FC<Props> = ({ data, route }) => {
  return (
    <View className="px-4">
      {data.map((place) => (
        <TouchableOpacity
          key={place.id}
          onPress={() => router.push(`/${route}/${place.id}` as any)}
          className="w-full h-28 bg-gray-200 items-center justify-start my-2 rounded-xl flex-row p-5 gap-3"
        >
           <Image
              source={place.content_image ? { uri: place.content_image } : require("@/assets/images/makkah/historical-place.png")}
              className="w-20 h-20 rounded-xl"
            />
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">{place.name}</Text>
            <Text 
              className="text-sm text-wrap mr-5 text-gray-600 mt-1"
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {place.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default HistoricPlacesList;
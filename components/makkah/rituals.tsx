import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import { useNavigation } from "expo-router";

type Props = {
  data: number[];
};

const Rituals = ({ data }: Props) => {
    const navigation = useNavigation();
    const handleNavigation = () => {
        // navigation.navigate("/ritual-detail"); 
      };
  return (
    <View className="flex-1 mx-5">
      {data.map((item, i) => (
        <Pressable
          key={i}
          onPress={() => handleNavigation()}
          className="w-full h-28 bg-gray-200 items-center justify-start my-2 rounded-xl flex-row p-5 gap-3"
        >
          <Image
            source={require("@/assets/images/makkah/rituals.png")}
            className="w-20 h-20 rounded-xl"
          />
          <View className="w-full">
            <Text className="text-lg font-bold">
              Things to notice when register Hajj
            </Text>
            <Text className="text-sm text-wrap mr-5 text-gray-500">
              Ensure you meet the eligibility criteria, Prepare ..
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default Rituals;

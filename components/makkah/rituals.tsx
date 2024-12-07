import { View, Text, Image } from "react-native";
import React from "react";

type Props = {
  data: number[];
};

const Rituals = ({ data }: Props) => {
  return (
    <View className="flex-1 mx-5">
      {data.map((item, i) => (
        <View
          key={i}
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
        </View>
      ))}
    </View>
  );
};

export default Rituals;

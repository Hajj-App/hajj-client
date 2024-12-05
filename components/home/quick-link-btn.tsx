import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import Feather from "@expo/vector-icons/Feather";

type QuickLinkBtnProps = {
  title: string;
  subtitle?: string;
  description: string;
  icon: any;
  width: string;
};

const QuickLinkBtn = ({
  title,
  subtitle,
  description,
  icon,
  width,
}: QuickLinkBtnProps) => {
  return (
    <TouchableOpacity className={`bg-white p-5 rounded-3xl w-${width}`}>
      <View className="flex items-end">
        <Feather name="arrow-up-right" size={24} color="gray" />
        <Image source={icon} className="w-28 h-28" />
      </View>
      <Text className="text-lg font-bold">{title}</Text>
      {subtitle && (
        <Text className="text-lg font-normal -mt-2">{subtitle}</Text>
      )}
      <Text className="text-gray-500 text-sm font-normal">{description}</Text>
    </TouchableOpacity>
  );
};

export default QuickLinkBtn;

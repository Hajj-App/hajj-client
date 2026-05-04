import { View, Text, Pressable, Image } from "react-native";
import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { Link } from "expo-router";

type QuickLinkBtnProps = {
  title: string;
  subtitle?: string;
  description?: string;
  icon: any;
  width?: string;
  route?: "/dikrs-and-duas" | "/qiblah-finder" | "/dikr-counter";
};

const QuickLinkBtn = ({
  title,
  subtitle,
  description,
  icon,
  width,
  route,
}: QuickLinkBtnProps) => {
  return (
    <Link
      href={(route ?? "/+not-found") as any}
      asChild>
      <Pressable
        className={`bg-white p-5 rounded-3xl ${width ? width : "w-1/2"}`}
        onPress={() => {}}>
        <View className="flex items-end">
          <Feather name="arrow-up-right" size={24} color="gray" />
          <Image source={icon} style={{ width: 112, height: 112 }} resizeMode="contain" />
        </View>
        <Text className="text-lg font-bold">{title}</Text>
        {subtitle && (
          <Text className="text-lg font-normal -mt-2">{subtitle}</Text>
        )}
        <Text className="text-gray-500 text-sm font-normal">{description}</Text>
      </Pressable>
    </Link>
  );
};

export default QuickLinkBtn;

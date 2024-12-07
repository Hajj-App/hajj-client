import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { Link } from "expo-router";

type QuickLinkBtnProps = {
  title: string;
  subtitle?: string;
  description: string;
  icon: any;
  width?: string;
  route: string;
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
      href={{
        pathname:
          route === "/dikrs-and-duas"
            ? "/dikrs-and-duas"
            : route === "/qiblah-finder"
            ? "/qiblah-finder"
            : route === "/dikr-counter"
            ? "/dikr-counter"
            : "/+not-found",
        params: {},
      }}
      asChild>
      <Pressable
        className={`bg-white p-5 rounded-3xl ${width ? width : "w-1/2"}`}
        onPress={() => {}}>
        <View className="flex items-end">
          <Feather name="arrow-up-right" size={24} color="gray" />
          <Image source={icon} className="w-28 h-28" />
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

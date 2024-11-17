import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import React from "react";
import icons from "@/constants/icons";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const categoriesData = [
  {
    id: 1,
    title: "Prayer",
    desc: "magrib",
    icon: icons.kaabaIcon,
    link: "/",
  },
  {
    id: 2,
    title: "Prayer",
    desc: "magrib",
    icon: icons.kaabaIcon,
    link: "/",
  },
  {
    id: 3,
    title: "Prayer",
    desc: "magrib",
    icon: icons.kaabaIcon,
    link: "/",
  },
  {
    id: 4,
    title: "Prayer",
    desc: "magrib",
    icon: icons.kaabaIcon,
    link: "/",
  },
];

const Categories = ({ title }: { title: string }) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} className="my-10">
      <FlatList
        data={categoriesData}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View className="w-full items-center mb-5">
            <TouchableOpacity className="flex justify-center items-center rounded-md bg-gray-500 p-2">
              <Text className="text-xl text-white">{title}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View className="flex-row gap-5 w-full py-2 shadow-black">
            <View className="w-14 h-14 rounded-xl bg-gray-300 items-center justify-center">
              <Image
                source={item.icon}
                className="w-10 h-10"
                resizeMode="cover"
              />
            </View>
            <View className="w-full items-start">
              <View className="justify-between">
                <Text className="text-center text-lg">{item.title}</Text>
                <Text className="text-center text-gray-400">{item.desc}</Text>
              </View>
            </View>

            <TouchableOpacity className="flex justify-center items-center rounded-md bg-gray-200 p-2">
              <Ionicons name="chevron-forward-outline" size={24} />
            </TouchableOpacity>
          </View>
        )}
      />
    </ScrollView>
  );
};

export default Categories;

import { Tabs } from "expo-router";
import React from "react";
import { Image, Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import icons from "@/constants/icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].icon,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={icons.homeIcon}
              className="w-8 h-8 text-white"
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={icons.searchIcon}
              className="w-8 h-8 text-white"
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="makkah"
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={icons.kaabaIcon}
              className="w-7 h-7 text-white"
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="madinah"
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={icons.madinaIcon}
              className="w-8 h-8 text-white"
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

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
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
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
          title: "Home",
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
          title: "Explore",
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
          title: "Makkah",
          tabBarIcon: ({ color }) => (
            <Image
            source={icons.kaabaIcon}
            className="w-10 h-10 text-white"
            resizeMode="contain"
          />
          ),
        }}
      />
      <Tabs.Screen
        name="madinah"
        options={{
          title: "Madinah",
          tabBarIcon: ({ color }) => (
            <Image
            source={icons.madinaIcon}
            className="w-10 h-10 text-white"
            resizeMode="contain"
          />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Image
              source={icons.profileIcon}
              className="w-9 h-9 text-white"
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

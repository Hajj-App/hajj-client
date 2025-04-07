import { Tabs } from "expo-router";
import React from "react";
import { Image, Platform, View } from "react-native";
import { HapticTab } from "@/components/HapticTab";
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
            position: "absolute",
          },
          default: {
            height: 60,
            
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Image
                source={icons.homeIcon}
                style={{ width: 25, height: 25 }}
                resizeMode="contain"
              />
              {focused && (
                <View
                  style={{
                    width: 8,
                    height: 6,
                    borderRadius: 4, // Makes the view circular
                    backgroundColor: "green",
                    marginTop: 4, // Add spacing below the icon
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Image
                source={icons.searchIcon}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              {focused && (
                <View
                  style={{
                    width: 8,
                    height: 6,
                    borderRadius: 4,
                    backgroundColor: "green",
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="makkah"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Image
                source={icons.kaabaIcon}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
              {focused && (
                <View
                  style={{
                    width: 8,
                    height: 6,
                    borderRadius: 4,
                    backgroundColor: "green",
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="madinah"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Image
                source={icons.madinaIcon}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
              {focused && (
                <View
                 
                  style={{
                    width: 8,
                    height: 6,
                    borderRadius: 4,
                    backgroundColor: "green",
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

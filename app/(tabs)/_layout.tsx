import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Platform, View } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import icons from "@/constants/icons";
import { shouldShowTabBadge } from "@/utils/tabBadge";
import { useNavigation } from "@react-navigation/native";
import { clearNewUpdatesFlag } from "@/utils/tabBadge";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const checkUpdates = async () => {
      const hasUpdates = await shouldShowTabBadge();
      setHasNewUpdates(hasUpdates);
    };
    checkUpdates();
    // Check for updates every minute
    const interval = setInterval(checkUpdates, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clear badge when explore tab is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const state = navigation.getState();
      if (state && state.routes && state.routes[state.index]) {
        const currentRoute = state.routes[state.index];
        if (currentRoute.name === 'explore') {
          setHasNewUpdates(false);
          await clearNewUpdatesFlag();
        }
      }
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "green", // Use green directly for active
        headerShown: false,
        tabBarInactiveTintColor: "#8e8e93", // Standard iOS inactive gray
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          bottom: 30,
          left: 50,
          right: 50,
          backgroundColor: "#ffffff",
          borderRadius: 30, // Premium pill shape
          height: 60,
          borderTopWidth: 0, // Remove default border
          elevation: 10, // Android shadow
          shadowColor: "#000", // iOS shadow
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          paddingBottom: 0, // Ensure content is centered
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", justifyContent: 'center', height: '100%', top: 8 }}>
              <Image
                source={icons.homeIcon}
                style={{ width: 24, height: 24, tintColor: focused ? "green" : "#8e8e93" }}
                resizeMode="contain"
              />
              {focused && (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "green",
                    marginTop: 6,
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
            <View style={{ alignItems: "center", justifyContent: 'center', height: '100%', top: 8 }}>
              <View>
                <Image
                  source={icons.searchIcon}
                  style={{ width: 26, height: 26, tintColor: focused ? "green" : "#8e8e93" }}
                  resizeMode="contain"
                />
                {hasNewUpdates && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: 'red',
                      borderRadius: 6,
                      width: 12,
                      height: 12,
                      borderWidth: 2,
                      borderColor: 'white',
                    }}
                  />
                )}
              </View>
              {focused && (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "green",
                    marginTop: 6,
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
            <View style={{ alignItems: "center", justifyContent: 'center', height: '100%', top: 8 }}>
              <Image
                source={icons.kaabaIcon}
                style={{ width: 28, height: 28, tintColor: focused ? "green" : "#8e8e93" }}
                resizeMode="contain"
              />
              {focused && (
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "green",
                    marginTop: 6,
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
            <View style={{ alignItems: "center", justifyContent: 'center', height: '100%', top: 8 }}>
              <Image
                source={icons.madinaIcon}
                style={{ width: 32, height: 32, tintColor: focused ? "green" : "#8e8e93" }}
                resizeMode="contain"
              />
              {focused && (
                <View
                 
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "green",
                    marginTop: 6,
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

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
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <View>
                <Image
                  source={icons.searchIcon}
                  style={{ width: 28, height: 28 }}
                  resizeMode="contain"
                />
                {hasNewUpdates && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      backgroundColor: 'red',
                      borderRadius: 8,
                      width: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  />
                )}
              </View>
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

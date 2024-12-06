import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="qiblah-finder"
          options={{
            headerTitle: "Qiblah Finder",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 18,
            },
            headerLeft: () => {
              return (
                <Pressable onPress={() => router.back()}>
                  <Entypo name="chevron-small-left" size={40} color="black" />
                </Pressable>
              );
            },
          }}
        />
        <Stack.Screen
          name="dikr-counter"
          options={{
            headerTitle: "Dikr Counter",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 18,
            },
            headerLeft: () => {
              return (
                <Pressable onPress={() => router.back()}>
                  <Entypo name="chevron-small-left" size={40} color="black" />
                </Pressable>
              );
            },
          }}
        />
        <Stack.Screen
          name="dikrs-and-duas"
          options={{
            headerTitle: "Dikrs & Duas",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 18,
            },
            headerLeft: () => {
              return (
                <Pressable onPress={() => router.back()}>
                  <Entypo name="chevron-small-left" size={40} color="black" />
                </Pressable>
              );
            },
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

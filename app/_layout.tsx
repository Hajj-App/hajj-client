import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
  Montserrat_100Thin,
  Montserrat_200ExtraLight,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/montserrat";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n/i18n';
import OfflineBanner from '../components/ui/OfflineBanner';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { signInAnonymousUser } from '../utils/firebase';
import { logger } from '../utils/logger';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Montserrat_100Thin,
    Montserrat_200ExtraLight,
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold
  });

  // Initialize Firebase auth on app start
  useEffect(() => {
    signInAnonymousUser().catch((err) => {
      logger.error("Failed to sign in anonymously", err);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <ThemeProvider value={DefaultTheme}>
          <View style={{ flex: 1 }}>
            <OfflineBanner />
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
            name="historic-places"
            options={{
              headerTitle: "Historic Places",
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
          <Stack.Screen
            name="makkah-historic-places/[id]"
            options={{
              headerTitle: "Makkah Historic Places",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 18,
              },
              headerShown: false,
              // headerLeft: () => {
              //   return (
              //     <Pressable onPress={() => router.back()}>
              //       <Entypo name="chevron-small-left" size={40} color="black" />
              //     </Pressable>
              //   );
              // },
            }}
          />
          <Stack.Screen
            name="madina-historic-places/[id]"
            options={{
              headerTitle: "Madina Historic Places",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 18,
              },
              headerShown: false,
              // headerLeft: () => {
              //   return (
              //     <Pressable onPress={() => router.back()}>
              //       <Entypo name="chevron-small-left" size={40} color="black" />
              //     </Pressable>
              //   );
              // },
            }}
          />
          <Stack.Screen
            name="hajj-rituals/[id]"
            options={{
              headerTitle: "Hajj Ritual",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 18,
              },
              headerShown: false,
              // headerLeft: () => {
              //   return (
              //     <Pressable onPress={() => router.back()}>
              //       <Entypo name="chevron-small-left" size={40} color="black" />
              //     </Pressable>
              //   );
              // },
            }}
          />
          <Stack.Screen
            name="umrah-rituals/[id]"
            options={{
              headerTitle: "Umrah Ritual",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 18,
              },
              headerShown: false,
              // headerLeft: () => {
              //   return (
              //     <Pressable onPress={() => router.back()}>
              //       <Entypo name="chevron-small-left" size={40} color="black" />
              //     </Pressable>
              //   );
              // },
            }}
          />
          <Stack.Screen
            name="madina-rituals/[id]"
            options={{
              headerTitle: "Madina Ritual",
              headerTitleStyle: {
                fontWeight: "bold",
                fontSize: 18,
              },
              headerShown: false,
              // headerLeft: () => {
              //   return (
              //     <Pressable onPress={() => router.back()}>
              //       <Entypo name="chevron-small-left" size={40} color="black" />
              //     </Pressable>
              //   );
              // },
            }}
          />
          <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" />
        </View>
      </ThemeProvider>
    </ErrorBoundary>
    </I18nextProvider>
  );
}

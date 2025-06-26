import DateSlider from "@/components/home/date-slider";
import HomeHeader from "@/components/home/home-header";
import PrayerList from "@/components/home/prayer-list";
import QuickLinkBtn from "@/components/home/quick-link-btn";
import { getCurrentCity } from "@/hooks/useUserLocation";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  View,
  Linking,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView, Text } from "react-native";
import { useTranslation } from "react-i18next";
export default function HomeScreen() {
  const [city, setCity] = useState("Fetching...");

  const { t } = useTranslation();
  useEffect(() => {
    getCurrentCity().then(setCity);
  }, []);

  return (
    <SafeAreaView className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <HomeHeader />
        <View className="p-10 mb-8">
          <View className="flex-row gap-4 my-4">
            <Pressable
              className="bg-white p-5 rounded-3xl w-1/2"
              onPress={() =>
                router.navigate({
                  pathname: "/makkah",
                  params: { selected: 0 },
                })
              }
            >
              <View className="flex items-end">
                <Feather name="arrow-up-right" size={24} color="gray" />
                <Image
                  source={require("@/assets/images/umrah.png")}
                  className="w-28 h-28"
                />
              </View>
              <Text className="text-lg font-bold">{t("hajj")}</Text>
            </Pressable>
            <Pressable
              className="bg-white p-5 rounded-3xl w-1/2"
              onPress={() =>
                router.navigate({
                  pathname: "/makkah",
                  params: { selected: 1 },
                })
              }
            >
              <View className="flex items-end">
                <Feather name="arrow-up-right" size={24} color="gray" />
                <Image
                  source={require("@/assets/images/umrah.png")}
                  className="w-28 h-28"
                />
              </View>
              <Text className="text-lg font-bold">{t("umrah")}</Text>
            </Pressable>
          </View>

          <View className="flex-row gap-4 my-4">
            <Pressable
              className="bg-white p-5 rounded-3xl w-1/2"
              onPress={() => router.navigate("/madinah")}
            >
              <View className="flex items-end">
                <Feather name="arrow-up-right" size={24} color="gray" />
                <Image
                  source={require("@/assets/images/madina-kubba.webp")}
                  className="w-28 h-28"
                />
              </View>
              <Text className="text-lg font-bold">{t("madinaZiyarah")}</Text>
            </Pressable>
            <Pressable
              className="bg-white p-5 rounded-3xl w-1/2"
              onPress={() => router.navigate("/historic-places")}
            >
              <View className="flex items-end">
                <Feather name="arrow-up-right" size={24} color="gray" />
                <Image
                  source={require("@/assets/images/madinah.png")} // You'll need to add this image
                  className="w-28 h-28"
                />
              </View>
              <Text className="text-lg font-bold">{t("historicPlaces")}</Text>
            </Pressable>
          </View>

          {/* Prayer Time */}
          <View className="py-8 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl">
                {t("prayerTimeIn")}
              </Text>
              <Text className="text-3xl font-bold">{city}</Text>
              <Text className="text-lg text-green font-medium">
                {t("currentLocation")}
              </Text>
            </View>
            <View>
              <Image
                source={require("@/assets/images/thasbeeh.png")}
                className="w-28 h-28"
              />
            </View>
          </View>
          <DateSlider />

          {/* <PrayerTimeContainer /> */}
          <PrayerList />

          {/* Qibla, Dhikr Counter */}
          <View className="flex-row gap-4 my-6">
            <QuickLinkBtn
              title={t("qiblah")}
              subtitle={t("direction")}
              icon={require("@/assets/images/qiblah.png")}
              route="/qiblah-finder"
            />
            <QuickLinkBtn
              title={t("dhikr")}
              subtitle={t("counter")}
              icon={require("@/assets/images/counter.png")}
              route="/dikr-counter"
            />
          </View>
          {/* <QuickLinkBtn
            title={t("dhikrsAndDuas")}
            icon={require("@/assets/images/thasbeeh-brown.png")}
            route="/dikrs-and-duas"
            width="full"
          /> */}
          <TouchableOpacity
            className="my-4 bg-cyan-600 rounded-lg p-4 gap-2 flex-row items-center justify-center"
            onPress={() => Linking.openURL("https://www.hajcommittee.gov.in/")}
          >
            <Ionicons name="search" size={24} color="white" />
            <Text className="text-white font-bold text-lg">
              {t("searchYourCoverNumber")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="my-4 bg-green rounded-lg p-4 gap-2 flex-row items-center justify-center"
            onPress={() =>
              Linking.openURL("https://chat.whatsapp.com/yourGroupLink")
            }
          >
            <Ionicons name="logo-whatsapp" size={24} color="white" />
            <Text className="text-white font-bold text-lg">
              {t("askDoubtsOnWhatsApp")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

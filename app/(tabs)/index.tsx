import DateSlider from "@/components/home/date-slider";
import HomeHeader from "@/components/home/home-header";
import PrayerList from "@/components/home/prayer-list";
import PrayerTimeContainer from "@/components/home/prayer-time-container";
import QuickLinkBtn from "@/components/home/quick-link-btn";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import {
  Image,
  ScrollView,
  View,
  Linking,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView, Text } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-10 mb-8">
          <HomeHeader />
          <View className="flex-row gap-4 my-8">
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
              <Text className="text-lg font-bold">Hajj</Text>
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
              <Text className="text-lg font-bold">Umrah</Text>
            </Pressable>
          </View>
          <Pressable
            className="bg-white p-5 rounded-3xl w-full"
            onPress={() => router.navigate("/madinah")}
          >
            <View className="flex items-end">
              <Feather name="arrow-up-right" size={24} color="gray" />
              <Image
                source={require("@/assets/images/madinah.png")}
                className="w-28 h-28"
              />
            </View>
            <Text className="text-lg font-bold">Madina Ziyarat</Text>
          </Pressable>
          <View className="py-8 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl">Prayer time in</Text>
              <Text className="text-3xl font-bold">Malappuram</Text>
              <Text className="text-lg text-green font-medium">
                Wrong Location?
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
          <PrayerTimeContainer />
          <PrayerList />
          <View className="flex-row gap-4 my-8">
            <QuickLinkBtn
              title="Qiblah"
              subtitle="Direction"
              description="display the accurate Qibla direction based on the user's location"
              icon={require("@/assets/images/qiblah.png")}
              route="/qiblah-finder"
            />
            <QuickLinkBtn
              title="Dhikr"
              subtitle="Counter"
              description="display the accurate Qibla direction based on the user's location"
              icon={require("@/assets/images/counter.png")}
              route="/dikr-counter"
            />
          </View>
          <QuickLinkBtn
            title="Dhikrs & Duas"
            description="display the accurate Qibla direction based on the user's location"
            icon={require("@/assets/images/thasbeeh-brown.png")}
            route="/dikrs-and-duas"
            width="full"
          />
          <TouchableOpacity
            className="my-4 bg-green rounded-lg p-4 gap-2 flex-row items-center justify-center"
            onPress={() =>
              Linking.openURL("https://chat.whatsapp.com/yourGroupLink")
            }
          >
            <Ionicons name="logo-whatsapp" size={24} color="white" />
            <Text className="text-white font-bold text-lg">
              Ask Doubts on WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

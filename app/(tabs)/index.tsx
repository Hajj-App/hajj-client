import DateSlider from "@/components/home/date-slider";
import HomeHeader from "@/components/home/home-header";
import PrayerList from "@/components/home/prayer-list";
import PrayerTimeContainer from "@/components/home/prayer-time-container";
import QuickLinkBtn from "@/components/home/quick-link-btn";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView, Text } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-10">
          <HomeHeader />
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
            />
            <QuickLinkBtn
              title="Dhikr"
              subtitle="Counter"
              description="display the accurate Qibla direction based on the user's location"
              icon={require("@/assets/images/counter.png")}
            />
          </View>
          <QuickLinkBtn
            title="Dhikrs & Duas"
            description="display the accurate Qibla direction based on the user's location"
            icon={require("@/assets/images/thasbeeh-brown.png")}
            width="full"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

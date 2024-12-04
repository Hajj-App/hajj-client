import DateSlider from "@/components/home/date-slider";
import HomeHeader from "@/components/home/home-header";
import PrayerTimeContainer from "@/components/home/prayer-time-container";
import { ScrollView, View } from "react-native";
import { SafeAreaView, Text } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1">
      <View className="p-10">
        <HomeHeader />
        <View className="py-10">
          <Text className="text-3xl">Prayer time in</Text>
          <Text className="text-3xl font-bold">Malappuram</Text>
          <Text className="text-lg text-green font-medium">
            Wrong Location?
          </Text>
        </View>
        <DateSlider />
        <PrayerTimeContainer />
      </View>
    </SafeAreaView>
  );
}

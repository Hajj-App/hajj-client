import {
  View,
  Text,
  ImageBackground,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import React from "react";
import { Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Props = {};

const HistoricPlace = (props: Props) => {
  const router = useRouter();
  return (
    <View className="flex-1">
      <ImageBackground
        source={require("@/assets/images/makkah/makkah-img.webp")}
        resizeMode="cover"
        className="w-full h-[350px] items-center justify-start pt-14"
      >
        <View className="w-full flex-row items-center justify-between px-10">
          <Pressable
            onPress={() => router.back()}
            className=" bg-white/50 rounded-xl"
          >
            <Entypo name="chevron-small-left" size={40} color="black" />
          </Pressable>
          <View className="w-10 h-10 bg-white rounded-full"></View>
        </View>
      </ImageBackground>
      <View className="w-full h-20 relative bg-white mt-[-50px] rounded-t-[50px] items-end justify-end">
        <View className="p-5 bg-white shadow-xl absolute -top-10 right-10 rounded-full">
          <Image
            source={require("../assets/icons/share.png")}
            resizeMode="cover"
            className="w-10 h-10"
          />
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white px-5"
      >
        <Text className="font-bold text-[28px] text-green">Ihram</Text>
        {[1, 2, 3].map((item, index) => (
          <View key={index} className="gap-y-5 pt-5">
            <Text className="text-2xl font-bold">What is Ihram?</Text>
            <Text className="">
              Ihram is the sacred state you enter before starting the rituals of
              Hajj or Umrah. It’s more than just wearing specific clothes; it’s
              a spiritual transformation where you focus solely on worship and
              humility before Allah.
            </Text>
            <Text className="text-xl font-bold">How to Enter Ihram</Text>
            <Text className="text-lg leading-tight">
              Ihram is the sacred state you enter before starting the rituals of
              Hajj or Umrah. It’s more than just wearing specific clothes; it’s
              a spiritual Ihram is the sacred state you enter before starting
              the rituals of Hajj or Umrah. It’s more than just wearing specific
              clothes; it’s a spiritual Ihram is the sacred state you enter
              before starting the rituals of Hajj or Umrah. It’s more than just
              wearing specific clothes; it’s a spiritual Ihram is the sacred
              state you enter before starting the rituals of Hajj or Umrah. It’s
              more than just wearing specific clothes; it’s a spiritual Ihram is
              the sacred state you enter before starting the rituals of Hajj or
              Umrah. It’s more than just wearing specific clothes; it’s a
              spiritual Ihram is the sacred state you enter before starting the
              rituals of Hajj or Umrah. It’s more than just wearing specific
              clothes; it’s a spiritual
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default HistoricPlace;

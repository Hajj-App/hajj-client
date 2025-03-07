import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import PrayerTimeContainer from "./prayer-time-container";

export interface Timings {
  [key: string]: string;
}

const METHOD = 15;
const TUNE = "0,2,0,5,1,3,0,-1";
const PRAYER_NAMES = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Sunset", "Maghrib", "Isha"];

const formatPrayerTime = (rawTime: string | undefined) => {
  if (!rawTime) return "N/A";
  const cleanedTime = rawTime.split(" ")[0];
  const [hours, minutes] = cleanedTime.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const adjustedHours = hours % 12 || 12;
  return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function PrayerList() {
  const [error, setError] = useState("");
  const [date, setDate] = useState(new Date());
  const [timings, setTimings] = useState<Timings | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = useMemo(() => {
    return `http://api.aladhan.com/v1/calendar/${date.getFullYear()}/${date.getMonth() + 1}?method=${METHOD}&tune=${TUNE}`;
  }, [date]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied.");
          setLoading(false);
          return;
        } 

        let location = await Location.getCurrentPositionAsync({});
        const response = await fetch(
          `${apiUrl}&latitude=${location.coords.latitude}&longitude=${location.coords.longitude}`
        );
        const data = await response.json();

        setTimings(data.data[date.getDate() - 1]?.timings || {});
      } catch (error) {
        setError("Error fetching prayer timings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [apiUrl, date]);

  const getNextPrayer = () => {
    if (!timings || Object.keys(timings).length === 0) return null;

    const currentTime = new Date();
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    for (let i = 0; i < PRAYER_NAMES.length; i++) {
      let prayer = PRAYER_NAMES[i];
      if (!timings[prayer]) continue;

      const rawTime = timings[prayer];
      const cleanedTime = rawTime.split(" ")[0];
      const [hours, minutes] = cleanedTime.split(":").map(Number);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > currentMinutes) {
        const nextPrayer = PRAYER_NAMES[i + 1];
        const rawEndTime = timings[nextPrayer] || "";
        const cleanedEndTime = rawEndTime.split(" ")[0];
        return { 
          name: prayer, 
          startTime: cleanedTime, 
          endTime: cleanedEndTime 
        };
      }
    }

    const firstPrayer = PRAYER_NAMES[0];
    const rawFirstTime = timings[firstPrayer];
    const cleanedFirstTime = rawFirstTime.split(" ")[0];
    const rawEndTime = timings[PRAYER_NAMES[1]] || "";
    const cleanedEndTime = rawEndTime.split(" ")[0];
    return { 
      name: firstPrayer, 
      startTime: cleanedFirstTime, 
      endTime: cleanedEndTime 
    };
  };

  const getRemainingTime = (prayerTime: string | undefined) => {
    if (!prayerTime) return "N/A";

    const [hours, minutes] = prayerTime.split(":").map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(hours);
    prayerDate.setMinutes(minutes);
    prayerDate.setSeconds(0);

    const now = new Date();
    const diffInMinutes = Math.max(0, Math.floor((prayerDate.getTime() - now.getTime()) / 60000));
    return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
  };

  const nextPrayerInfo = getNextPrayer();
  const remainingTime = nextPrayerInfo ? getRemainingTime(nextPrayerInfo.startTime) : "N/A";

  return (
    <View className="flex-1 bg-gray-100 justify-start items-start ">
      {error ? (
        <Text className="text-red-500 text-lg">{error}</Text>
      ) : loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <PrayerTimeContainer
            prayerName={nextPrayerInfo?.name}
            startTime={formatPrayerTime(nextPrayerInfo?.startTime)}
            endTime={formatPrayerTime(nextPrayerInfo?.endTime)}
            remainingTime={remainingTime}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-4">
            {PRAYER_NAMES.map((prayer) => (
              <Pressable
                key={prayer}
                className={`p-3 rounded-xl shadow-md mx-2 items-start ${
                  prayer === nextPrayerInfo?.name ? "border-2 border-green bg-white" : "bg-gray-100"
                }`}
              >
                <Text className="text-base font-bold w-20 text-left">{prayer}</Text>
                <Text className="text-gray-600 text-left">Start at</Text>
                <Text className="text-base font-bold text-left text-gray-800">
                  {formatPrayerTime(timings?.[prayer])}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}
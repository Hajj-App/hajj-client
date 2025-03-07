import { View, Text, Image, Animated } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";

const QiblahFinder = () => {
  const [location, setLocation] = useState(null);
  const [qiblaAngle, setQiblaAngle] = useState(null);
  const [heading, setHeading] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      if (loc.coords) {
        const { latitude, longitude } = loc.coords;
        const qiblaDir = getQiblaDirection(latitude, longitude);
        setQiblaAngle(qiblaDir);
      }
    })();
  }, []);

  useEffect(() => {
    const magnetoSub = Magnetometer.addListener((data) => {
      const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      const compassHeading = (angle + 360) % 360;
      setHeading(compassHeading);
    });

    return () => {
      magnetoSub.remove();
    };
  }, []);

  useEffect(() => {
    if (qiblaAngle !== null) {
      Animated.timing(rotateAnim, {
        toValue: -(qiblaAngle - heading), // 🔹 Adjusting Rotation to Fix Directions
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [heading]);

  const getQiblaDirection = (lat, lon) => {
    const kaabaLat = 21.4225;
    const kaabaLon = 39.8262;
    const toRad = (deg) => (deg * Math.PI) / 180;

    const lat1 = toRad(lat);
    const lon1 = toRad(lon);
    const lat2 = toRad(kaabaLat);
    const lon2 = toRad(kaabaLon);
    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    return (bearing + 360) % 360;
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Animated.View
        style={{
          transform: [
            {
              rotate: rotateAnim.interpolate({
                inputRange: [-360, 360],
                outputRange: ["-360deg", "360deg"],
              }),
            },
          ],
        }}
      >
        {/* 🔹 Qibla Compass Image */}
        <Image
          source={require("@/assets/images/compass.png")}
          resizeMode="contain"
          className="w-80 h-80"
        />
        
        {/* 🔹 Kaaba Image at the Center */}
       
      </Animated.View>

      {location && (
        <View className="flex-row items-center gap-2 p-4 bg-gray-200 rounded-3xl mt-8">
          <Entypo name="location-pin" size={24} color="red" />
          <Text className="text-lg font-semibold">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Text>
        </View>
      )}
      <Text className="text-3xl font-bold py-4">{qiblaAngle?.toFixed(2)}°</Text>
      <Text className="text-xl text-gray-600">
        Compass Heading: {heading.toFixed(2)}°
      </Text>
    </View>
  );
};

export default QiblahFinder;

import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import { Magnetometer } from "expo-sensors";
import * as Location from "expo-location";

// Coordinates of the Kaaba in Mecca
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const QiblahFinder = () => {
  const [magnetometer, setMagnetometer] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [subscription, setSubscription] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate Qibla direction
  const calculateQiblaDirection = (latitude: number, longitude: number) => {
    // Convert all coordinates from degrees to radians
    const lat1 = (latitude * Math.PI) / 180;
    const lon1 = (longitude * Math.PI) / 180;
    const lat2 = (KAABA_LAT * Math.PI) / 180;
    const lon2 = (KAABA_LNG * Math.PI) / 180;

    // Calculate the angle
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    let angle = Math.atan2(y, x);

    // Convert from radians to degrees
    angle = (angle * 180) / Math.PI;

    // Normalize the angle
    angle = (angle + 360) % 360;

    return angle;
  };

  // Start magnetometer subscription
  const startMagnetometer = () => {
    Magnetometer.setUpdateInterval(100);
    const subscription = Magnetometer.addListener((data) => {
      const { x, y } = data;
      let angle = 0;
      if (y !== 0) {
        angle = Math.atan(-x / y) * (180 / Math.PI);
      } else if (x < 0) {
        angle = 90;
      } else if (x >= 0) {
        angle = -90;
      }

      if (y < 0) {
        angle = 180 + angle;
      } else if (y > 0 && x < 0) {
        angle = 360 + angle;
      }

      setMagnetometer(angle);
    });
    setSubscription(subscription);
  };

  // Stop magnetometer subscription
  const stopMagnetometer = () => {
    subscription?.remove();
    setSubscription(null);
  };

  // Get user's location
  const getLocationAsync = async () => {
    try {
      setIsLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setIsLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);

      // Calculate Qibla direction once we have the location
      const qiblaDirection = calculateQiblaDirection(
        location.coords.latitude,
        location.coords.longitude
      );
      setQiblaAngle(qiblaDirection);
      setIsLoading(false);
    } catch (error) {
      setErrorMsg("Could not get your location");
      setIsLoading(false);
      Alert.alert(
        "Error",
        "Failed to get your location. Please check your GPS settings."
      );
    }
  };

  // Initialize on component mount
  useEffect(() => {
    getLocationAsync();
    startMagnetometer();

    return () => {
      stopMagnetometer();
    };
  }, []);

  // The compass rotation based on magnetometer and qibla angle
  const compassRotation = magnetometer - qiblaAngle;
  const needleRotation = 360 - magnetometer;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#34D399" />
        <Text style={styles.text}>Finding Qibla direction...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qibla Finder</Text>

      <View style={styles.compassContainer}>
        <Image
          source={require("@/assets/images/qibliah-direction.png")}
          resizeMode="contain"
          style={[
            styles.compass,
            { transform: [{ rotate: `${compassRotation}deg` }] },
          ]}
        />
        {/* <View style={[styles.needle, { transform: [{ rotate: `${needleRotation}deg` }] }]}>
          <Entypo name="arrow-long-up" size={40} color="red" />
        </View> */}
      </View>

      {location && (
        <View style={styles.locationBox}>
          <Entypo name="location-pin" size={24} color="red" />
          <Text>
            {location.coords.latitude.toFixed(4)},{" "}
            {location.coords.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      <Text style={styles.angle}>{qiblaAngle.toFixed(2)}°</Text>
      <Text style={styles.instructions}>
        Point the red arrow toward the Qibla direction for prayer
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  compassContainer: {
    position: "relative",
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  compass: {
    width: "100%",
    height: "100%",
  },
  needle: {
    position: "absolute",
    alignItems: "center",
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 24,
    marginTop: 20,
  },
  angle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
  },
  instructions: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  text: {
    marginTop: 10,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default QiblahFinder;

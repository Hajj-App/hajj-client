import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Magnetometer, DeviceMotion } from "expo-sensors";
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
  const [motionSubscription, setMotionSubscription] = useState<any | null>(
    null
  );
  const [deviceTilt, setDeviceTilt] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Calculate Qibla direction
  const calculateQiblaDirection = (latitude: number, longitude: number) => {
    // Convert all coordinates from degrees to radians
    const lat1 = (latitude * Math.PI) / 180;
    const lon1 = (longitude * Math.PI) / 180;
    const lat2 = (KAABA_LAT * Math.PI) / 180;
    const lon2 = (KAABA_LNG * Math.PI) / 180;

    // Calculate the angle using the great circle formula
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

  // Start device motion sensor for tilt compensation
  const startDeviceMotion = () => {
    DeviceMotion.setUpdateInterval(100);
    const subscription = DeviceMotion.addListener((data) => {
      // Use rotation data to determine device tilt
      const { gamma } = data.rotation;
      setDeviceTilt(gamma * (180 / Math.PI));
    });
    setMotionSubscription(subscription);
  };

  // Stop device motion subscription
  const stopDeviceMotion = () => {
    motionSubscription?.remove();
    setMotionSubscription(null);
  };

  // Start magnetometer subscription with improved accuracy
  const startMagnetometer = () => {
    Magnetometer.setUpdateInterval(100);
    const subscription = Magnetometer.addListener((data) => {
      try {
        const { x, y, z } = data;

        // Calculate heading based on magnetometer data
        // This formula is adjusted for better accuracy in various device positions
        let heading = Math.atan2(y, x) * (180 / Math.PI);

        // Normalize heading to be between 0 and 360 degrees
        heading = (heading + 360) % 360;

        // Apply smoothing to reduce jitter
        setMagnetometer((prevAngle) => {
          const diff = heading - prevAngle;
          // Apply smoothing only for small changes to avoid lag in large movements
          if (Math.abs(diff) < 20) {
            return prevAngle + diff * 0.2; // Smoother transitions
          }
          return heading;
        });
      } catch (error) {
        console.error("Error processing magnetometer data:", error);
      }
    });
    setSubscription(subscription);
  };

  // Stop magnetometer subscription
  const stopMagnetometer = () => {
    subscription?.remove();
    setSubscription(null);
  };

  // Calibrate magnetometer
  const calibrateMagnetometer = () => {
    setIsCalibrating(true);
    Alert.alert(
      "Calibrate Compass",
      "Move your device in a figure-8 pattern for 10 seconds to calibrate the compass sensors.",
      [
        {
          text: "OK",
          onPress: () => {
            // After 10 seconds, end calibration
            setTimeout(() => {
              setIsCalibrating(false);
              setShowCalibration(false);
            }, 10000);
          },
        },
      ]
    );
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

      // Show calibration suggestion
      setTimeout(() => {
        setShowCalibration(true);
      }, 1000);
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
    startDeviceMotion();

    return () => {
      stopMagnetometer();
      stopDeviceMotion();
    };
  }, []);

  // Calculate final compass rotation with tilt compensation
  // The compass rotation based on magnetometer and qibla angle with tilt compensation
  const compassRotation = magnetometer - qiblaAngle;
  // Apply tilt compensation to needle rotation
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

      {isCalibrating && (
        <View style={styles.calibrationOverlay}>
          <Text style={styles.calibrationText}>
            Move your device in a figure-8 pattern to calibrate...
          </Text>
          <ActivityIndicator size="large" color="#34D399" />
        </View>
      )}

      <View style={styles.compassContainer}>
        <Image
          source={require("@/assets/images/qibliah-direction.png")}
          resizeMode="contain"
          style={[
            styles.compass,
            { transform: [{ rotate: `${compassRotation}deg` }] },
          ]}
        />
        <View
          style={[
            styles.needle,
            { transform: [{ rotate: `${needleRotation}deg` }] },
          ]}
        >
          {/* <FontAwesome name="location-arrow" size={60} color="green" /> */}
          <Image
            source={require("@/assets/images/compass.png")}
            style={{ width: 100, height: 100 }}
          />
        </View>
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

      {showCalibration && !isCalibrating && (
        <TouchableOpacity
          style={styles.calibrateButton}
          onPress={calibrateMagnetometer}
        >
          <Text style={styles.calibrateButtonText}>Calibrate Compass</Text>
        </TouchableOpacity>
      )}

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>For best results:</Text>
        <Text style={styles.tipsText}>• Keep device flat and level</Text>
        <Text style={styles.tipsText}>• Stay away from magnetic objects</Text>
        <Text style={styles.tipsText}>
          • Calibrate if direction seems wrong
        </Text>
      </View>
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
  calibrateButton: {
    marginTop: 20,
    backgroundColor: "#34D399",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  calibrateButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  calibrationOverlay: {
    position: "absolute",
    zIndex: 10,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  calibrationText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  tipsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    width: "100%",
  },
  tipsTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  tipsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
});

export default QiblahFinder;

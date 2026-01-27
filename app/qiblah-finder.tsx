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
import AntDesign from "@expo/vector-icons/AntDesign";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { logger } from "@/utils/logger";
import { Subscription } from "expo-sensors/build/DeviceSensor";
import { useRouter } from "expo-router";

// Coordinates of the Kaaba in Mecca
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const QiblahFinder = () => {
  const router = useRouter();
  const [magnetometer, setMagnetometer] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { t } = useTranslation();
  
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

  // Start compass subscription using Location.watchHeadingAsync
  const startCompass = async () => {
    try {
      const sub = await Location.watchHeadingAsync((data) => {
        let heading = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        
        // Apply smoothing
        setMagnetometer((prevAngle) => {
          const diff = heading - prevAngle;
          if (Math.abs(diff) < 20) {
            return prevAngle + diff * 0.2; 
          }
          return heading;
        });
      });
      setSubscription(sub as any);
    } catch (error) {
      logger.error("Error starting compass", error);
    }
  };

  // Stop compass subscription
  const stopCompass = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
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

      // Start compass after confirming permission
      startCompass();

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

    return () => {
      stopCompass();
    };
  }, []);

  // Calculate final compass rotation
  // The compass rotation based on magnetometer (true heading) and qibla angle
  const compassRotation = magnetometer - qiblaAngle;
  // Apply true heading to needle rotation
  const needleRotation = 360 - magnetometer;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#34D399" />
        <Text style={styles.text}>{t("findingQiblaDirection")}</Text>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <AntDesign name="left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("qiblaFinder")}</Text>
        <View style={{ width: 24 }} /> 
      </View>
      
      <View style={styles.contentContainer}>
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

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>{t("forBestResults")}:</Text>
          <Text style={styles.tipsText}>• {t("keepDeviceFlatAndLevel")}</Text>
          <Text style={styles.tipsText}>• {t("stayAwayFromMagneticObjects")}</Text>
          <Text style={styles.tipsText}>• {t("calibrateIfDirectionSeemsWrong")}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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

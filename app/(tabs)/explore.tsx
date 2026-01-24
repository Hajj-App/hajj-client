import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import TravelAdvisories from "@/components/TravelAdvisories";
import UpcomingEvents from "@/components/UpcomingEvents";
import LatestUpdates from "@/components/LatestUpdates";
import { useTranslation } from "react-i18next";
import { clearNewUpdatesFlag } from "@/utils/tabBadge";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { API } from "@/constants/api";
import { FALLBACK_WEATHER } from "@/constants/fallbacks";
import { logger } from "@/utils/logger";
import { fetchWithRetry } from "@/utils/retry";

export default function ExploreScreen() {
  const [weather, setWeather] = useState<{
    [key: string]: { temp: number; description: string };
  }>({});
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const { isConnected } = useNetworkStatus();
  const { t } = useTranslation();

  const cities = ["Makka", "Madinah"];
  const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

  const fetchWeather = useCallback(async () => {
    // If offline, use fallback data
    if (isConnected === false) {
      setWeather(FALLBACK_WEATHER);
      setWeatherError("Offline mode");
      return;
    }

    if (!apiKey) {
      logger.warn("Weather API key not configured");
      setWeather(FALLBACK_WEATHER);
      return;
    }

    try {
      setWeatherError(null);
      const weatherData: {
        [key: string]: { temp: number; description: string };
      } = {};

      for (const city of cities) {
        try {
          // Using HTTPS instead of HTTP
          const response = await fetchWithRetry(
            API.WEATHER.getUrl(city, apiKey),
            { method: 'GET' },
            { maxRetries: 2 }
          );
          
          const data = await response.json();

          if (data.main && data.weather) {
            weatherData[city] = {
              temp: Math.round(data.main.temp),
              description: data.weather[0]?.description || 'Unknown',
            };
          }
        } catch (cityError) {
          logger.warn(`Failed to fetch weather for ${city}`, cityError);
          // Use fallback for this city
          weatherData[city] = FALLBACK_WEATHER[city as keyof typeof FALLBACK_WEATHER] || {
            temp: 30,
            description: 'Unable to load',
          };
        }
      }

      setWeather(weatherData);
    } catch (err) {
      logger.error("Weather fetch failed", err);
      setWeather(FALLBACK_WEATHER);
      setWeatherError("Failed to load weather");
    }
  }, [apiKey, isConnected]);

  useEffect(() => {
    fetchWeather();
    
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  useEffect(() => {
    // Clear the new updates badge when the explore tab is visited
    clearNewUpdatesFlag();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("explore")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("stayUpdatedWithLatestNewsAndEvents")}
          </Text>
        </View>
        <LatestUpdates />
        <UpcomingEvents />
        <TravelAdvisories />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("weatherUpdates")}</Text>
          <View style={styles.weatherContainer}>
            {cities.map((city) => (
              <View key={city} style={styles.weatherCity}>
                <Text style={styles.weatherCityName}>{city}</Text>
                <View style={styles.weatherInfo}>
                  <Text style={styles.weatherTemp}>
                    {weather[city] ? `${weather[city].temp}°C` : "Loading..."}
                  </Text>
                  <Text style={styles.weatherDesc}>
                    {weather[city] ? weather[city].description : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    marginBottom: 10,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    flex: 1,
    marginBottom: Platform.OS === "ios" ? 50 : 0,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  weatherContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weatherCity: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    width: "48%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weatherCityName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  weatherInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: "bold",
  },
  weatherDesc: {
    fontSize: 14,
    color: "#666",
  },
});

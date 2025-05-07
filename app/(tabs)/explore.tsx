import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import TravelAdvisories from "@/components/TravelAdvisories";
import UpcomingEvents from "@/components/UpcomingEvents";
import LatestUpdates from "@/components/LatestUpdates";
import { useTranslation } from "react-i18next";
import { getDocs, collection } from "firebase/firestore";
import { firestore } from "@/utils/firebase";

// Define types for our data
type NewsItem = {
  id: number;
  title: string;
  image: any;
  date: string;
  description: string;
};

// Sample data for news updates
const newsUpdates: NewsItem[] = [
  {
    id: 1,
    title: "Hajj 2024 Registration Opens",
    image: require("@/assets/images/makkah/makkah-img.webp"),
    date: "May 15, 2024",
    description:
      "The Ministry of Hajj and Umrah has announced the opening of registration for Hajj 2024.",
  },
  {
    id: 2,
    title: "New Facilities at Masjid Al Haram",
    image: require("@/assets/images/madinah.png"),
    date: "May 10, 2024",
    description:
      "New cooling systems and facilities have been installed at Masjid Al Haram for pilgrims.",
  },
  {
    id: 3,
    title: "Health Guidelines for Pilgrims",
    image: require("@/assets/images/umrah.png"),
    date: "May 5, 2024",
    description:
      "Health authorities have issued new guidelines for pilgrims traveling for Hajj and Umrah.",
  },
];

export default function ExploreScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const newsCarouselRef = useRef<FlatList>(null);
  const [weather, setWeather] = useState<{
    [key: string]: { temp: number; description: string };
  }>({});

  // Firestore data states
  const [travelAdvisories, setTravelAdvisories] = useState<any[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  // Fetch Firestore data
  useEffect(() => {
    const fetchFirestoreData = async () => {
      try {
        if (!firestore) return;
        const travelSnap = await getDocs(collection(firestore, "travel_advisories"));
        setTravelAdvisories(travelSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const liveSnap = await getDocs(collection(firestore, "live_updates"));
        setLiveUpdates(liveSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const eventsSnap = await getDocs(collection(firestore, "upcoming_events"));
        setUpcomingEvents(eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching Firestore data:", err);
      }
    };
    fetchFirestoreData();
  }, []);

  // Weather Updates

  const cities = ["Makka", "Madinah"];
  const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const weatherData: {
          [key: string]: { temp: number; description: string };
        } = {};

        for (const city of cities) {
          const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
          const response = await axios.get(apiUrl);
          const data = response.data;

          weatherData[city] = {
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
          };
        }

        setWeather(weatherData);
      } catch (err) {
        console.error("Weather not fetching", err);
      }
    };

    fetchWeather();
  }, []);

  // Auto-scroll for news carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (newsCarouselRef.current && newsUpdates.length > 0) {
        const nextIndex = (activeSlide + 1) % newsUpdates.length;
        newsCarouselRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setActiveSlide(nextIndex);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSlide]);

  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("explore")}</Text>
          <Text style={styles.headerSubtitle}>
            {t("stayUpdatedWithLatestNewsAndEvents")}
          </Text>
        </View>
        {typeof LatestUpdates === 'function' ? <LatestUpdates data={liveUpdates} /> : <LatestUpdates />}
        {typeof UpcomingEvents === 'function' ? <UpcomingEvents data={upcomingEvents} /> : <UpcomingEvents />}
        {typeof TravelAdvisories === 'function' ? <TravelAdvisories data={travelAdvisories} /> : <TravelAdvisories />}
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

import { 
  StyleSheet, 
  Image, 
  ScrollView, 
  View, 
  Text, 
  Dimensions, 
  FlatList, 
  TouchableOpacity,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import axios from "axios";

// Define types for our data
type NewsItem = {
  id: number;
  title: string;
  image: any;
  date: string;
  description: string;
};

type EventItem = {
  id: number;
  title: string;
  date: string;
  location: string;
};

type AdvisoryItem = {
  id: number;
  country: string;
  update: string;
  date: string;
};

// Sample data for news updates
const newsUpdates: NewsItem[] = [
  {
    id: 1,
    title: "Hajj 2024 Registration Opens",
    image: require("@/assets/images/makkah/makkah-img.webp"),
    date: "May 15, 2024",
    description: "The Ministry of Hajj and Umrah has announced the opening of registration for Hajj 2024."
  },
  {
    id: 2,
    title: "New Facilities at Masjid Al Haram",
    image: require("@/assets/images/madinah.png"),
    date: "May 10, 2024",
    description: "New cooling systems and facilities have been installed at Masjid Al Haram for pilgrims."
  },
  {
    id: 3,
    title: "Health Guidelines for Pilgrims",
    image: require("@/assets/images/umrah.png"),
    date: "May 5, 2024",
    description: "Health authorities have issued new guidelines for pilgrims traveling for Hajj and Umrah."
  }
];

// Sample data for upcoming events
const upcomingEvents: EventItem[] = [
  {
    id: 1,
    title: "Pre-Hajj Orientation",
    date: "June 1, 2024",
    location: "Online Webinar"
  },
  {
    id: 2,
    title: "Hajj Preparation Workshop",
    date: "June 10, 2024",
    location: "Islamic Center"
  },
  {
    id: 3,
    title: "Hajj Rituals Seminar",
    date: "June 15, 2024",
    location: "Community Hall"
  }
];

// Sample data for travel advisories
const travelAdvisories: AdvisoryItem[] = [
  {
    id: 1,
    country: "Saudi Arabia",
    update: "Visa processing times have been reduced for Hajj pilgrims.",
    date: "May 12, 2024"
  },
  {
    id: 2,
    country: "International",
    update: "New flight routes added for Hajj season from major cities.",
    date: "May 8, 2024"
  },
  {
    id: 3,
    country: "Health Advisory",
    update: "Vaccination requirements updated for Hajj 2024.",
    date: "May 3, 2024"
  }
];

export default function ExploreScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [activeSlide, setActiveSlide] = useState(0);
  const newsCarouselRef = useRef<FlatList>(null);
  const [weather, setWeather] = useState<{ [key: string]: { temp: number; description: string } }>({});



  
  // Weather Updates 

  const cities = ["Makka", "Madinah"];
  const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY
  // console.log("API Key:", apiKey);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const weatherData: { [key: string]: { temp: number; description: string } } = {};
        
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
          animated: true
        });
        setActiveSlide(nextIndex);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeSlide]);

  const renderNewsItem = ({ item }: { item: NewsItem }) => {
    return (
      <View style={[styles.carouselItem, { width: screenWidth - 60 }]}>
        <Image source={item.image} style={styles.carouselImage} />
        <View style={styles.carouselContent}>
          <Text style={styles.carouselTitle}>{item.title}</Text>
          <Text style={styles.carouselDate}>{item.date}</Text>
          <Text style={styles.carouselDescription}>{item.description}</Text>
        </View>
      </View>
    );
  }; 

  const renderEventItem = ({ item }: { item: EventItem }) => {
    return (
      <View style={[styles.eventItem, { width: screenWidth - 80 }]}>
        <View style={styles.eventIconContainer}>
          <Feather name="calendar" size={24} color="#31C462" />
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDate}>{item.date}</Text>
          <Text style={styles.eventLocation}>{item.location}</Text>
        </View>
      </View>
    );
  };

  const handleNewsScroll = (event: any) => {
    const slideSize = screenWidth - 60;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeSlide) {
      setActiveSlide(index);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Stay updated with the latest news and events</Text>
        </View>

    {/* Latest Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Updates</Text>
          <FlatList
            ref={newsCarouselRef}
            data={newsUpdates}
            renderItem={renderNewsItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={screenWidth - 60}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            onMomentumScrollEnd={handleNewsScroll}
          />
          <View style={styles.paginationContainer}>
            {newsUpdates.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { backgroundColor: index === activeSlide ? '#31C462' : '#D9D9D9' }
                ]}
              />
            ))}
          </View>
        </View>

            {/* Upcoming Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <FlatList
            data={upcomingEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
          />
        </View>

            {/* Travel Advisories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Advisories</Text>
          {travelAdvisories.map(advisory => (
            <View key={advisory.id} style={styles.advisoryItem}>
              <View style={styles.advisoryHeader}>
                <Text style={styles.advisoryCountry}>{advisory.country}</Text>
                <Text style={styles.advisoryDate}> {advisory.date}</Text>
              </View>
              <Text style={styles.advisoryUpdate}>{advisory.update}</Text>
            </View>
          ))}
        </View>

          {/* Weather Updates */}
       <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather Updates</Text>
          <View style={styles.weatherContainer}>
            {cities.map((city) => (
              <View key={city} style={styles.weatherCity}>
                <Text style={styles.weatherCityName}>{city}</Text>
                <View style={styles.weatherInfo}>
                  <Text style={styles.weatherTemp}>{weather[city] ? `${weather[city].temp}°C` : "Loading..."}</Text>
                  <Text style={styles.weatherDesc}>{weather[city] ? weather[city].description : ""}</Text>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  carouselItem: {
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  carouselImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  carouselContent: {
    padding: 15,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  carouselDate: {
    fontSize: 14,
    color: '#31C462',
    marginBottom: 8,
  },
  carouselDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(49, 196, 98, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#31C462',
    marginBottom: 3,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
  },
  advisoryItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  advisoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  advisoryCountry: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  advisoryDate: {
    fontSize: 14,
    color: '#666',
  },
  advisoryUpdate: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  weatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherCity: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weatherCityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  weatherDesc: {
    fontSize: 14,
    color: '#666',
  },
});

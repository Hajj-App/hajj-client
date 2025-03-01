import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';

export interface Timings {
    [key: string]: string;
}

const METHOD = 15; // Moonsighting Committee Worldwide
const TUNE = '0,2,0,5,1,3,0,-1';
const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Sunset', 'Maghrib', 'Isha'];

export default function App() {
    const [error, setError] = useState('');
    const [date, setDate] = useState(new Date());
    const [timings, setTimings] = useState<Timings | null>(null);
    const [loading, setLoading] = useState(true);

    const apiUrl = useMemo(() => {
        return `http://api.aladhan.com/v1/calendar/${date.getFullYear()}/${date.getMonth() + 1}?method=${METHOD}&tune=${TUNE}`;
    }, [date]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Location permission denied.');
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
                setError('Error fetching prayer timings.');
            } finally {
                setLoading(false);
            }
        })();
    }, [apiUrl, date]);

    const changeDate = useCallback((days: number) => {
        setDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setDate(prevDate.getDate() + days);
            return newDate;
        });
    }, []);

    const getNextPrayer = () => {
        if (!timings) return null;
        const currentTime = new Date();
        for (let prayer of PRAYER_NAMES) {
            const prayerTime = new Date(date);
            const [hours, minutes] = timings[prayer].split(':').map(Number);
            prayerTime.setHours(hours, minutes, 0);
            if (prayerTime > currentTime) {
                return prayer;
            }
        }
        return null;
    };

    const nextPrayer = getNextPrayer();

    return (
        <View className="flex-1 bg-gray-100 justify-start items-start">
            {error ? (
                <Text className="text-red-500 text-lg">{error}</Text>
            ) : loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
                    {PRAYER_NAMES.map((prayer) => (
                        <Pressable
                            key={prayer}
                            className={`p-3 rounded-lg shadow-md mx-2 items-start ${prayer === nextPrayer ? 'border-2 border-green-500 bg-white' : 'bg-gray-100'}`}
                        >
                            <Text className="text-base font-bold text-left">{prayer}</Text>
                            <Text className="text-gray-600 text-left">Start at</Text>
                            <Text className="text-base font-bold text-left">{timings?.[prayer]}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

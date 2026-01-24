import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import ml from './locales/ml.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true as const,
  detect: (callback: (lng: string | readonly string[] | undefined) => void) => {
    (async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('user-language');
        if (savedLanguage) {
          callback(savedLanguage);
          return;
        }

        // Get device locale using new API
        const locales = getLocales();
        const locale = locales[0]?.languageCode || 'en';
        callback(locale);
      } catch (error) {
        console.log('Error reading language', error);
        callback('en'); // fallback
      }
    })();
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    (async () => {
      try {
        await AsyncStorage.setItem('user-language', lng);
      } catch (error) {
        console.log('Error saving language', error);
      }
    })();
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ml: { translation: ml },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;

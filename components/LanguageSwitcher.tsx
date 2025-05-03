import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../lib/i18n/i18n';

export const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const currentLanguage = i18n.language;

  const switchLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View className="flex-row space-x-4">
      <TouchableOpacity
        onPress={() => switchLanguage('en')}
        className={`px-4 py-2 rounded-lg ${
          currentLanguage === 'en' ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      >
        <Text
          className={`${
            currentLanguage === 'en' ? 'text-white' : 'text-gray-700'
          }`}
        >
          {t('common.english')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => switchLanguage('ml')}
        className={`px-4 py-2 rounded-lg ${
          currentLanguage === 'ml' ? 'bg-blue-500' : 'bg-gray-200'
        }`}
      >
        <Text
          className={`${
            currentLanguage === 'ml' ? 'text-white' : 'text-gray-700'
          }`}
        >
          {t('common.malayalam')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 
import { View, Text, TouchableOpacity, Modal } from "react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n/i18n";
import { Ionicons } from "@expo/vector-icons";

const HomeHeader = () => {
  const { t } = useTranslation();
  const currentLanguage = i18n.language;
  const [showDropdown, setShowDropdown] = useState(false);

  const switchLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowDropdown(false);
  };

  return (
    <View className="flex-row justify-end top-10 right-5 p-2">
      <View>
        <TouchableOpacity
          onPress={() => setShowDropdown(!showDropdown)}
          className="flex-row items-center gap-1 px-3 py-1 rounded-lg bg-gray-200"
        >
          <Text className="text-gray-700">
            {currentLanguage === "en" ? "EN" : "ML"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="gray" />
        </TouchableOpacity>

        <Modal
          visible={showDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          >
            <View className="absolute right-4 top-12 bg-white rounded-lg shadow-lg">
              <TouchableOpacity
                onPress={() => switchLanguage("en")}
                className="px-4 py-2 border-b border-gray-200"
              >
                <Text className="text-gray-700">EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchLanguage("ml")}
                className="px-4 py-2"
              >
                <Text className="text-gray-700">ML</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
};

export default HomeHeader;

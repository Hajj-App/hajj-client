import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getQnAItems } from "@/utils/firestoreService";
import { logger } from "@/utils/logger";
import Ionicons from "@expo/vector-icons/Ionicons";

interface QnAItem {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: "audio" | "text";
  fileName: string;
}

const QnAScreen = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"audio" | "text">("audio");
  const [items, setItems] = useState<QnAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getQnAItems(activeTab);
      setItems(data);
    } catch (error) {
      logger.error("Failed to fetch Q&A items", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleOpenPDF = (url: string) => {
    Linking.openURL(url).catch((err) => {
      logger.error("Failed to open PDF link", err);
    });
  };

  const renderItem = ({ item }: { item: QnAItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenPDF(item.fileUrl)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.fileType === "audio" ? "musical-notes" : "document-text"}
          size={24}
          color="#31C462"
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("qnaSection")}</Text>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab("audio")}
          style={[styles.tab, activeTab === "audio" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "audio" && styles.activeTabText,
            ]}
          >
            {t("audioLessons")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("text")}
          style={[styles.tab, activeTab === "text" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "text" && styles.activeTabText,
            ]}
          >
            {t("textLessons")}
          </Text>
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#31C462" />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("noLessonsAvailable")}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#31C46220",
    borderWidth: 1,
    borderColor: "#31C462",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#31C462",
    fontWeight: "bold",
  },
  listContent: {
    padding: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#31C46210",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#777",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default QnAScreen;

/**
 * Shared Ritual Detail Screen Component
 * 
 * This component handles the display of ritual details for Hajj, Umrah, and Madina rituals.
 * It supports both the new schema (rituals collection) and legacy schemas.
 */

import {
  View,
  Text,
  ImageBackground,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Linking,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { Entypo, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import { getFilesWithUrls } from "../../utils/storageUtils";
import { StorageFile } from "../../utils/storageTypes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/utils/firebase";
import AudioPlayerModal from "@/components/AudioPlayerModal";
import ImageModal from "@/components/ImageModal";
import PdfViewerModal from "@/components/PdfViewerModal";
import { useTranslation } from "react-i18next";
import { logger } from "@/utils/logger";
import { COLLECTIONS } from "@/types/firestore";
import { formatErrorForDisplay } from "@/utils/errorHandler";

// Types
export type RitualType = 'hajj' | 'umrah' | 'madina';

interface RitualMedia {
  images: StorageFile[];
  audio: StorageFile[];
  documents: StorageFile[];
}

interface RitualContent {
  id: string;
  name: string;
  description: string | string[];
  content_image?: string;
  paragraphs?: {
    title: string;
    description?: string | string[];
    content?: string[];
  }[];
  _legacyFolderId?: number;
  type?: string;
  video_link?: string;
}

interface RitualDetailScreenProps {
  ritualId: string;
  ritualType: RitualType;
  legacyCollection: string;
}

/**
 * Custom hook for managing audio setup
 */
const useAudioSetup = () => {
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        logger.error("Error setting up audio mode", error);
      }
    };
    setupAudio();
  }, []);
};

/**
 * Custom hook for fetching ritual data
 */
const useRitualData = (
  ritualId: string,
  ritualType: RitualType,
  legacyCollection: string
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ritualContent, setRitualContent] = useState<RitualContent | null>(null);
  const [storagePath, setStoragePath] = useState(`${ritualType}/${ritualId}`);
  const [media, setMedia] = useState<RitualMedia>({
    images: [],
    audio: [],
    documents: [],
  });

  const fetchRitualMedia = useCallback(async (customPath?: string) => {
    try {
      const pathToUse = customPath || storagePath;
      const files = await getFilesWithUrls(pathToUse);

      const images: StorageFile[] = [];
      const audio: StorageFile[] = [];
      const documents: StorageFile[] = [];

      files.forEach((file) => {
        const contentType = file.contentType || "";
        if (contentType.startsWith("image/")) {
          images.push(file);
        } else if (contentType.startsWith("audio/")) {
          audio.push(file);
        } else if (
          contentType === "application/pdf" ||
          contentType.includes("document")
        ) {
          documents.push(file);
        }
      });

      setMedia({ images, audio, documents });
    } catch (storageError: any) {
      logger.error("Storage error", storageError);
      // Only show error for actual failures, not missing files
      if (storageError.code !== "storage/object-not-found") {
        setError(formatErrorForDisplay(storageError));
      }
    }
  }, [storagePath, ritualId]);

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        setLoading(true);
        setError(null);

        // Auth is handled globally in _layout.tsx
        if (!firestore) {
          throw new Error("Firestore is not initialized");
        }

        let foundRitual = false;

        // Try new schema first
        try {
          const ritualDoc = await getDoc(
            doc(firestore, COLLECTIONS.RITUALS, ritualId)
          );

          if (ritualDoc.exists()) {
            const data = ritualDoc.data();
            const paragraphs = (data.paragraphs || []).map((p: any) => ({
              title: p.title || '',
              description: p.content || p.description || [],
              content: p.content || p.description || [],
            }));
            
            setRitualContent({
              id: ritualDoc.id,
              name: data.name || "Untitled",
              description: data.description || "",
              paragraphs,
              _legacyFolderId: data._legacyFolderId,
              type: data.type,
              video_link: data.video_link,
            });

            if (data._legacyFolderId) {
              setStoragePath(`${ritualType}/${data._legacyFolderId}`);
            } else {
              setStoragePath(`rituals/${ritualType}/${ritualId}`);
            }
            foundRitual = true;
          }
        } catch (newSchemaError) {
          logger.debug("New schema lookup failed, trying legacy", newSchemaError);
        }

        // Fallback to legacy schema
        if (!foundRitual) {
          const ritualDoc = await getDoc(
            doc(firestore, legacyCollection, ritualId)
          );

          if (!ritualDoc.exists()) {
            throw new Error("Ritual not found");
          }

          const data = ritualDoc.data();
          setRitualContent({
            id: ritualDoc.id,
            name: data.name || "Untitled",
            description: data.description || "",
            paragraphs: data.paragraphs || [],
            video_link: data.video_link,
          });
          setStoragePath(`${ritualType}/${ritualId}`);
        }

        await fetchRitualMedia();
      } catch (err) {
        logger.error("Error fetching ritual", err);
        setError("Failed to load ritual data");
      } finally {
        setLoading(false);
      }
    };

    initializeAndFetch();
  }, [ritualId, ritualType, legacyCollection, fetchRitualMedia]);

  return {
    loading,
    setLoading,
    error,
    setError,
    ritualContent,
    media,
    storagePath,
    fetchRitualMedia,
  };
};

/**
 * Shared Ritual Detail Screen Component
 */
export const RitualDetailScreen: React.FC<RitualDetailScreenProps> = ({
  ritualId,
  ritualType,
  legacyCollection,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Audio setup
  useAudioSetup();

  // Data fetching
  const {
    loading,
    setLoading,
    error,
    setError,
    ritualContent,
    media,
    storagePath,
    fetchRitualMedia,
  } = useRitualData(ritualId, ritualType, legacyCollection);

  // Modal states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<StorageFile | null>(null);

  // Helper functions
  const getDescriptionText = (description: string | string[]): string => {
    if (Array.isArray(description)) {
      return description.join("\n\n");
    }
    return description;
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchRitualMedia(storagePath);
    } catch (err) {
      setError("Failed to refresh content");
    } finally {
      setLoading(false);
    }
  };

  // Render content
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#31C462" />
          <Text style={styles.loadingText}>{t("loadingRitual")}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handleRefresh}>
            <Text style={styles.retryText}>{t("tapToRetry")}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <Text style={styles.title}>
          {ritualContent?.name || t("ritualDetails")}
        </Text>

        {/* Description */}
        {ritualContent?.description && (
          <Text style={styles.description}>
            {getDescriptionText(ritualContent.description)}
          </Text>
        )}

        {/* Paragraphs */}
        {ritualContent?.paragraphs?.map((paragraph, index) => (
          <View key={index} style={styles.paragraphContainer}>
            {paragraph.title && (
              <Text style={styles.paragraphTitle}>{paragraph.title}</Text>
            )}
            {(paragraph.content || paragraph.description) && (
              <Text style={styles.paragraphContent}>
                {getDescriptionText(paragraph.content || paragraph.description || [])}
              </Text>
            )}
          </View>
        ))}

        {/* Images Section */}
        {media.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("images")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {media.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImage(image.downloadURL)}
                >
                  <Image
                    source={{ uri: image.downloadURL }}
                    style={styles.thumbnail}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Audio Section */}
        {media.audio.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("audio")}</Text>
            {media.audio.map((audio, index) => (
              <TouchableOpacity
                key={index}
                style={styles.audioItem}
                onPress={() => setSelectedAudio(audio)}
              >
                <FontAwesome5 name="play-circle" size={24} color="#a78638" />
                <Text style={styles.audioText} numberOfLines={1}>
                  {audio.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Documents Section */}
        {media.documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("documents")}</Text>
            {media.documents.map((doc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.documentItem}
                onPress={() => setSelectedPdf(doc.downloadURL)}
              >
                <FontAwesome5 name="file-pdf" size={24} color="#a78638" />
                <Text style={styles.documentText} numberOfLines={1}>
                  {doc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Video Section */}
        {ritualContent?.video_link && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("videoGuides") || "Video Guides"}</Text>
            <TouchableOpacity
              style={styles.videoItem}
              onPress={() => Linking.openURL(ritualContent.video_link!)}
            >
              <FontAwesome5 name="youtube" size={24} color="#FF0000" />
              <Text style={styles.videoText} numberOfLines={1}>
                {t("watchVideo") || "Watch Video Guide"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Entypo name="chevron-small-left" size={30} color="black" />
        </Pressable>
        {!loading && (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {ritualContent?.name}
          </Text>
        )}
        <View style={{ width: 30 }} /> 
      </View>

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Modals */}
      <ImageModal
        visible={selectedImage !== null}
        imageUrl={selectedImage || ""}
        onClose={() => setSelectedImage(null)}
      />

      <PdfViewerModal
        visible={selectedPdf !== null}
        pdfUrl={selectedPdf || ""}
        onClose={() => setSelectedPdf(null)}
      />

      <AudioPlayerModal
        visible={selectedAudio !== null}
        audioFile={selectedAudio}
        onClose={() => setSelectedAudio(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    width: '100%',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 10,
  },
  retryText: {
    color: "#a78638",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
    marginBottom: 20,
  },
  paragraphContainer: {
    marginBottom: 20,
  },
  paragraphTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  paragraphContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#555",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginRight: 10,
  },
  audioItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  audioText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  documentText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  videoText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#333",
    flex: 1,
    fontWeight: "600",
  },
});

export default RitualDetailScreen;

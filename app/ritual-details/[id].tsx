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
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Entypo, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Audio, AVPlaybackStatus } from "expo-av";
import { WebView } from "react-native-webview";
import { getFilesWithUrls, listFiles } from "../../utils/storageUtils";
import { StorageFile } from "../../utils/storageTypes";
import { signInAnonymousUser } from "../../utils/firebase";
import ritualData from "../../data/data.json";

type Props = {};

interface RitualMedia {
  images: StorageFile[];
  audio: StorageFile[];
  documents: StorageFile[];
}

interface RitualContent {
  id: number;
  name: string;
  description: string[] | string;
  paragraphs: {
    title: string;
    description: string[] | string[][] | string;
  }[];
}

// const detailData =[
//   {
//     title:"",
//     desc:''

//   }
// ]

const RitualDetail = (props: Props) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const ritualIdStr = params.id as string;
  const ritualId = parseInt(ritualIdStr) || 1;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<RitualMedia>({
    images: [],
    audio: [],
    documents: []
  });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(-1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [ritualContent, setRitualContent] = useState<RitualContent | null>(null);

  useEffect(() => {
    const initializeAndFetch = async () => {
      // Sign in anonymously to Firebase before fetching media
      await signInAnonymousUser();
      
      // Find ritual content from data.json
      const ritual = ritualData.rituals.find(r => r.id === ritualId);
      if (ritual) {
        setRitualContent(ritual);
      }
      
      await fetchRitualMedia();
    };
    
    initializeAndFetch();
    
    // Clean up audio when component unmounts
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [ritualId]);
  
  const fetchRitualMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try a simpler path first to test if the Firebase Storage is accessible
      try {
        console.log("Testing Firebase Storage access...");
        // This is a very simple test to check if we can access the storage root
        const testResult = await listFiles('');
        console.log("Storage root access test result:", 
          testResult.prefixes.map(p => p.fullPath));
      } catch (testError: any) {
        console.error("Firebase Storage access test failed:", testError);
        // Continue anyway to try the actual path
      }
      
      // Fetch media from the specific ritual folder in Firebase Storage
      const storagePath = `demo/${ritualId}`;
      console.log(`Attempting to access path: ${storagePath}`);
      
      try {
        const files = await getFilesWithUrls(storagePath);
        
        // Categorize files by type
        const images: StorageFile[] = [];
        const audio: StorageFile[] = [];
        const documents: StorageFile[] = [];
        
        files.forEach(file => {
          const contentType = file.contentType || '';
          
          if (contentType.startsWith('image/')) {
            images.push(file);
          } else if (contentType.startsWith('audio/')) {
            audio.push(file);
          } else if (contentType === 'application/pdf' || contentType.includes('document')) {
            documents.push(file);
          }
        });
        
        setMedia({ images, audio, documents });
      } catch (storageError: any) {
        console.error('Storage error:', storageError);
        
        // Handle common Firebase Storage errors
        if (storageError.code === 'storage/unauthorized') {
          setError('Permission denied. You do not have access to these files. Please check your Firebase Storage rules.');
          Alert.alert(
            "Storage Access Error",
            "You don't have permission to access these files. Please update your Firebase Storage rules to allow access to the 'rituals' folder.",
            [{ text: "OK" }]
          );
        } else if (storageError.code === 'storage/object-not-found') {
          setError(`No media files found for ritual ${ritualId}`);
        } else {
          setError(`Error: ${storageError.message || 'Unknown error occurred'}`);
        }
      }
    } catch (err) {
      console.error('Error fetching ritual media:', err);
      setError('Failed to load media files. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const playSound = async (audioFile: StorageFile, index: number) => {
    try {
      // If already playing this audio, toggle play/pause
      if (sound && index === currentAudioIndex) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }
      
      // If playing a different audio, unload the current one
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Load and play the new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioFile.downloadURL },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      setCurrentAudioIndex(index);
      
      // When audio finishes playing
      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  
  return (
    <View className="flex-1">
      <ImageBackground
        source={require("@/assets/images/makkah/makkah-img.webp")}
        resizeMode="cover"
        className="w-full h-[350px] items-center justify-start pt-14"
      >
        <View className="w-full flex-row items-center justify-between px-10">
          <Pressable
            onPress={() => router.back()}
            className=" bg-white/50 rounded-xl"
          >
            <Entypo name="chevron-small-left" size={40} color="black" />
          </Pressable>
          <View className="w-10 h-10 bg-white rounded-full"></View>
        </View>
      </ImageBackground>
      <View className="w-full h-20 relative bg-white mt-[-50px] rounded-t-[50px] items-end justify-end">
        <View className="p-5 bg-white shadow-xl absolute -top-10 right-10 rounded-full">
          <Image source={require('@/assets/icons/share.png')} resizeMode="cover" className="w-10 h-10"/>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white px-5"
      >
        {ritualContent ? (
          <Text className="font-bold text-[28px] text-green">{ritualContent.name}</Text>
        ) : (
          <Text className="font-bold text-[28px] text-green">Ritual Details</Text>
        )}
        
        {loading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#34D399" />
            <Text className="mt-2 text-gray-500">Loading media...</Text>
          </View>
        ) : error ? (
          <View className="bg-red-100 p-4 my-4 rounded-lg">
            <Text className="text-red-600">{error}</Text>
          </View>
        ) : (
          <>
            {/* Images Section */}
            {media.images.length > 0 && (
              <View className="my-4">
                <Text className="text-xl font-bold mb-2">Images</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  {media.images.map((image, index) => (
                    <TouchableOpacity 
                      key={index}
                      onPress={() => setSelectedImage(image.downloadURL)}
                      className="mr-3"
                    >
                      <Image 
                        source={{ uri: image.downloadURL }} 
                        className="w-32 h-32 rounded-lg"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                {/* Image Preview Modal */}
                {selectedImage && (
                  <Pressable 
                    className="absolute top-0 left-0 right-0 bottom-0 bg-black/80 z-10 items-center justify-center"
                    style={{ height: 500, width: '100%' }}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Image 
                      source={{ uri: selectedImage }} 
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                    <TouchableOpacity 
                      className="absolute top-4 right-4"
                      onPress={() => setSelectedImage(null)}
                    >
                      <AntDesign name="closecircle" size={24} color="white" />
                    </TouchableOpacity>
                  </Pressable>
                )}
              </View>
            )}
            
            {/* Audio Section */}
            {media.audio.length > 0 && (
              <View className="my-4">
                <Text className="text-xl font-bold mb-2">Audio Guides</Text>
                {media.audio.map((audioFile, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => playSound(audioFile, index)}
                    className="flex-row items-center p-3 bg-gray-100 rounded-lg mb-2"
                  >
                    <View className="w-10 h-10 bg-green rounded-full items-center justify-center mr-3">
                      <FontAwesome5 
                        name={isPlaying && currentAudioIndex === index ? "pause" : "play"} 
                        size={16} 
                        color="white" 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold">{audioFile.name}</Text>
                      {audioFile.size && (
                        <Text className="text-xs text-gray-500">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Documents Section */}
            {media.documents.length > 0 && (
              <View className="my-4">
                <Text className="text-xl font-bold mb-2">Guides & Documents</Text>
                {media.documents.map((doc, index) => (
                  <TouchableOpacity 
                    key={index}
                    onPress={() => setSelectedPdf(doc.downloadURL)}
                    className="flex-row items-center p-3 bg-gray-100 rounded-lg mb-2"
                  >
                    <View className="w-10 h-10 bg-red-500 rounded-full items-center justify-center mr-3">
                      <FontAwesome5 name="file-pdf" size={16} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold">{doc.name}</Text>
                      {doc.size && (
                        <Text className="text-xs text-gray-500">
                          {(doc.size / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
                
                {/* PDF Viewer Modal */}
                {selectedPdf && (
                  <Modal
                    transparent={true}
                    visible={!!selectedPdf}
                    onRequestClose={() => setSelectedPdf(null)}
                    animationType="slide"
                  >
                    <View className="flex-1 bg-black/50">
                      <View className="flex-1 bg-white m-5 mt-10 rounded-xl overflow-hidden">
                        <View className="flex-row items-center justify-between p-3 bg-gray-100">
                          <Text className="font-bold">Document Viewer</Text>
                          <TouchableOpacity onPress={() => setSelectedPdf(null)}>
                            <AntDesign name="close" size={24} color="black" />
                          </TouchableOpacity>
                        </View>
                        <WebView
                          source={{ uri: selectedPdf }}
                          style={{ flex: 1 }}
                          startInLoadingState
                          renderLoading={() => (
                            <View className="absolute inset-0 justify-center items-center bg-white">
                              <ActivityIndicator size="large" color="#34D399" />
                            </View>
                          )}
                        />
                      </View>
                    </View>
                  </Modal>
                )}
              </View>
            )}
          </>
        )}
        
        {/* Ritual content sections from data.json */}
        {ritualContent && (
          <View className="gap-y-5 pt-5 pb-5">
            <Text className="text-2xl font-bold">About {ritualContent.name}</Text>
            {typeof ritualContent.description === 'string' ? (
              <Text className="text-lg leading-tight mb-2">
                {ritualContent.description}
              </Text>
            ) : (
              ritualContent.description.map((desc: string, index: number) => (
                <Text key={index} className="text-lg leading-tight mb-2">
                  {desc}
                </Text>
              ))
            )}
            
            {ritualContent.paragraphs.map((paragraph, pIndex) => (
              <View key={pIndex} className="mt-4 mb-6">
                <Text className="text-xl font-bold mb-2">{paragraph.title}</Text>
                {typeof paragraph.description === 'string' ? (
                  <Text className="text-lg leading-tight mb-2">
                    {paragraph.description}
                  </Text>
                ) : Array.isArray(paragraph.description) && 
                  paragraph.description.map((desc: string | string[], dIndex: number) => (
                    <Text key={dIndex} className="text-lg leading-tight mb-2">
                      {Array.isArray(desc) ? desc.join(' ') : desc}
                    </Text>
                  ))
                }
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RitualDetail;

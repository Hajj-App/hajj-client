import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

const FileUploadScreen = () => {
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [pdf, setPdf] = useState<string | null>(null);
  const [voiceMessage, setVoiceMessage] = useState(null);
  const [image, setImage] = useState<string | null>(null);
  const router = useRouter();

  // Function to pick a PDF file
  const pickPDF = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });

    if (!result.canceled) {
      setPdf(result.assets[0].uri);
    }
  };

  // Function to pick an image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-5">
      <Text className="text-2xl font-bold mb-5">Upload File</Text>

      {/* File Name Input */}
      <Text className="text-lg font-semibold">File Name</Text>
      <TextInput
        className="border border-gray-300 p-2 rounded-lg mb-4"
        placeholder="Enter file name"
        value={fileName}
        onChangeText={setFileName}
      />

      {/* Description Input */}
      <Text className="text-lg font-semibold">Description</Text>
      <TextInput
        className="border border-gray-300 p-2 rounded-lg mb-4"
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* PDF Upload */}
      <TouchableOpacity
        className="bg-blue-500 p-3 rounded-lg mb-4"
        onPress={pickPDF}
      >
        <Text className="text-white text-center">Select PDF</Text>
      </TouchableOpacity>
      {pdf && <Text className="text-green-500">PDF Selected</Text>}

      {/* Image Upload */}
      <TouchableOpacity
        className="bg-green-500 p-3 rounded-lg mb-4"
        onPress={pickImage}
      >
        <Text className="text-white text-center">Select Image</Text>
      </TouchableOpacity>
      {image && <Text className="text-green-500">Image Selected</Text>}

      {/* Submit Button */}
      <TouchableOpacity
        className="bg-purple-500 p-3 rounded-lg mt-5"
        onPress={() => {
          console.log({ fileName, description, pdf, image });
          router.back(); // Go back to the previous screen after submission
        }}
      >
        <Text className="text-white text-center">Upload</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default FileUploadScreen;

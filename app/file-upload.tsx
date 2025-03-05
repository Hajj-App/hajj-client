import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { uploadFile } from "@/utils/storageUtils";


const FileUploadScreen = () => {
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [pdf, setPdf] = useState<{ name: string; uri: string } | null>(null);
  const [voiceMessage, setVoiceMessage] = useState(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Function to pick a PDF file
  const pickPDF = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });

    if (!result.canceled) {
      setPdf({
        name: result.assets[0].name,
        uri: result.assets[0].uri,
      });
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

  const handleUpload = async () => {
    if (!image) return;
    
    // setUploading(true);
    // const storagePath = `uploads/${Date.now()}.jpg`;
    
    // const downloadURL = await uploadFile(image, storagePath, (progress) => {
    //   console.log(`Upload Progress: ${progress.toFixed(2)}%`);
    // });

    // setUploading(false);
    
    // if (downloadURL) {
    //   console.log("File uploaded successfully:", downloadURL);
    // } else {
    //   console.error("File upload failed.");
    // }

    console.log({ fileName, description, pdf, image });
    router.back(); // Go back to the previous screen after submission
  };

  return (
    <ScrollView className="flex-1 bg-white p-10">
      <Text className="text-3xl text-center font-bold mb-5">Upload File</Text>

      {/* File Name Input */}
      <Text className="text-lg font-semibold mb-1">File Name</Text>
      <TextInput
        className="border border-gray-300 p-3 rounded-lg mb-4 "
        placeholder="Enter file name"
        value={fileName}
        onChangeText={setFileName}
      />

      {/* Description Input */}
      <Text className="text-lg font-semibold mb-1">Description</Text>
      <TextInput
        className="border border-gray-300 p-3 rounded-lg mb-4 h-64  text-wrap "
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* PDF Upload */}
      <TouchableOpacity
        className="mb-4 flex justify-center items-center gap-3 mt-4"
        onPress={pickPDF}
      >
        {pdf ? 
        <Text className="text-green-500 text-lg">
          📄 {pdf.name}
        </Text> :<Image
          source={require("@/assets/icons/share.png")}
          className="w-8 h-8"
          resizeMode="contain"
        />
      }
        <Text className="text-white text-center bg-blue-500 p-3 rounded-lg w-1/2">
          Select PDF
        </Text>
       
      </TouchableOpacity>
     
      {/* Image Upload */}
      <TouchableOpacity
        className="bg-green-500 p-3 rounded-lg mb-4 flex items-center justify-center "
        onPress={pickImage}
      >
         {image ?
         <Image 
             source={{uri:image}}
             className="w-40 h-40 rounded-lg mb-4"
             resizeMode="cover"/> 
             : 
             <Image 
             source={require("@/assets/icons/add-image.png")}
             className="w-10 h-10 mb-4"/>}
        <Text className="text-white bg-blue-500 text-center p-3 rounded-lg w-1/2">Select Image</Text>
      </TouchableOpacity>
     

      {/* Submit Button */}
      <TouchableOpacity
        className="bg-purple-500 p-3 rounded-lg mt-5"
        onPress={handleUpload}
      >
        <Text className="text-white text-center">Upload</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default FileUploadScreen;

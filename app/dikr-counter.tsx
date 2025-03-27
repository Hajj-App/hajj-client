import { View, Text, Image, Pressable, Vibration, TextInput } from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Dikr {
  name: string;
  count: number;
}

const DikrCounter = () => {
  const [count, setCount] = useState(0);
  const [isVibrationOn, setIsVibrationOn] = useState(true);
  const [showManage, setShowManage] = useState(false);
  const [dikrName, setDikrName] = useState("Dikr");
  const [editCount, setEditCount] = useState("");

  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('dikrData');
        if (savedData) {
          const { name, count } = JSON.parse(savedData);
          setDikrName(name);
          setCount(count);
        }
      } catch (error) {
        console.error('Failed to load data', error);
      }
    };
    loadData();
  }, []);

  // Save data when count or name changes
  useEffect(() => {
    const saveData = async () => {
      try {
        const dataToSave = JSON.stringify({ name: dikrName, count });
        await AsyncStorage.setItem('dikrData', dataToSave);
      } catch (error) {
        console.error('Failed to save data', error);
      }
    };
    saveData();
  }, [dikrName, count]);

  const vibrate = () => {
    if (isVibrationOn) {
      Vibration.vibrate(50);
    }
  };

  const incrementCount = () => {
    setCount(prev => prev + 1);
    vibrate();
  };

  const reset = () => {
    setCount(0);
    vibrate();
  };

  const saveChanges = () => {
    const newCount = parseInt(editCount) || count;
    setCount(newCount);
    setShowManage(false);
    setEditCount("");
  };

  return (
    <View className="flex-1 items-center justify-center bg-white mb-12">
      {/* Counter Display */}
      <Pressable onPress={incrementCount} className="items-center ">
        <Image
          source={require("@/assets/images/tally-counter.png")}
          className="w-96 h-96"
          resizeMode="contain"
        />
        <Text className="absolute mr-32 mt-20 right-0 text-5xl font-bold">{count}</Text>
        
        {/* Dikr Name */}
        {/* <View className="absolute bottom-32 w-full items-center">
          <Text className="text-xl font-bold">{dikrName}</Text>
        </View> */}
      </Pressable>

         

      {/* Manage Panel (shown when active) */}
      {showManage && (
        <View className="w-80 p-6 bg-gray-100 rounded-2xl mb-6">
          <Text className="text-lg font-bold mb-4">Manage Dikr</Text>
          
          <TextInput
            placeholder="Dikr Name"
            value={dikrName}
            onChangeText={setDikrName}
            className="bg-white p-3 rounded-lg mb-3"
          />
          
          <TextInput
            placeholder={`Set Count (current: ${count})`}
            value={editCount}
            onChangeText={setEditCount}
            keyboardType="numeric"
            className="bg-white p-3 rounded-lg mb-4"
          />
          
          <Pressable 
            onPress={saveChanges}
            className="bg-blue-500 py-3 rounded-lg items-center"
          >
            <Text className="text-white font-bold">Save</Text>
          </Pressable>
        </View>
      )}


       {/* Divider Line */}
       <View className="w-3/4 h-1 rounded-full bg-gray-500 opacity-30 mb-8" />


      {/* Action Buttons */}
      <View className="flex flex-row gap-4">
        <Pressable 
          onPress={() => setShowManage(!showManage)} 
          className="bg-gray-300 py-4 px-10 rounded-2xl"
        >
          <Text className="text-lg font-bold">
            {showManage ? "Cancel" : "Manage"}
          </Text>       
        </Pressable>

        <Pressable onPress={reset} className="bg-gray-300 py-4 px-10 rounded-2xl">
          <Text className="text-lg font-bold">Reset</Text>       
        </Pressable>
      </View>


      {/* Vibration Toggle */}
      <Pressable
        onPress={() => setIsVibrationOn(!isVibrationOn)}
        className="absolute top-8 right-12 p-4 rounded-xl bg-gray-200"
      >    
        {isVibrationOn ? (
          <Image 
            source={require("@/assets/icons/sound.png")}
            className="w-6 h-6 opacity-60" 
          />
        ) : (
          <Image 
            source={require("@/assets/icons/mute.png")}
            className="w-6 h-6 opacity-80" 
          />
        )}    
      </Pressable>
    </View>
  );
};

export default DikrCounter;
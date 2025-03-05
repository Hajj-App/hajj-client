import { View, Text, Image, Pressable, Button, Vibration } from "react-native";
import React, { useState } from "react";

const DikrCounter = () => {

  const [count, setCount] = useState(0)
  const [isVibrationOn, setIsVibrationOn] = useState(true);

  const vibrate = () => {
    if (isVibrationOn) {
      Vibration.vibrate(50);
    }
  }


  const incrementCount = ()=> {
      setCount(count+1)
      vibrate()
  } 
  const reset = ()=> {
    setCount(0)
    vibrate()
  }

  return (
    <View className="flex-1 items-center justify-center">
      <Pressable onPress={incrementCount}>
      <Image
        source={require("@/assets/images/tally-counter.png")}
        className="w-96 h-96"
        resizeMode="contain"
      />
       <Text className="absolute mr-32 mt-20 right-0 text-5xl font-bold">{count}</Text>
      </Pressable>
      <Pressable onPress={reset} className="bg-gray-300 py-4 px-10 rounded-3xl">
        <Text className="text-lg font-bold">Reset</Text>       
      </Pressable>

      <Pressable
        onPress={() => setIsVibrationOn(!isVibrationOn)}
        className={` absolute top-8 right-12 p-4  rounded-xl bg-gray-200`}
      >    
          {isVibrationOn
           ? <Image 
                  source={require("@/assets/icons/sound.png")}
                  className="w-6 h-6 opacity-60" />
           : <Image 
           source={require("@/assets/icons/mute.png")}
           className="w-6 h-6 " />}    
      </Pressable>
    </View>
  );
};

export default DikrCounter;
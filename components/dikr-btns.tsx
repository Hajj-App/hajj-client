import {
  View,
  Text,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native";
import React from "react";

const dikrBtns = [
  {
    id: 1,
    title: "Morning",
    icon: require("../assets/images/Hajj App Image 31.png"),
  },
  {
    id: 2,
    title: "Evening",
    icon: require("../assets/images/Hajj App Image 32.png"),
  },
  {
    id: 3,
    title: "Before Sleep",
    icon: require("../assets/images/Hajj App Image 33.png"),
  },
  {
    id: 4,
    title: "Salah",
    icon: require("../assets/images/Hajj App Image 34.png"),
  },
  {
    id: 5,
    title: "After Salah",
    icon: require("../assets/images/Hajj App Image 35.png"),
  },
  {
    id: 6,
    title: "Illness",
    icon: require("../assets/images/Hajj App Image 36.png"),
  },
  {
    id: 7,
    title: "Praise Allah",
    icon: require("../assets/images/Hajj App Image 37.png"),
  },
  {
    id: 8,
    title: "Quranic Duas",
    icon: require("../assets/images/Hajj App Image 38.png"),
  },
  {
    id: 9,
    title: "Allah's names",
    icon: require("../assets/images/Hajj App Image 39.png"),
  },
  {
    id: 10,
    title: "Sunnah Duas",
    icon: require("../assets/images/Hajj App Image 40.png"),
  },
];

const DikrBtns = () => {
  const { width } = useWindowDimensions();
  const buttonWidth = (width - 48) / 2; // Calculate width for 2 buttons per row with padding

  return (
    <View className="flex-row flex-wrap items-center justify-between py-8 px-4 flex-1">
      {dikrBtns.map((dikrBtn) => (
        <Pressable
          style={{ width: buttonWidth, marginBottom: 16 }}
          className="bg-white flex flex-row items-center gap-2 px-3 py-2 rounded-md"
          key={dikrBtn.id}
        >
          <Image source={dikrBtn.icon} className="w-14 h-14" />
          <Text>{dikrBtn.title}</Text>
        </Pressable>
      ))}
    </View>
  );
};

export default DikrBtns;

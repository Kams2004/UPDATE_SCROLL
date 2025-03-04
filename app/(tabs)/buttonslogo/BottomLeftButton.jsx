// components/BottomLeftButton.js
import React from "react";
import { TouchableOpacity, Image, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function BottomLeftButton() {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate("ChapterScreen");
  };

  return (
    <TouchableOpacity style={styles.bottomLeftButton} onPress={handlePress}>
      <Image
        source={require("../../../assets/scrollboxImg/05.png")}
        style={styles.bottomLeftIcon}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bottomLeftButton: {
    position: "absolute",
    bottom: height * 0.05,
    left: width * 0.05,  
    zIndex: 2,
  },
  bottomLeftIcon: {
    width: width * 0.14, 
    height: width * 0.14, 
    resizeMode: "contain",
  },
});

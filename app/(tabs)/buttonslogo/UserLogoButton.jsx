// components/UserLogoButton.js
import React from "react";
import { TouchableOpacity, Image, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function UserLogoButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.userLogoButton} onPress={onPress}>
      <Image
        source={require("../../../assets/scrollboxImg/07.png")}
        style={styles.userLogo}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  userLogoButton: {
    position: "absolute",
    top: height * 0.04,   
    right: width * 0.07, 
    zIndex: 2,
  },
  userLogo: {
    width: width * 0.13, 
    height: width * 0.13,
    resizeMode: "contain",
  },
});

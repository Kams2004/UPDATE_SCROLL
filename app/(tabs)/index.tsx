import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
  ScrollView,
} from "react-native";
import { Video } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

import UserLogoButton from "./buttonslogo/UserLogoButton";
import BottomLeftButton from "./buttonslogo/BottomLeftButton";
import UserProfileModal from "./buttonslogo/UserProfileModal";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const videoRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  // Animation values
  const scaleY = useRef(new Animated.Value(1)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handleStartAdventure = () => {
    // First animation sequence
    Animated.sequence([
      // Scale to thin line
      Animated.parallel([
        Animated.timing(scaleY, {
          toValue: 0.002,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Shrink horizontally
      Animated.parallel([
        Animated.timing(scaleX, {
          toValue: 0.2,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 450,
          delay: 450,
          useNativeDriver: true,
        }),
      ]),
      // Expand horizontally
      Animated.timing(scaleX, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
      // Scale back to full size
      Animated.parallel([
        Animated.timing(scaleY, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Navigate after animation completes
      navigation.navigate("SecondHomePage");
    });
  };

  const animatedStyle = {
    transform: [{ scaleX }, { scaleY }],
    opacity,
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <Video
          ref={videoRef}
          source={require("../../assets/videos/HomeAnim.mp4")}
          style={styles.backgroundVideo}
          resizeMode="cover"
          isLooping
          shouldPlay
          isMuted
        />

        <LinearGradient
          colors={["rgba(125, 59, 28, 0.4)", "rgba(43, 20, 9, 0.9)"]}
          style={styles.backgroundOverlay}
        />

        <UserLogoButton
          onPress={() => setModalVisible(true)}
          style={styles.userLogoButton}
        />

        <BottomLeftButton
          onPress={() => navigation.navigate("Chapters")}
          style={styles.bottomLeftButton}
        />

        <UserProfileModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />

        <View style={styles.imageContainer}>
          <LottieView
            source={require("../../assets/jsons/Scrolbox-Anim.json")}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.adventureButton}
            onPress={handleStartAdventure}
          >
            <Text style={styles.adventureButtonText}>Start the Adventure</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(75, 46, 47, 0.5)",
  },
  animatedContainer: {
    flex: 1,
  },
  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: "100%",
    height: "100%",
  },
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: "100%",
    height: "100%",
  },
  userLogoButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  bottomLeftButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieAnimation: {
    width: "70%",
    height: "80%",
  },
  buttonWrapper: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: 20,
    transform: [{ translateX: -75 }, { translateY: 230 }],
    padding: 4,
    borderWidth: 1,
    borderColor: "orange",
    borderRadius: 12,
  },
  adventureButton: {
    backgroundColor: "orange",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  adventureButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

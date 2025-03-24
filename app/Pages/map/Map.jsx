import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { Video, Audio } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const videosByLanguage = {
  fr: [
    {
      title: "Acceuil",
      source: require("./../../../assets/videos/fr/Home.mp4"),
    },
    {
      title: "FUMBAHAN",
      source: require("./../../../assets/videos/fr/Fumbahan.mp4"),
    },
    {
      title: "BAKORA",
      source: require("./../../../assets/videos/fr/Bakora.mp4"),
    },
    {
      title: "KABIBI",
      source: require("./../../../assets/videos/fr/Kabibi.mp4"),
    },
    {
      title: "KADUMAFO",
      source: require("./../../../assets/videos/fr/Kadumafo.mp4"),
    },
    {
      title: "MLEMBE",
      source: require("./../../../assets/videos/fr/Lembe.mp4"),
    },
    {
      title: "MOTAMBE",
      source: require("./../../../assets/videos/fr/Motambe.mp4"),
    },
    {
      title: "SULUNGA",
      source: require("./../../../assets/videos/fr/Sulunga.mp4"),
    },
    {
      title: "TOMOUBE",
      source: require("./../../../assets/videos/fr/Tomoube.mp4"),
    },
  ],
  en: [
    {
      title: "Home",
      source: require("./../../../assets/videos/en/Home.mp4"),
    },
    {
      title: "FUMBAHAN",
      source: require("./../../../assets/videos/en/Fumbahan-En.mp4"),
    },
    {
      title: "BAKORA",
      source: require("./../../../assets/videos/en/Bakora-En.mp4"),
    },
    {
      title: "KABIBI",
      source: require("./../../../assets/videos/en/Kabibi-En.mp4"),
    },
    {
      title: "KADUMAFO",
      source: require("./../../../assets/videos/en/Kadumafo-En.mp4"),
    },
    {
      title: "MLEMBE",
      source: require("./../../../assets/videos/en/Lembe-En.mp4"),
    },
    {
      title: "MOTAMBE",
      source: require("./../../../assets/videos/en/Motambe-En.mp4"),
    },
    {
      title: "SULUNGA",
      source: require("./../../../assets/videos/en/Sulunga-En.mp4"),
    },
    {
      title: "TOMOUBE",
      source: require("./../../../assets/videos/en/Tomoube-En.mp4"),
    },
  ],
};

const Map = () => {
  const { i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoAnim] = useState(new Animated.Value(0));
  const [isMuted, setIsMuted] = useState(false);
  const [backgroundSound, setBackgroundSound] = useState();
  const navigation = useNavigation();
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Preload and start audio immediately upon component mount
  useEffect(() => {
    let isMounted = true;

    const preloadAudio = async () => {
      try {
        // Pre-load the audio file
        const soundObject = new Audio.Sound();
        await soundObject.loadAsync(
          require("./../../../assets/videos/CAPSULE map.mp3"),
          { isLooping: true }
        );

        // Set volume and start playing immediately
        await soundObject.setVolumeAsync(1.0);
        await soundObject.playAsync();

        // Only update state if component is still mounted
        if (isMounted) {
          setBackgroundSound(soundObject);
          setIsAudioReady(true);
        }
      } catch (error) {
        console.warn("Audio preload error:", error);
      }
    };

    // Setup screen orientation and audio
    const setupScreen = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
        // Start preloading audio right away
        preloadAudio();
      } catch (error) {
        console.warn("Screen setup error:", error);
      }
    };

    setupScreen();

    // Cleanup function
    return () => {
      isMounted = false;
      ScreenOrientation.unlockAsync();
      if (backgroundSound) {
        backgroundSound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    Animated.timing(videoAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const toggleMute = async () => {
    if (backgroundSound) {
      try {
        if (isMuted) {
          await backgroundSound.setVolumeAsync(1.0);
        } else {
          await backgroundSound.setVolumeAsync(0);
        }
        setIsMuted(!isMuted);
      } catch (error) {
        console.warn("Mute toggle error:", error);
      }
    }
  };

  const videos = videosByLanguage[i18n.language] || videosByLanguage.en;

  const handlePrevious = () => {
    videoAnim.setValue(0);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? videos.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    videoAnim.setValue(0);
    setCurrentIndex((prevIndex) =>
      prevIndex === videos.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleClose = async () => {
    // Stop the background sound when closing
    if (backgroundSound) {
      try {
        await backgroundSound.stopAsync();
        await backgroundSound.unloadAsync();
      } catch (error) {
        console.warn("Error stopping background sound:", error);
      }
    }

    // Navigate back
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Animated.View style={{ ...styles.videoWrapper, opacity: videoAnim }}>
        <Video
          source={videos[currentIndex].source}
          style={styles.video}
          shouldPlay
          isLooping={
            videos[currentIndex].title === "Acceuil" ||
            videos[currentIndex].title === "Home"
          }
          resizeMode="cover"
          useNativeControls={false}
        />
      </Animated.View>

      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Image
          source={require("./../../../assets/scrollboxImg/09.png")}
          style={styles.closeButtonImage}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.muteButton,
          { backgroundColor: isMuted ? "gray" : "rgba(43, 20, 9, 0.8)" },
        ]}
        onPress={toggleMute}
      >
        <Image
          source={
            isMuted
              ? require("./../../../assets/scrollboxImg/icons8-mute-50.png")
              : require("./../../../assets/scrollboxImg/icons8-snare-drum-50.png")
          }
          style={styles.muteButtonImage}
        />
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePrevious}>
          <Text style={styles.smallButtonText}>
            {videos[(currentIndex - 1 + videos.length) % videos.length].title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.smallButtonText}>
            {videos[(currentIndex + 1) % videos.length].title}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  videoWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(43, 20, 9, 0.8)",
    borderRadius: 25,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  closeButtonImage: {
    width: 20,
    height: 20,
  },
  muteButton: {
    position: "absolute",
    top: 70,
    left: 20,
    borderRadius: 25,
    padding: 10,
    zIndex: 2,
  },
  muteButtonImage: {
    width: 20,
    height: 20,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  button: {
    backgroundColor: "#EF7F1A",
    paddingVertical: 10,
    width: 120,
    alignItems: "center",
    borderRadius: 25,
  },
  smallButtonText: {
    color: "white",
    fontSize: 14,
  },
});

export default Map;

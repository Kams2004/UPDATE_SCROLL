import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
  Animated,
  BackHandler,
} from "react-native";
import { Video } from "expo-av";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import Loader from "../../../components/Loader";

const SecondHomePage = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const videoRef = useRef(null);
  const [showChapterButton, setShowChapterButton] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // State for mute button

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  // Get the correct video based on current language
  const getVideoSource = () => {
    const currentLang = i18n.language;
    if (currentLang === "fr") {
      return require("./../../../assets/videos/Anim_Scrolbox_Kijins_Large_Alpha.mp4");
    } else {
      return require("./../../../assets/videos/Anim_Scrolbox_Kijins_Large_Bravo.mp4");
    }
  };

  // Handle back button press
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleClose();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );
  const toggleMute = () => {
    setIsMuted((prevIsMuted) => !prevIsMuted);
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(!isMuted);
    }
  };

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    };

    lockOrientation();

    return () => {
      const cleanup = async () => {
        // Stop video and reset orientation when component unmounts
        if (videoRef.current) {
          await videoRef.current.stopAsync();
        }
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT
        );
      };
      cleanup();
    };
  }, []);

  // Reset and reload video when language changes
  useEffect(() => {
    if (videoRef.current) {
      const playVideo = async () => {
        setLoading(true);
        await videoRef.current.unloadAsync();
        await videoRef.current.loadAsync(getVideoSource(), {}, false);
        await videoRef.current.playAsync();
      };
      playVideo();
    }
  }, [i18n.language]);

  const handleClose = async () => {
    // Stop video and reset orientation
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
      } catch (error) {
        console.log("Error stopping video:", error);
      }
    }

    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      );
    } catch (error) {
      console.log("Error changing orientation:", error);
    }

    // Use exactly the navigation pattern specified
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const handleReadChapters = async () => {
    // Stop video and reset orientation
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
      } catch (error) {
        console.log("Error stopping video:", error);
      }
    }

    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      );
    } catch (error) {
      console.log("Error changing orientation:", error);
    }

    // Use the same navigation pattern as handleClose but navigate to ChapterScreen
    if (navigation.canGoBack()) {
      navigation.goBack();
      navigation.navigate("ChapterScreen");
    } else {
      navigation.navigate("ChapterScreen");
    }
  };
  const handlePlaybackUpdate = (status) => {
    // Hide loader when video starts playing
    if (status.isLoaded && status.isPlaying && loading) {
      setLoading(false);
    }

    // Show the chapter button at 91 seconds
    if (status.positionMillis >= 91000 && !showChapterButton) {
      setShowChapterButton(true);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Navigate to Home when video finishes
    if (status.didJustFinish) {
      handleVideoFinish();
    }
  };

  const handleVideoFinish = async () => {
    // Stop video and reset orientation
    if (videoRef.current) {
      try {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
      } catch (error) {
        console.log("Error stopping video:", error);
      }
    }

    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      );
    } catch (error) {
      console.log("Error changing orientation:", error);
    }

    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <Video
        ref={videoRef}
        source={getVideoSource()}
        style={styles.video}
        resizeMode="cover"
        shouldPlay
        isLooping={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={handlePlaybackUpdate}
        onError={(error) => {
          console.error("Video loading error:", error);
          setLoading(false);
        }}
      />

      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Image
          source={require("./../../../assets/scrollboxImg/09.png")}
          style={styles.closeIcon}
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

      {showChapterButton && (
        <Animated.View
          style={[
            styles.chapterContainer,
            { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
          ]}
        >
          <TouchableOpacity onPress={handleReadChapters}>
            <Image
              source={require("./../../../assets/scrollboxImg/scrolbox2.png")}
              style={styles.chapterImage}
            />
          </TouchableOpacity>
          <Text style={styles.chapterText}>{t("readChapters")}</Text>
        </Animated.View>
      )}

      <Loader visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: "rgba(43, 20, 9, 0.8)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },
  closeIcon: {
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
  muteButtonImage: {
    width: 20,
    height: 20,
  },
  chapterContainer: {
    position: "absolute",
    alignItems: "center",
  },
  chapterImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  chapterText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
});

export default SecondHomePage;

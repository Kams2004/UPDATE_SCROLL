import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ScreenOrientation from "expo-screen-orientation";
import { PinchGestureHandler, State } from "react-native-gesture-handler";
import * as MediaLibrary from "expo-media-library";
import { usePreventScreenCapture } from "expo-screen-capture";

const MIN_SCALE = 1;
const MAX_SCALE = 3;

const SimpleChapterReader = ({
  chapterId,
  onClose,
  nextChapterId,
  previousChapterId,
  nextChapterPurchased,
}) => {
  usePreventScreenCapture();
  const [pages, setPages] = useState([]);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const [scale, setScale] = useState(1);
  const [lastScale, setLastScale] = useState(1);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasScreenCapturePermission, setHasScreenCapturePermission] = useState(false);

  useEffect(() => {
    const setupScreenCaptureProtection = async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasScreenCapturePermission(status === "granted");
      } catch (error) {
        console.error("Screen capture protection setup error:", error);
      }
    };

    setupScreenCaptureProtection();
  }, []);

  useEffect(() => {
    const loadExtractedPages = async () => {
      try {
        setLoading(true);
        
        // The extracted files are stored in cache directory with numbered filenames
        const extractDir = `${FileSystem.cacheDirectory}extracted_${chapterId}/`;
        const files = await FileSystem.readDirectoryAsync(extractDir);
        
        // Filter and sort the files to ensure proper order
        const imageFiles = files
          .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
          .sort((a, b) => {
            // Extract numbers from filenames (e.g., "001.jpg" -> 1)
            const numA = parseInt(a.split('.')[0]);
            const numB = parseInt(b.split('.')[0]);
            return numA - numB;
          });
        
        // Create page objects with URIs
        const loadedPages = imageFiles.map(file => ({
          uri: `file://${extractDir}${file}`
        }));
        
        setPages(loadedPages);
        
        // Unlock orientation for better reading experience
        await ScreenOrientation.unlockAsync();
      } catch (error) {
        console.error("Failed to load extracted pages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExtractedPages();

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => {
      subscription?.remove();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, [chapterId]);

  const handlePagePress = () => {
    setControlsVisible(!controlsVisible);
  };

  const handleClose = () => {
    onClose();
  };

  const handleScroll = (event) => {
    if (scale === 1) {
      const offsetY = event.nativeEvent.contentOffset.y;
      const pageHeight = dimensions.width * 1.4;
      const currentPage = Math.floor(offsetY / pageHeight);
      setCurrentPageIndex(currentPage);
    }
  };

  const onPinchGestureEvent = ({ nativeEvent }) => {
    const newScale = lastScale * nativeEvent.scale;
    setScale(Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE));
  };

  const onPinchHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      setLastScale(scale);
    }
  };

  const handleNextChapter = () => {
    if (nextChapterId) {
      if (nextChapterPurchased) {
        // You would need to implement navigation to the next chapter
      } else {
        // Handle purchase requirement
      }
    }
  };

  const SecurityOverlay = () => (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "black", opacity: 0.95 },
      ]}
      pointerEvents="none"
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF7F1A" />
        <Text style={styles.loadingText}>Loading chapter...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={true} animationType="fade" statusBarTranslucent>
        <StatusBar hidden />
        <SafeAreaView style={styles.container}>
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
          >
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              scrollEnabled={scale === 1}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={handlePagePress}
                style={styles.contentContainer}
              >
                {pages.map((page, index) => (
                  <View key={index} style={styles.pageContainer}>
                    <Image
                      source={{ uri: page.uri }}
                      style={[
                        styles.image,
                        {
                          width: dimensions.width,
                          height: dimensions.width * 1.4,
                          transform: [{ scale }],
                        },
                      ]}
                      resizeMode="contain"
                      fadeDuration={0}
                    />
                  </View>
                ))}
              </TouchableOpacity>
            </ScrollView>
          </PinchGestureHandler>

          {controlsVisible && (
            <>
              <View style={styles.topControls}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.pageIndicator}>
                  <Text style={styles.pageIndicatorText}>
                    {`${currentPageIndex + 1} / ${pages.length}`}
                  </Text>
                </View>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
      <SecurityOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
  },
  image: {
    marginVertical: 0,
  },
  topControls: {
    position: "absolute",
    top: Platform.OS === "ios" ? 44 : 24,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
  },
  pageIndicator: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 10,
  },
  pageIndicatorText: {
    color: "#fff",
    fontSize: 12,
  },
  pageContainer: {
    position: "relative",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#FFF",
    marginTop: 10,
  },
});

export default SimpleChapterReader;
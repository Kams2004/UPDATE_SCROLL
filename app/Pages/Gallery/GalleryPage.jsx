import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
  Image,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Loader from "../../../components/Loader";
import { useNetInfo } from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

// Enhanced image component with better error handling
const EnhancedImage = ({ source, style, resizeMode }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || Platform.OS === "web") {
    return (
      <Image
        source={typeof source === "number" ? source : { uri: source.uri }}
        style={style}
        resizeMode={resizeMode}
        onError={(e) =>
          console.warn("Image loading failed:", e.nativeEvent.error)
        }
      />
    );
  }

  try {
    const FastImage = require("react-native-fast-image").default;
    return (
      <FastImage
        source={source}
        style={style}
        resizeMode={
          FastImage.resizeMode[resizeMode] || FastImage.resizeMode.cover
        }
        onError={() => {
          console.warn("FastImage failed, falling back to regular Image");
          setHasError(true);
        }}
      />
    );
  } catch (error) {
    console.warn("FastImage import failed:", error);
    return (
      <Image
        source={typeof source === "number" ? source : { uri: source.uri }}
        style={style}
        resizeMode={resizeMode}
        onError={(e) =>
          console.warn("Image loading failed:", e.nativeEvent.error)
        }
      />
    );
  }
};

const GalleryPage = () => {
  const [showFullText, setShowFullText] = useState({});
  const [galleryData, setGalleryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const navigation = useNavigation();
  const netInfo = useNetInfo();

  const GALLERY_STORAGE_KEY = "galleryData";

  const fetchGalleryData = async () => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem(GALLERY_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setGalleryData(parsedData);
      }
      if (netInfo.isConnected) {
        const response = await fetch(
          "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/galleries"
        );
        if (!response.ok) throw new Error("Failed to fetch gallery data");
        const data = await response.json();
        const mergedData = mergeGalleryData(galleryData, data);
        setGalleryData(mergedData);
        await AsyncStorage.setItem(
          GALLERY_STORAGE_KEY,
          JSON.stringify(mergedData)
        );
      }
    } catch (error) {
      console.error("Error fetching gallery data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const mergeGalleryData = (existingData, newData) => {
    const existingIds = new Set(existingData.map((item) => item._id));
    const uniqueNewData = newData.filter((item) => !existingIds.has(item._id));
    return [...existingData, ...uniqueNewData];
  };

  useEffect(() => {
    fetchGalleryData();
  }, [netInfo.isConnected]);

  const handleMoreText = useCallback((id) => {
    setShowFullText((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openPreview = (uri) => {
    setPreviewImage(uri);
    setPreviewVisible(true);
  };

  if (loading) {
    return <Loader visible={loading} />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => openPreview(item.mediaContentUrl)}>
        <EnhancedImage
          source={{ uri: item.mediaContentUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text
            style={styles.overlayText}
            numberOfLines={showFullText[item._id] ? undefined : 3}
          >
            {item.textContent}
          </Text>
          {item.textContent.length > 100 && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => handleMoreText(item._id)}
            >
              <Text style={styles.moreText}>
                {showFullText[item._id] ? "SHOW LESS" : "SHOW MORE"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <View style={styles.navTextContainer}>
          <Text style={styles.navTextTop}>Kijins</Text>
          <Text style={styles.navTextBottom}>Gallery</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Home");
            }
          }}
        >
          <Image
            source={require("./../../../assets/scrollboxImg/09.png")}
            style={styles.closeIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={galleryData}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollContainer}
        removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        onEndReachedThreshold={0.5}
      />

      {/* Image Preview Modal */}
      {previewVisible && (
        <Modal
          visible={previewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <View style={styles.previewOverlay}>
            <BlurView
              intensity={100}
              style={StyleSheet.absoluteFillObject}
              tint="dark"
            />
            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={() => setPreviewVisible(false)}
            >
              <Image
                source={require("./../../../assets/scrollboxImg/09.png")}
                style={styles.previewCloseIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <EnhancedImage
              source={{ uri: previewImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    fontWeight: "500",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "black",
    paddingTop: Platform.OS === "ios" ? "5%" : "2%",
    paddingBottom: "7%",
  },
  navTextContainer: {
    marginLeft: 20,
  },
  navTextTop: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#EF7F1A",
  },
  navTextBottom: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
  },
  closeIcon: {
    width: width * 0.08,
    height: width * 0.08,
    marginRight: 25,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 100 : 80,
  },
  card: {
    width: "100%",
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderBottomWidth: 2,
    borderBottomColor: "#EF7F1A",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardImage: {
    width: "100%",
    height: 380,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    padding: 15,
  },
  textContainer: {
    marginBottom: 10,
  },
  overlayText: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
  moreButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "rgba(239, 127, 26, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EF7F1A",
  },
  moreText: {
    color: "#EF7F1A",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  dateText: {
    color: "gray",
    fontSize: 12,
    textAlign: "right",
    marginTop: 5,
    fontStyle: "italic",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "90%",
    height: "80%",
  },
  previewCloseButton: {
    position: "absolute",
    top: 30,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(43, 20, 9, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  previewCloseIcon: {
    width: 20,
    height: 20,
  },
});

export default GalleryPage;

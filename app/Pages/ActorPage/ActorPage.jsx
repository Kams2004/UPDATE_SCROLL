import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "@/app/Services/ApiService";
import { useNavigation } from "@react-navigation/native";
import Loader from "../../../components/Loader";
import { useTranslation } from "react-i18next";
import { useNetInfo } from "@react-native-community/netinfo";

const { width, height } = Dimensions.get("window");

const ActorPage = () => {
  const { t } = useTranslation(); // Translation hook
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [characterData, setCharacterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const netInfo = useNetInfo();

  const CHARACTER_STORAGE_KEY = "characterData";

  // Fetch character data from AsyncStorage or API
  const fetchCharacterData = useCallback(async () => {
    try {
      setLoading(true);

      // Check if data exists in AsyncStorage
      const storedData = await AsyncStorage.getItem(CHARACTER_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setCharacterData(parsedData);
      }

      // Fetch data from the server if online
      if (netInfo.isConnected) {
        const language = (await AsyncStorage.getItem("language")) || "en"; // Default to 'en' if no language preference is found
        const token = await AsyncStorage.getItem("token"); // Fetch token if it exists

        const characters = await ApiService.getCharacters(language, token);
        if (characters && characters.length > 0) {
          const formattedCharacters = characters.map((character, index) => ({
            id: character.name,
            title: character.name,
            description: character.description,
            image: character.image ? { uri: character.image } : null,
            fallbackImage:
              index < 6
                ? [
                    require("./../../../assets/scrollboxImg/P02.png"),
                    require("./../../../assets/scrollboxImg/P06.png"),
                    require("./../../../assets/scrollboxImg/P04.png"),
                    require("./../../../assets/scrollboxImg/P01.png"),
                    require("./../../../assets/scrollboxImg/P29.png"),
                    require("./../../../assets/scrollboxImg/P38.png"),
                  ][index]
                : null,
          }));

          // Merge new data with existing data
          const mergedData = mergeCharacterData(characterData, formattedCharacters);

          // Update state and AsyncStorage
          setCharacterData(mergedData);
          await AsyncStorage.setItem(
            CHARACTER_STORAGE_KEY,
            JSON.stringify(mergedData)
          );

          if (mergedData.length > 0) {
            setSelectedItem(mergedData[0].id);
            setSelectedImage(
              mergedData[0].image || mergedData[0].fallbackImage
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching characters:", error);
    } finally {
      setLoading(false);
    }
  }, [netInfo.isConnected]);

  // Merge existing character data with new data
  const mergeCharacterData = (existingData, newData) => {
    const existingIds = new Set(existingData.map((item) => item.id));
    const uniqueNewData = newData.filter((item) => !existingIds.has(item.id));
    return [...existingData, ...uniqueNewData];
  };

  useEffect(() => {
    fetchCharacterData();
  }, [fetchCharacterData]);

  const handleSelect = (item) => {
    if (selectedItem === item.id) {
      setSelectedItem(null);
      setSelectedImage(null);
    } else {
      setSelectedItem(item.id);
      setSelectedImage(item.image || item.fallbackImage);
    }
  };

  const handleCloseModal = () => {
    navigation.navigate("Home");
  };

  if (loading) {
    return <Loader visible={loading} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navBar}>
        <View style={styles.navTextContainer}>
          <Text style={styles.navTextTop}>{t("homepage.the_kijins")}</Text>
          <Text style={styles.navTextBottom}>{t("actors.title")}</Text>
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
          />
        </TouchableOpacity>
      </View>

      {/* Selected Image */}
      {selectedImage && (
        <ImageBackground
          source={selectedImage}
          style={styles.selectedImageBackground}
          resizeMode="cover"
        />
      )}

      {/* Background and Character List */}
      <ImageBackground
        source={require("./../../../assets/scrollboxImg/Back01.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.flatListContainer}>
          <FlatList
            style={styles.videosFlatList}
            horizontal
            data={characterData}
            renderItem={({ item }) => (
              <RowItem
                item={item}
                onSelect={handleSelect}
                selectedId={selectedItem}
                t={t}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.flatListContent}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
          />
          <LinearGradient
            colors={["transparent", "black"]}
            style={styles.rightGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <LinearGradient
            colors={["transparent", "black"]}
            style={styles.leftGradient}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const RowItem = ({ item, onSelect, selectedId, t }) => {
  const isSelected = selectedId === item.id;

  return (
    <View style={styles.rowContainer}>
      <TouchableOpacity
        onPress={() => onSelect(item)}
        style={styles.rowItem}
        accessible
        accessibilityLabel={t("actors.description", { name: item.title })}
      >
        <Image
          source={item.image || item.fallbackImage}
          style={styles.cardImage}
        />
        <Text style={styles.rowItemText}>{item.title}</Text>
      </TouchableOpacity>

      {isSelected && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>{item.title}</Text>
          <ScrollView style={styles.infoDescriptionContainer}>
            <Text style={styles.infoDescription}>{item.description}</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "black",
    paddingTop: "4%",
    zIndex: 3,
  },
  navTextContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: 20,
    marginBottom: 10,
  },
  navTextTop: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#EF7F1A",
  },
  navTextBottom: {
    fontSize: 25,
    color: "white",
    fontWeight: "bold",
  },
  closeIcon: {
    width: 30,
    height: 30,
    marginRight: 25,
    marginBottom: 20,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImageBackground: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
    top: "25.1%",
    left: 0,
    right: -150,
    height: "70%",
    zIndex: 2,
    resizeMode: "contain",
  },
  videosFlatList: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 5,
  },
  flatListContainer: {
    position: "absolute",
    top: height * 0.6,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "black",
    paddingVertical: height * 0.167,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    zIndex: 2,
  },
  flatListContent: {
    paddingHorizontal: 10,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: 20,
    marginBottom: 50,
  },
  rowItem: {
    backgroundColor: "#8B4513",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    height: height * 0.23,
    width: width * 0.36,
    overflow: "hidden",
  },
  cardImage: {
    width: "200%",
    height: "100%",
    position: "absolute",
    top: 20,
    left: 5,
  },
  rowItemText: {
    color: "#fff",
    marginTop: 5,
  },
  infoContainer: {
    marginLeft: 10,
    padding: 1,
    width: 230,
  },
  infoTitle: {
    color: "gray",
    fontSize: 20,
    fontWeight: "bold",
  },
  infoDescriptionContainer: {
    maxHeight: 140,
  },
  infoDescription: {
    fontSize: 12,
    color: "gray",
  },
  leftGradient: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  rightGradient: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default ActorPage;
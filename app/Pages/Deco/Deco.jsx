import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "@/app/Services/ApiService";
import Loader from "../../../components/Loader";
import { useNetInfo } from "@react-native-community/netinfo";

const { width, height } = Dimensions.get("window");

const ITEMS_PER_PAGE = 15;

const DicoPage = () => {
  const navigation = useNavigation();
  const [expandedItems, setExpandedItems] = useState({});
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [glossaryTerms, setGlossaryTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const animatedHeights = useRef({});
  const netInfo = useNetInfo();

  const GLOSSARY_STORAGE_KEY = "glossaryTerms";

  // Fetch glossary terms from AsyncStorage or API
  const fetchGlossary = async () => {
    try {
      setLoading(true);

      // Check if data exists in AsyncStorage
      const storedData = await AsyncStorage.getItem(GLOSSARY_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setGlossaryTerms(parsedData);
      }

      // Fetch data from the server if online
      if (netInfo.isConnected) {
        const language = (await AsyncStorage.getItem("language")) || "en";
        const terms = await ApiService.getGlossaryTerms(language);

        // Merge new data with existing data
        const mergedTerms = mergeTerms(glossaryTerms, terms);

        // Update state and AsyncStorage
        setGlossaryTerms(mergedTerms);
        await AsyncStorage.setItem(
          GLOSSARY_STORAGE_KEY,
          JSON.stringify(mergedTerms)
        );
      }
    } catch (error) {
      console.error("Error fetching glossary terms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Merge existing terms with new terms
  const mergeTerms = (existingTerms, newTerms) => {
    const existingIds = new Set(existingTerms.map((term) => term.id));
    const uniqueNewTerms = newTerms.filter((term) => !existingIds.has(term.id));
    return [...existingTerms, ...uniqueNewTerms];
  };

  useEffect(() => {
    fetchGlossary();
  }, [netInfo.isConnected]);

  const totalPages = Math.ceil(glossaryTerms.length / ITEMS_PER_PAGE);

  const displayedItems =
    searchQuery.length > 0
      ? filteredItems
      : glossaryTerms.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        );

  const toggleExpand = (id) => {
    const isExpanded = expandedItems[id];
    setExpandedItems((prev) => ({ ...prev, [id]: !isExpanded }));

    if (!animatedHeights.current[id]) {
      animatedHeights.current[id] = new Animated.Value(0);
    }

    Animated.timing(animatedHeights.current[id], {
      toValue: isExpanded ? 0 : 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  const handlePageSelection = (page) => {
    setCurrentPage(page);
    setDropdownVisible(false);
  };

  const handleSearch = () => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = glossaryTerms.filter((item) =>
      item.term.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredItems(filtered);
    Keyboard.dismiss();
  };

  if (loading) {
    return <Loader visible={loading} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <View style={styles.navTextContainer}>
          <Text style={styles.navTextTop}>Kijins</Text>
          <Text style={styles.navTextBottom}>Dico</Text>
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

      <ImageBackground
        source={require("./../../../assets/scrollboxImg/Back01.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {displayedItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.listItem,
                { borderColor: expandedItems[index] ? "orange" : "gray" },
              ]}
            >
              <TouchableOpacity
                style={styles.listHeader}
                onPress={() => toggleExpand(index)}
              >
                <Text style={styles.listTitle}>{item.term}</Text>
                <Image
                  source={require("./../../../assets/scrollboxImg/17.png")}
                  style={styles.listIcon}
                />
              </TouchableOpacity>
              <Animated.View
                style={{
                  overflow: "hidden",
                  height: animatedHeights.current[index] || 0,
                }}
              >
                <ScrollView
                  style={styles.listDescriptionContainer}
                  nestedScrollEnabled
                >
                  <Text style={styles.listDescription}>{item.definition}</Text>
                </ScrollView>
              </Animated.View>
            </View>
          ))}
        </ScrollView>
      </ImageBackground>

      <View style={styles.footerBar}>
        <View style={styles.collapseContainer}>
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => setDropdownVisible(!isDropdownVisible)}
          >
            <Text style={styles.collapseButtonText}>Page {currentPage}</Text>
          </TouchableOpacity>
          {isDropdownVisible && (
            <View style={styles.dropdown}>
              {Array.from({ length: totalPages }, (_, index) => ({
                id: index + 1,
                label: `Page ${index + 1}`,
              })).map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.dropdownItem}
                  onPress={() => handlePageSelection(option.id)}
                >
                  <Text style={styles.dropdownText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="white"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch}>
            <Image
              source={require("./../../../assets/scrollboxImg/17.png")}
              style={styles.searchIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
    paddingTop: "5%",
    paddingBottom: "7%",
  },
  navTextContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
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
  backgroundImage: {
    flex: 1,
  },
  scrollContainer: {
    padding: 15,
  },
  listItem: {
    borderWidth: 1.5,
    backgroundColor: "rgba(43, 20, 9, 0.8)",
    borderRadius: 8,
    marginBottom: 8,
    padding: 15,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listTitle: {
    color: "#EF7F1A",
    fontSize: 18,
    fontWeight: "bold",
  },
  listIcon: {
    width: 20,
    height: 20,
    tintColor: "orange",
  },
  listDescription: {
    marginTop: 10,
    color: "white",
    fontSize: 14,
  },
  footerBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "black",
    padding: height * 0.02,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 25,
    width: "45%",
    height: 40,
    paddingHorizontal: 5,
  },
  searchInput: {
    flex: 1,
    color: "white",
  },
  searchIcon: {
    width: 30,
    height: 30,
    tintColor: "orange",
  },
  collapseContainer: {
    position: "relative",
    width: "30%",
  },
  collapseButton: {
    backgroundColor: "gray",
    opacity: 0.5,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  collapseButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  dropdown: {
    position: "absolute",
    bottom: 50,
    left: 0,
    backgroundColor: "black",
    borderRadius: 8,
    paddingVertical: 5,
    width: "100%",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownText: {
    color: "white",
    fontSize: 14,
  },
  listDescriptionContainer: {
    maxHeight: 100,
    marginTop: 10,
  },
  listDescription: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
    overflow: "hidden",
  },
});

export default DicoPage;
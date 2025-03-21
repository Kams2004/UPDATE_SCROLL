import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  BackHandler,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import i18n, { changeLanguage } from "../../Pages/locales/i18n";
import { useRouter } from "expo-router"; // Import useRouter

const { width, height } = Dimensions.get("window");

export default function UserProfileModal({ visible, onClose }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showLanguages, setShowLanguages] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const languageFlags = {
    en: require("../../../assets/scrollboxImg/en.png"),
    fr: require("../../../assets/scrollboxImg/fr.png"),
  };

  // Fetch user and language data
  const fetchUserData = useCallback(async () => {
    try {
      const email = await AsyncStorage.getItem("email");
      const storedLang = await AsyncStorage.getItem("language");

      if (email) {
        const username = email.split("@")[0];
        setLoggedInUser(username);
      }

      if (storedLang) {
        setSelectedLanguage(storedLang);
        await changeLanguage(storedLang);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchUserData();
    }
  }, [visible, fetchUserData]);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showLanguages) {
          setShowLanguages(false); // Close the language selection instead of the modal
          return true; // Prevent exiting the app
        }
        return false; // Allow default behavior
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [showLanguages])
  );

  // Navigation handlers with error handling
  const navigateSafely = (screenName) => {
    try {
      // Delay navigation slightly to ensure modal closes smoothly
      onClose();
      setTimeout(() => {
        if (navigation.canGoBack() || navigation.isFocused()) {
          navigation.navigate("UserProfile", {
            screen: screenName,
          });
        }
      }, 300); // Add a slight delay to allow modal to close
    } catch (error) {
      console.error(`Navigation error to ${screenName}:`, error);
      Alert.alert(t("common.error"), t("common.navigation_error"));
    }
  };

  const handleLoginNavigation = () => {
    if (loggedInUser) {
      Alert.alert(t("common.error"), t("menu.already_logged_in"));
    } else {
      navigateSafely("LoginPage");
    }
  };

  const handleLogout = async () => {
    try {
      // Preserve language setting
      const currentLang = await AsyncStorage.getItem("language");
      await AsyncStorage.clear();

      if (currentLang) {
        await AsyncStorage.setItem("language", currentLang);
      }

      setLoggedInUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert(t("common.error"), t("menu.logout_error"));
    }
  };

  const handleExitOrLogout = async () => {
    if (loggedInUser) {
      await handleLogout();
    }
    onClose();
  };

  const toggleLanguageSelection = () => {
    setShowLanguages(!showLanguages);
  };

  const selectLanguage = async (lang) => {
    const normalizedLang = lang.toLowerCase();
    try {
      await changeLanguage(normalizedLang);
      await AsyncStorage.setItem("language", normalizedLang);
      setSelectedLanguage(normalizedLang);
      setShowLanguages(false);
    } catch (error) {
      console.error("Language change error:", error);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={["rgba(125, 59, 28, 0.1)", "rgba(125, 59, 28, 0.7)"]}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Image
              source={require("../../../assets/scrollboxImg/09.png")}
              style={styles.closeButtonImage}
            />
          </TouchableOpacity>

          <View style={styles.userSection}>
          <View style={styles.userTextContainer}>
  {loggedInUser ? (
    <>
      <Text style={styles.userName}>
        {loggedInUser.split(" ")[0]}
      </Text>
      <Text style={styles.userLastName}>
        {loggedInUser.split(" ").slice(1).join(" ")}
      </Text>
    </>
  ) : (
    <View style={styles.loginContainer}>
      <Text style={styles.userName}>{t("menu.user")}</Text>
      <TouchableOpacity onPress={handleLoginNavigation}>
        <Text style={styles.loginText}>{t("menu.login")}</Text>
      </TouchableOpacity>
    </View>
  )}
</View>


            <TouchableOpacity
              onPress={handleLoginNavigation}
              disabled={loggedInUser !== null}
            >
              <Image
                source={require("../../../assets/scrollboxImg/07.png")}
                style={[
                  styles.userIcon,
                  loggedInUser !== null && styles.disabledIcon,
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => navigateSafely("ActorPage")}
            >
              <Image
                source={require("../../../assets/scrollboxImg/18.png")}
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>{t("menu.actors")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.spacing]}
              onPress={() => navigateSafely("Map")}
            >
              <Image
                source={require("../../../assets/scrollboxImg/19.png")}
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>{t("menu.map")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.spacing]}
              onPress={() => navigateSafely("Deco")}
            >
              <Image
                source={require("../../../assets/scrollboxImg/20-02.png")}
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>{t("menu.dico")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.spacing]}
              onPress={() => navigateSafely("GalleryPage")}
            >
              <Image
                source={require("../../../assets/scrollboxImg/20.png")}
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>{t("menu.gallery")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExitOrLogout}
            >
              <Image
                source={require("../../../assets/scrollboxImg/logout.png")}
                style={styles.exitIcon}
              />
              <Text style={styles.exitText}>
                {loggedInUser ? t("menu.logout") : t("common.close")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.languageButton}
              onPress={toggleLanguageSelection}
            >
              <View style={styles.languageSelector}>
                <Image
                  source={languageFlags[selectedLanguage]}
                  style={styles.flagIcon}
                />
                <Text style={styles.languageText}>
                  {selectedLanguage === "en" ? "English" : "Français"}
                </Text>
              </View>
              {showLanguages && (
                <View style={styles.languageOptions}>
                  {["en", "fr"].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={styles.languageOption}
                      onPress={() => selectLanguage(lang)}
                    >
                      <Image
                        source={languageFlags[lang]}
                        style={styles.flagIcon}
                      />
                      <Text style={styles.languageOptionText}>
                        {lang === "en" ? "English" : "Français"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginContainer: {
    // flexDirection: "row",
    // alignItems: "center",
    justifyContent: "flex-end",

    width:100,
  },
  modalContent: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: width * 0.35,
    padding: 20,
    justifyContent: "space-between",
  },
  closeButton: {
    position: "absolute",
    top: height * 0.05,
    right: width * 0.09,
    zIndex: 1,
  },
  closeButtonImage: {
    width: 35,
    height: 35,
  },
  userSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 70,
    paddingRight: 20,
  },
  userTextContainer: {
    marginRight: 6,
    marginTop: 12,
    alignItems: "flex-start",
  
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "right",
  },
  userLastName: {
    fontSize: 18,
    color: "#FFF",
    textAlign: "right",
  },
  loginText: {
    fontSize: 16,
    color: "#FFA500",
    textAlign: "right", // Align text to the right
    width: 100, 
  },
  userIcon: {
    width: width * 0.15,
    height: height * 0.15,
    resizeMode: "contain",
  },
  disabledIcon: {
    opacity: 0.5,
  },
  optionsMenu: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
  },
  optionButton: {
    alignItems: "center",
  },
  spacing: {
    marginTop: height * 0.01,
  },
  optionIcon: {
    width: width * 0.2,
    height: height * 0.06,
    marginBottom: height * 0.01,
    resizeMode: "contain",
  },
  optionText: {
    fontSize: 16,
    color: "#FFF",
    marginBottom:20,
    
  },
  footer: {
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.025,
  },
  exitIcon: {
    width: 26,
    height: 26,
    marginRight: 10,
    tintColor: "#FFF",
    resizeMode: "contain",
  },
  exitText: {
    fontSize: 18,
    color: "#FFF",
  },
  languageButton: {
    padding: height * 0.001,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  flagIcon: {
    width: 20,
    height: 15,
    marginRight: 8,
    resizeMode: "contain",
  },
  languageText: {
    fontSize: 16,
    color: "#FFF",
  },
  languageOptions: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 5,
    padding: 5,
    width: 150,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  languageOptionText: {
    color: "#FFF",
    fontSize: 14,
    marginLeft: 10,
  },
});
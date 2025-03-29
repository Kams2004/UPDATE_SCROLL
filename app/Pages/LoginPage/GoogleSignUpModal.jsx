import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

export default function GoogleSignUpModal({
  visible,
  onClose,
  navigation,
  onSuccess,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authResult, setAuthResult] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);
  const [token, setToken] = useState(null);
  const webViewRef = useRef(null);

  // URL for Google auth - matches web implementation
  const googleAuthURL =
    "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/google";

  // Automatically show WebView when modal becomes visible
  useEffect(() => {
    if (visible) {
      handleGoogleLogin();
    }
  }, [visible]);

  // Fetch country list on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // This would ideally come from your API or a static list
        const countries = [
          { label: "United States", value: "us" },
          { label: "United Kingdom", value: "gb" },
          { label: "Canada", value: "ca" },
          { label: "France", value: "fr" },
          { label: "Germany", value: "de" },
          // Add more countries as needed
        ];
        setCountryOptions(countries);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    };

    fetchCountries();
  }, []);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError("");
    setShowWebView(true);
  };

  // Handle WebView navigation state changes
  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;

    // Check if the URL contains a token parameter (redirect from Google auth)
    if (url && url.includes("token=")) {
      try {
        // Parse the URL to extract token
        const urlObj = new URL(url);
        const extractedToken = urlObj.searchParams.get("token");

        if (extractedToken) {
          setShowWebView(false);
          setIsLoading(true);
          setToken(extractedToken);

          // Fetch user data using the token
          const res = await axios.get(
            "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/user",
            { headers: { Authorization: `Bearer ${extractedToken}` } }
          );

          const userName = res?.data?.user?.name;
          const userID = res?.data?.user?._id;
          const userCountryCode = res?.data?.user?.countryCode;

          if (!userName || !userID) {
            throw new Error("Incomplete user data received");
          }

          if (!userCountryCode) {
            // Show country selector if country code is missing
            setShowCountrySelector(true);
            setIsLoading(false);
          } else {
            // Complete the login process
            completeLogin(extractedToken, userName, userID, userCountryCode);
          }
        } else {
          throw new Error("No token found in redirect URL");
        }
      } catch (error) {
        console.error("Failed to complete authentication:", error);
        setError(error.message || "Authentication failed");
        setAuthResult("error");
        setIsLoading(false);
      }
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const handleCountrySubmit = async () => {
    if (!selectedCountry || !token) {
      setError("Please select a country to continue");
      return;
    }

    setIsLoading(true);
    try {
      // Update user with country code
      await axios.put(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/user/update",
        {
          countryCode: selectedCountry.value.toUpperCase(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch updated user data
      const updatedUserRes = await axios.get(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/user",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = updatedUserRes?.data?.user;
      const userName = updatedUser?.name;
      const userID = updatedUser?._id;
      const userCountryCode = updatedUser?.countryCode;

      if (!userName || !userID) {
        throw new Error("Incomplete user data received after update");
      }

      // Complete the login process
      completeLogin(token, userName, userID, userCountryCode);
    } catch (error) {
      console.error("Failed to update country:", error);
      setError(error.message || "Failed to update country");
      setAuthResult("error");
      setIsLoading(false);
    }
  };

  const completeLogin = async (token, name, userID, countryCode) => {
    try {
      // Store user data
      const userData = {
        name,
        token,
        loginTime: Date.now(),
        userID,
        countryCode,
      };

      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      setAuthResult("success");

      // Call success handler if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after a short delay to show the success state
      setTimeout(() => {
        onClose();
        // Navigate to appropriate screen after successful login
        navigation.replace("Home");
      }, 1500);
    } catch (error) {
      console.error("Failed to save user data:", error);
      setError(error.message || "Failed to save user data");
      setAuthResult("error");
    } finally {
      setIsLoading(false);
    }
  };

  const renderCountrySelector = () => {
    return (
      <View style={styles.countrySelectorContainer}>
        <Text style={styles.countryTitle}>Select Your Country</Text>
        <View style={styles.countryList}>
          {countryOptions.map((country) => (
            <TouchableOpacity
              key={country.value}
              style={[
                styles.countryOption,
                selectedCountry?.value === country.value &&
                  styles.selectedCountry,
              ]}
              onPress={() => handleCountrySelect(country)}
            >
              <Text
                style={[
                  styles.countryText,
                  selectedCountry?.value === country.value &&
                    styles.selectedCountryText,
                ]}
              >
                {country.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.submitCountryButton}
          onPress={handleCountrySubmit}
          disabled={!selectedCountry}
        >
          <Text style={styles.submitCountryText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    if (showWebView) {
      return (
        <View style={styles.webViewContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowWebView(false);
              setIsLoading(false);
              setError("");
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <WebView
            ref={webViewRef}
            source={{ uri: googleAuthURL }}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#EF7F1A" />
                <Text style={styles.loadingText}>
                  Loading authentication page...
                </Text>
              </View>
            )}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15.0 Safari/604.1"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            incognito={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
          />
        </View>
      );
    }

    if (showCountrySelector) {
      return renderCountrySelector();
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF7F1A" />
          <Text style={styles.loadingText}>Connecting to Google...</Text>
        </View>
      );
    }

    if (authResult === "success") {
      return (
        <View style={styles.resultContainer}>
          <Image
            source={require("../../../assets/scrollboxImg/success-icon.png")}
            style={styles.resultIcon}
          />
          <Text style={styles.successText}>Successfully signed in!</Text>
        </View>
      );
    }

    if (authResult === "error") {
      return (
        <View style={styles.resultContainer}>
          <Image
            source={require("../../../assets/scrollboxImg/error-icon.png")}
            style={styles.resultIcon}
          />
          <Text style={styles.errorText}>
            {error || "Authentication failed"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleGoogleLogin}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Default content (shouldn't be visible as we auto-show WebView)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF7F1A" />
        <Text style={styles.loadingText}>Starting authentication...</Text>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.modalContent,
            showWebView && styles.webViewModalContent,
            showCountrySelector && styles.countrySelectorModalContent,
          ]}
        >
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  webViewModalContent: {
    width: "95%",
    height: "80%",
    padding: 0,
    overflow: "hidden",
  },
  countrySelectorModalContent: {
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  webViewContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 30, 0.9)",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 16,
  },
  resultContainer: {
    alignItems: "center",
    padding: 20,
  },
  resultIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    resizeMode: "contain",
  },
  successText: {
    color: "#4BB543",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "#FF3333",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#EF7F1A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#121212",
    fontWeight: "bold",
  },
  // Country selector styles
  countrySelectorContainer: {
    width: "100%",
    alignItems: "center",
  },
  countryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  countryList: {
    width: "100%",
    maxHeight: 300,
  },
  countryOption: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#2D2D2D",
  },
  selectedCountry: {
    backgroundColor: "#EF7F1A",
  },
  countryText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  selectedCountryText: {
    color: "#121212",
    fontWeight: "bold",
  },
  submitCountryButton: {
    backgroundColor: "#EF7F1A",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
    width: "80%",
    alignItems: "center",
  },
  submitCountryText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "bold",
  },
});

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
  const webViewRef = useRef(null);

  // URL for Google auth
  const googleAuthURL =
    "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/google";

  // Automatically show WebView when modal becomes visible
  useEffect(() => {
    if (visible) {
      handleGoogleLogin();
    }
  }, [visible]);

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
        const token = urlObj.searchParams.get("token");

        if (token) {
          setShowWebView(false);
          setIsLoading(true);

          // Fetch user data using the token
          const res = await axios.get(
            "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/user",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const userName = res?.data?.user?.name;
          const userID = res?.data?.user?._id;

          if (!userName || !userID) {
            throw new Error("Incomplete user data received");
          }

          const userData = {
            name: userName,
            token,
            loginTime: Date.now(),
            userID,
          };

          // Store the user data
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
        } else {
          throw new Error("No token found in redirect URL");
        }
      } catch (error) {
        console.error("Failed to complete authentication:", error);
        setError(error.message || "Authentication failed");
        setAuthResult("error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderContent = () => {
    if (showWebView) {
      return (
        <View style={styles.webViewContainer}>
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
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            injectedJavaScript={`
              window.onerror = function(message, sourcefile, lineno, colno, error) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', message, sourcefile, lineno, colno}));
              };
              true;
            `}
            onMessage={(event) => {
              console.log("WebView message:", event.nativeEvent.data);
            }}
            incognito={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
          />
          <TouchableOpacity
            style={styles.webViewCloseButton}
            onPress={() => {
              setShowWebView(false);
              setIsLoading(false);
              setError("");
              onClose();
            }}
          >
            <Text style={styles.webViewCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
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
          ]}
        >
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

// Styles remain the same as in your original code
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
  webViewContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
  },
  webViewCloseButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#EF7F1A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  webViewCloseButtonText: {
    color: "#121212",
    fontWeight: "bold",
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
  title: {
    fontSize: 20,
    color: "#FFF",
    marginBottom: 10,
  },
  description: {
    color: "#FFF",
    marginBottom: 20,
    textAlign: "center",
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    resizeMode: "contain",
  },
  googleButtonText: {
    color: "#333333",
    fontWeight: "600",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#EF7F1A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#121212",
    fontWeight: "bold",
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
});

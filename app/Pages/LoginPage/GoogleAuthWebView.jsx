// GoogleAuthWebView.js
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet } from "react-native";
import WebView from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export const GoogleAuthWebView = ({ visible, onClose, onSuccess }) => {
  const navigation = useNavigation();

  const handleNavigationStateChange = async (navState) => {
    // Check if the URL contains the OAuth callback
    if (navState.url.includes("oauth/callback")) {
      try {
        // Extract token from URL if present
        const params = new URLSearchParams(navState.url.split("?")[1]);
        const token = params.get("token");

        if (token) {
          await AsyncStorage.setItem("userToken", token);
          onSuccess();
          navigation.navigate("Home");
        }
      } catch (error) {
        console.error("Error handling OAuth callback:", error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <WebView
        source={{
          uri: "https://mpbyvjm0qh.execute-api.eu-west-3.amazonaws.com/dev/api/google",
        }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
      />
    </Modal>
  );
};

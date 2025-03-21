import React, { useState, useEffect, useCallback } from "react";
import { BackHandler, Alert, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import screens
import LoginPage from "../Pages/LoginPage/LoginPage";
import SignUpPage from "../Pages/LoginPage/SignUpPage";
import ActorPage from "../Pages/ActorPage/ActorPage";
import GalleryPage from "../Pages/Gallery/GalleryPage";
import DicoPage from "../Pages/Deco/Deco";
import Map from "../Pages/map/Map";
import ForgotPasswordEmail from "../Pages/LoginPage/ForgotPasswordEmail";

import OTPVerificationPage from "../Pages/LoginPage/OTPVerificationPage";

const UserProfileStack = createNativeStackNavigator();

// Navigation state persistence
const NAVIGATION_STATE_KEY = "@navigation_state";

const saveNavigationState = async (state) => {
  try {
    await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save navigation state:", error);
  }
};

const loadNavigationState = async () => {
  try {
    const savedState = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.warn("Failed to load navigation state:", error);
    return null;
  }
};

// Enhanced Screen wrapper with state preservation
const ScreenWrapper = ({ children, navigation, route }) => {
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", async (e) => {
      await saveNavigationState({
        routes: navigation.getState().routes,
        currentRoute: route.name,
      });
    });

    return unsubscribe;
  }, [navigation, route]);

  return children;
};

export const UserProfileNavigator = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [initialRoute, setInitialRoute] = useState("LoginPage");
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Load saved navigation state on startup
  useEffect(() => {
    const initializeNavigation = async () => {
      const savedState = await loadNavigationState();
      if (savedState?.currentRoute === "OTPVerificationPage") {
        const hasEmail = await AsyncStorage.getItem("userEmail");
        if (hasEmail) {
          setInitialRoute("OTPVerificationPage");
        }
      }
      setIsNavigationReady(true);
    };

    initializeNavigation();
  }, []);

  // Enhanced network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return unsubscribe;
  }, []);

  if (!isNavigationReady) {
    return null;
  }

  return (
    <UserProfileStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: Platform.OS === "android" ? "none" : "slide_from_right",
        animationEnabled: Platform.OS === "ios",
        freezeOnBlur: false, // Changed to false to prevent screen disposal
        detachInactiveScreens: false, // Prevent screen detachment
      }}
    >
      {[
        { name: "LoginPage", component: LoginPage },
        { name: "SignUpPage", component: SignUpPage },
        { name: "ActorPage", component: ActorPage },
        { name: "GalleryPage", component: GalleryPage },
        { name: "Deco", component: DicoPage },
        { name: "Map", component: Map },
        { name: "OTPVerificationPage", component: OTPVerificationPage },
        { name: "ForgotPasswordEmail", component: ForgotPasswordEmail },

      ].map(({ name, component }) => (
        <UserProfileStack.Screen
          key={name}
          name={name}
          options={{
            gestureEnabled: false,
            freezeOnBlur: false,
          }}
        >
          {(props) => (
            <ScreenWrapper {...props}>
              {React.createElement(component, props)}
            </ScreenWrapper>
          )}
        </UserProfileStack.Screen>
      ))}
    </UserProfileStack.Navigator>
  );
};

export default UserProfileNavigator;

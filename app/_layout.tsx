import "react-native-gesture-handler";
import "react-native-reanimated";
import React, { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Platform,
  UIManager,
  LogBox,
  Alert,
  BackHandler,
  AppState,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useNavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import AuthProvider from "./context/AuthContext";
// import NetworkErrorModal from "./Pages/NetworkErrorModal/NetworkErrorModal";

// Import screens
import HomeScreen from "./index";
import SecondHomePage from "./Pages/SecondPage/SecondHomePage";
import ChapterReader from "./Pages/ChapterReader/ChapterReader";
import ChapterScreen from "./Pages/ChapterScreen/ChapterScreen";
import UserProfileNavigator from "../app/(tabs)/UserProfileNavigator";
import PaymentMethodPage from "./Pages/PurchaseModal/PaymentOptionsModal";

// Enable layout animations on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

LogBox.ignoreLogs([
  "Require cycle:",
  "[react-native-gesture-handler]",
  "ViewPropTypes will be removed",
  "ColorPropType will be removed",
]);

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const NAVIGATION_STATE_KEY = "navigationState";

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{
      headerShown: false,
      gestureEnabled: Platform.OS === "ios",
      gestureDirection: "horizontal",
      animation: Platform.OS === "android" ? "none" : "slide_from_right",
      animationEnabled: Platform.OS === "ios",
    }}
  >
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{
        freezeOnBlur: true,
      }}
    />
    <Stack.Screen name="PaymentMethodPage" component={PaymentMethodPage} />
    <Stack.Screen
      name="SecondHomePage"
      component={SecondHomePage}
      options={{
        freezeOnBlur: true,
      }}
    />
    <Stack.Screen
      name="ChapterReader"
      component={ChapterReader}
      options={{
        freezeOnBlur: true,
      }}
    />
    <Stack.Screen
      name="ChapterScreen"
      component={ChapterScreen}
      options={{
        freezeOnBlur: true,
      }}
    />
    <Stack.Screen
      name="UserProfile"
      component={UserProfileNavigator}
      options={{
        freezeOnBlur: true,
      }}
    />
  </Stack.Navigator>
);

function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const navigationRef = useNavigationContainerRef();
  const [appState, setAppState] = useState(AppState.currentState);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // Check if we were in OTP verification
          const savedState = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
          if (savedState) {
            const state = JSON.parse(savedState);
            if (
              state.currentRoute === "OTPVerificationPage" ||
              state.currentRoute === "ChapterReader"
            ) {
              // If user was reading a chapter, DO NOT reset navigation
              return;
            }
          }

          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        }
        setAppState(nextAppState);
      }
    );

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // Save navigation state when app goes to background
  useEffect(() => {
    const saveNavigationState = async () => {
      const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
      if (currentRoute) {
        await AsyncStorage.setItem(
          NAVIGATION_STATE_KEY,
          JSON.stringify({ currentRoute })
        );
      }
    };

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        saveNavigationState();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (navigationRef.current?.canGoBack()) {
          // If we can go back in the navigation stack
          const currentRoute = navigationRef.current?.getCurrentRoute()?.name;

          // List of screens where we want to show confirmation
          const confirmationScreens = ["ChapterReader", "ChapterScreen"];

          if (confirmationScreens.includes(currentRoute)) {
            // Show confirmation dialog for specific screens
            Alert.alert(
              "Go Back",
              "Are you sure you want to go back?",
              [
                { text: "Cancel", style: "cancel", onPress: () => {} },
                {
                  text: "Yes",
                  onPress: () => navigationRef.current?.goBack(),
                },
              ],
              { cancelable: false }
            );
          } else {
            // For other screens, just go back without confirmation
            navigationRef.current?.goBack();
          }
          return true;
        } else {
          // If we're at the root of the stack
          if (navigationRef.current?.getCurrentRoute()?.name !== "Home") {
            // If not on Home screen, navigate to Home instead of exiting
            navigationRef.current?.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
            return true;
          } else {
            // Only show exit confirmation if we're on the Home screen
            Alert.alert(
              "Exit App",
              "Are you sure you want to exit?",
              [
                { text: "Cancel", style: "cancel", onPress: () => {} },
                {
                  text: "Minimize",
                  onPress: () => {
                    // Minimize app instead of exiting
                    if (Platform.OS === "android") {
                      BackHandler.exitApp();
                    }
                  },
                },
              ],
              { cancelable: false }
            );
          }
          return true;
        }
      }
    );

    return () => backHandler.remove();
  }, []);

  // Initialize app
  useEffect(() => {
    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn("Initialization error:", e);
        Alert.alert(
          "Error",
          "An error occurred during initialization. Please restart the app.",
          [{ text: "Close", onPress: () => BackHandler.exitApp() }]
        );
      } finally {
        setAppIsReady(true);
      }
    };

    prepareApp();
  }, []);

  // Handle network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("Error hiding splash screen:", e);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // if (!isConnected) {
  //   return (
  //     <NetworkErrorModal
  //       visible={!isConnected}
  //       onRetry={() => NetInfo.fetch()}
  //     />
  //   );
  // }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default RootLayout;

import "react-native-gesture-handler";
import "react-native-reanimated";
import React, { useEffect, useState, useCallback } from "react";
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
import { NavigationContainer } from "@react-navigation/native";
import { useNavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
// import NetworkErrorModal from "../Pages/NetworkErrorModal/NetworkErrorModal";

// Import screens
import HomeScreen from "./index";
import SecondHomePage from "../Pages/SecondPage/SecondHomePage";
import ChapterReader from "../Pages/ChapterReader/ChapterReader";
import ChapterScreen from "../Pages/ChapterScreen/ChapterScreen";
import UserProfileNavigator from "./UserProfileNavigator";

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

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{
      headerShown: false,
      gestureEnabled: Platform.OS === "ios", // Only enable gestures on iOS
      gestureDirection: "horizontal",
      animation: Platform.OS === "android" ? "none" : "slide_from_right", // Disable animations on Android
      animationEnabled: Platform.OS === "ios",
      screenListeners: {
        beforeRemove: (e) => {
          // Prevent accidental screen removal
          e.preventDefault();
          Alert.alert(
            "Go Back",
            "Are you sure you want to go back?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes",
                onPress: () => e.data.action,
              },
            ],
            { cancelable: false }
          );
        },
      },
    }}
  >
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{
        freezeOnBlur: true, // Optimize performance by freezing inactive screens
      }}
    />
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
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        // App has come to foreground - reset navigation if needed
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (navigationRef.current?.canGoBack()) {
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
          return true;
        } else {
          // At root screen
          Alert.alert(
            "Exit App",
            "Are you sure you want to exit?",
            [
              { text: "Cancel", style: "cancel", onPress: () => {} },
              { text: "Exit", onPress: () => BackHandler.exitApp() },
            ],
            { cancelable: false }
          );
          return true;
        }
      }
    );

    return () => backHandler.remove();
  }, []);

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
      <NavigationContainer ref={navigationRef}>
        <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
          <AppNavigator />
        </GestureHandlerRootView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default RootLayout;

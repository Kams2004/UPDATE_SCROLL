import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const AdvancedDownloadModal = ({ progress, stage }) => {
  const navigation = useNavigation(); // Navigation hook

  const fractals = React.useRef(
    [...Array(50)].map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      scale: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  React.useEffect(() => {
    fractals.forEach((fractal, index) => {
      Animated.parallel([
        Animated.timing(fractal.scale, {
          toValue: 1,
          duration: 2000 + index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(fractal.rotate, {
          toValue: 1,
          duration: 3000 + index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(fractal.opacity, {
          toValue: 0.5,
          duration: 2500 + index * 75,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Close Button with Navigation */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("Home");
          }
        }}
      >
        <Text style={styles.closeButtonText}>×</Text>
      </TouchableOpacity>

      {/* Floating Animated Fractals */}
      {fractals.map((fractal, index) => (
        <Animated.View
          key={index}
          style={[
            styles.fractal,
            {
              left: fractal.x,
              top: fractal.y,
              transform: [
                {
                  scale: fractal.scale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.random() * 2],
                  }),
                },
                {
                  rotate: fractal.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
              opacity: fractal.opacity,
            },
          ]}
        />
      ))}

      {/* Downloading Content */}
      <View style={styles.content}>
        <Animated.Text style={styles.stageText}>{stage}</Animated.Text>

        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { width: `${progress}%` }]}
          />
        </View>

        <Text style={styles.progressText}>{`${Math.round(progress)}%`}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030308",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  fractal: {
    position: "absolute",
    width: 10,
    height: 10,
    backgroundColor: "rgba(239, 127, 26, 0.3)", // Matched with EF7F1A
    borderRadius: 5,
    shadowColor: "#EF7F1A",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.7,
  },
  content: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  stageText: {
    color: "#EF7F1A",
    fontSize: 22,
    marginBottom: 20,
    letterSpacing: 2,
  },
  progressContainer: {
    width: "80%",
    height: 10,
    backgroundColor: "rgba(239, 127, 26, 0.1)", // Lighter shade of orange
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#EF7F1A",
    borderRadius: 5,
  },
  progressText: {
    color: "#EF7F1A",
    fontSize: 24,
    marginTop: 15,
    fontWeight: "bold",
  },
  // Close Button Style
  closeButton: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    color: "#EF7F1A",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default AdvancedDownloadModal;

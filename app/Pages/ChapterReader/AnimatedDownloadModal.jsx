import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Circle } from "react-native-progress";

const DownloadProgressIndicator = ({ progress, stage }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stageText} numberOfLines={1} ellipsizeMode="tail">
          {stage}
        </Text>
        <Circle
          size={40} // Smaller size
          progress={progress / 100}
          showsText={true}
          formatText={(progress) => `${Math.round(progress * 100)}%`}
          color="#EF7F1A"
          thickness={4} // Thinner circle
          textStyle={styles.progressText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 10, // Position near the button
    bottom: 10, // Position near the button
    backgroundColor: "rgba(26,26,26,0.9)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10, // Make sure it appears above other elements
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  stageText: {
    color: "#fff",
    fontSize: 10, // Smaller text
    marginBottom: 4,
    maxWidth: 80, // Limit width
  },
  progressText: {
    color: "#fff",
    fontSize: 10, // Smaller text
    fontWeight: "bold",
  },
});

export default DownloadProgressIndicator;

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Circle } from "react-native-progress";

const AnimatedDownloadModal = ({ progress, stage }) => {
  return (
    <View style={styles.container}>
      <View style={styles.modalContent}>
        <Text style={styles.stageText}>{stage}</Text>
        <Circle
          size={100}
          progress={progress / 100}
          showsText={true}
          formatText={(progress) => `${Math.round(progress * 100)}%`}
          color="#EF7F1A"
          thickness={8}
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  stageText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
});

export default AnimatedDownloadModal;

import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function NavigationArrows({ nextPage }) {
  const navigation = useNavigation();

  return (
    <>
      {/* Up Arrow - Previous Page */}
      <TouchableOpacity
        style={styles.arrowButtonUp}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-up-circle" size={50} color="#FFA500" />
      </TouchableOpacity>

      {/* Down Arrow - Next Page */}
      <TouchableOpacity
        style={styles.arrowButtonDown}
        onPress={() => navigation.navigate(nextPage)}
      >
        <Ionicons name="arrow-down-circle" size={50} color="#FFA500" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  arrowButtonUp: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 1,
  },
  arrowButtonDown: {
    position: "absolute",
    bottom: 20,
    right: 20,
    zIndex: 1,
  },
});

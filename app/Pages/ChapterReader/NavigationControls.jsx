import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, Animated } from "react-native";

const NavigationControls = ({
  currentChapter,
  onNavigate,
  nextChapterId,
  previousChapterId,
  nextChapterPurchased,
  onPurchase,
}) => {
  const [showControls, setShowControls] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const showAndHideControls = () => {
    setShowControls(true);
    fadeAnim.setValue(1);
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setShowControls(false));
    }, 3000);

    return () => clearTimeout(timer);
  };

  if (!showControls) {
    return (
      <TouchableOpacity
        style={styles.touchableArea}
        onPress={showAndHideControls}
        activeOpacity={1}
      />
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Previous Chapter Arrow */}
      {previousChapterId && (
        <TouchableOpacity
          style={[styles.navButton, styles.leftNav]}
          onPress={() => onNavigate("previous")}
        >
          <Text style={styles.navIcon}>←</Text>
        </TouchableOpacity>
      )}

      {/* Next Chapter Arrow */}
      {nextChapterId && (
        <TouchableOpacity
          style={[styles.navButton, styles.rightNav]}
          onPress={() => {
            if (nextChapterPurchased) {
              onNavigate("next");
            } else {
              onPurchase(nextChapterId);
            }
          }}
        >
          <Text style={styles.navIcon}>→</Text>
          {!nextChapterPurchased && (
            <View style={styles.lockBadge}>
              <Text style={styles.lockText}>$</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = {
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
  },
  touchableArea: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 40,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  leftNav: {
    left: 16,
  },
  rightNav: {
    right: 16,
  },
  navIcon: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  lockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EF7F1A",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  lockText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
};

export default NavigationControls;

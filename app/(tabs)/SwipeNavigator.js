import React from "react";
import { Animated, ScrollView, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { height, width } = Dimensions.get("window");

const SwipeNavigator = () => {
  const navigation = useNavigation();

  const handleMomentumScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const pageHeight = height;

    const currentPage = Math.round(offsetY / pageHeight);

    switch (currentPage) {
      case 0:
        navigation.navigate("Home");
        break;
      case 1:
        navigation.navigate("SecondHomePage");
        break;
      case 2:
        navigation.navigate("ThirdHomePage");
        break;
      case 3:
        navigation.navigate("FourthHomePage");
        break;
      case 4:
        navigation.navigate("FifthHomePage");
        break;
      case 5:
        navigation.navigate("SixthHomePage");
        break;
      case 6:
        navigation.navigate("SeventhHomePage");
        break;
      default:
        break;
    }
  };

  return (
    <Animated.ScrollView
      style={styles.container}
      pagingEnabled
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={handleMomentumScrollEnd}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default SwipeNavigator;

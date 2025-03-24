// CartService.js

import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../../Services/ApiService"; // Adjust path as needed

/**
 * Adds a chapter to the user's cart
 * @param {string} chapterId - The ID of the chapter to add
 * @param {Array} chapters - Array of all chapters
 * @param {Array} basket - Current basket state
 * @param {Function} setChapters - Function to update chapters state
 * @param {Function} setBasket - Function to update basket state
 * @param {Function} setCartItemsCount - Function to update cart count
 * @param {Function} setTotalAmount - Function to update total amount
 * @param {Function} showMessage - Function to display messages to the user
 * @param {Function} navigation - Navigation object for redirecting if needed
 * @param {string} t - Translation function
 * @returns {Promise<boolean>} - Success status
 */
export const handleAddToCart = async (
  chapterId,
  chapters,
  basket,
  setChapters,
  setBasket,
  setCartItemsCount,
  setTotalAmount,
  showMessage,
  navigation,
  t
) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      navigation.navigate("UserProfile", { screen: "LoginPage" });
      return false;
    }

    // Check if chapter is already in basket
    const isAlreadyInBasket = basket.some((item) => item.id === chapterId);
    if (isAlreadyInBasket) {
      // If already in basket, remove it instead
      await removeFromBasket(
        chapterId,
        chapters,
        basket,
        setChapters,
        setBasket,
        setCartItemsCount,
        setTotalAmount,
        showMessage,
        t
      );
      return false;
    }

    // Find the chapter to add
    const chapterToAdd = chapters.find((ch) => ch.id === chapterId);
    if (!chapterToAdd) {
      throw new Error("Chapter not found");
    }

    // Optimistically update UI
    setChapters((prevChapters) =>
      prevChapters.map((ch) =>
        ch.id === chapterId ? { ...ch, isInBasket: true } : ch
      )
    );

    // Add to backend cart
    const result = await ApiService.addToCart(chapterId, token);

    if (result.success) {
      // Update basket with the new chapter, including its currency
      const updatedBasket = [
        ...basket,
        {
          ...chapterToAdd,
          currency: chapterToAdd.currency || "XAF", // Default to XAF if currency is missing
        },
      ];
      setBasket(updatedBasket);

      // Update cart count and total amount
      setCartItemsCount(updatedBasket.length);
      const newTotalAmount = updatedBasket.reduce(
        (sum, chapter) => sum + (chapter.price?.value || chapter.price || 0),
        0
      );
      setTotalAmount(newTotalAmount);

      return true;
    } else {
      // Revert UI changes
      setChapters((prevChapters) =>
        prevChapters.map((ch) =>
          ch.id === chapterId ? { ...ch, isInBasket: false } : ch
        )
      );
      showMessage(t("cart.add_to_basket_error"), "error");
      return false;
    }
  } catch (error) {
    // Revert UI changes
    setChapters((prevChapters) =>
      prevChapters.map((ch) =>
        ch.id === chapterId ? { ...ch, isInBasket: false } : ch
      )
    );
    console.error("Error adding to cart:", error.message);
    showMessage(t("cart.add_to_basket_failed"), "error");
    return false;
  }
};

/**
 * Removes a chapter from the user's cart
 * @param {string} chapterId - The ID of the chapter to remove
 * @param {Array} chapters - Array of all chapters
 * @param {Array} basket - Current basket state
 * @param {Function} setChapters - Function to update chapters state
 * @param {Function} setBasket - Function to update basket state
 * @param {Function} setCartItemsCount - Function to update cart count
 * @param {Function} setTotalAmount - Function to update total amount
 * @param {Function} showMessage - Function to display messages to the user
 * @param {string} t - Translation function
 * @returns {Promise<boolean>} - Success status
 */
export const removeFromBasket = async (
  chapterId,
  chapters,
  basket,
  setChapters,
  setBasket,
  setCartItemsCount,
  setTotalAmount,
  showMessage,
  t
) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) throw new Error("User is not logged in");

    // Remove from backend cart
    const result = await ApiService.clearCartById(chapterId, token);

    // Update the basket state
    const updatedBasket = basket.filter((chapter) => chapter.id !== chapterId);
    setBasket(updatedBasket);
    setCartItemsCount(updatedBasket.length);

    // Recalculate total amount
    const newTotalAmount = updatedBasket.reduce(
      (sum, chapter) => sum + (chapter.price?.value || chapter.price || 0),
      0
    );
    setTotalAmount(newTotalAmount);

    // Update the chapter state to reflect removal
    setChapters((prevChapters) =>
      prevChapters.map((ch) =>
        ch.id === chapterId ? { ...ch, isInBasket: false } : ch
      )
    );

    return true;
  } catch (error) {
    console.error("Error removing from cart:", error.message);
    showMessage(
      t("cart.remove_error", {
        message: error.message || t("cart.remove_default_error"),
      }),
      "error"
    );
    return false;
  }
};

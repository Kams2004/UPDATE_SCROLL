import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import ApiService from "../../Services/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_IMAGES = {
  thumbnail: require("./../../../assets/scrollboxImg/06.png"),
  liked: require("../../../assets/scrollboxImg/like.png"),
  viewed: require("../../../assets/scrollboxImg/view.png"),
  large: require("./../../../assets/scrollboxImg/Img02.png"),
  basket: require("./../../../assets/scrollboxImg/15.png"),
  dropdown: require("./../../../assets/scrollboxImg/08.png"),
  logo: require("./../../../assets/scrollboxImg/14.png"),
  settings: require("./../../../assets/scrollboxImg/09.png"),
  background: require("./../../../assets/scrollboxImg/02.png"),
  comments: require("./../../../assets/scrollboxImg/11.png"),
  likes: require("./../../../assets/scrollboxImg/13.png"),
  views: require("./../../../assets/scrollboxImg/12.png"),
  inCart: require("./../../../assets/scrollboxImg/10.png"),
  purchased: require("./../../../assets/scrollboxImg/15.png"),
};

const FloatingBasketButton = ({
  cartItemsCount,
  setIsPurchaseModalVisible,
  t,
}) => {
  if (cartItemsCount === 0) return null; // Hide if cart is empty

  return (
    <TouchableOpacity
      style={styles.floatingBasketButton}
      onPress={() => {
        setIsPurchaseModalVisible(true);
      }}
    >
      <View style={styles.basketButtonContent}>
        <Text style={styles.basketButtonText}>{t("cart.buy")}</Text>
      </View>
      <View style={styles.basketNumberContainer}>
        <Text style={styles.basketNumber}>{cartItemsCount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const PurchaseModal = ({
  isPurchaseModalVisible,
  setIsPurchaseModalVisible,
  onClose,
  basket,
  setBasket,
  totalAmount,
  setTotalAmount,
  setCartItemsCount,
  showMessage,
  setPaymentLink,
  selectedLanguage,
  visibleCommentForChapter,
}) => {
  const { t } = useTranslation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const cartItemsCount = basket?.length || 0;

  // Ensure the modal updates when it becomes visible
  useEffect(() => {
    console.log("Purchase modal opened. Basket items:", basket);
  }, [basket]);

  // Calculate total amount whenever basket changes
  useEffect(() => {
    const calculateAndUpdateTotal = () => {
      const newTotalAmount = (basket || []).reduce(
        (sum, chapter) => sum + (chapter.price?.value || chapter.price || 0),
        0
      );
      setTotalAmount(newTotalAmount);
      setCartItemsCount((basket || []).length);
    };

    calculateAndUpdateTotal();
  }, [basket]);

  useEffect(() => {
    // Fetch cart items from API when component mounts
    const fetchCartItems = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        const response = await ApiService.getCartItems(token);
        if (response && response.success) {
          setBasket(response.data || []);
          setCartItemsCount(response.data?.length || 0);

          // Calculate total from API response
          const newTotal = (response.data || []).reduce(
            (sum, item) => sum + (item.price?.value || item.price || 0),
            0
          );
          setTotalAmount(newTotal);
        }
      } catch (error) {
        console.error("Error fetching cart items:", error.message);
      }
    };

    fetchCartItems();
  }, []);

  const handleClose = () => {
    if (typeof setIsPurchaseModalVisible === "function") {
      setIsPurchaseModalVisible(false);
    } else if (typeof onClose === "function") {
      onClose();
    }
  };

  const removeFromBasket = async (chapterId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("User is not logged in");

      // Remove from backend cart
      await ApiService.clearCartById(chapterId, token);

      // Update the basket state
      const updatedBasket = basket.filter(
        (chapter) => chapter.id !== chapterId
      );
      setBasket(updatedBasket);
      setCartItemsCount(updatedBasket.length);

      // Recalculate total amount dynamically
      const newTotalAmount = updatedBasket.reduce(
        (sum, chapter) => sum + (chapter.price?.value || chapter.price || 0),
        0
      );
      setTotalAmount(newTotalAmount);
    } catch (error) {
      console.error("Error removing from cart:", error.message);
      showMessage(t("cart.remove_error"), "error");
    }
  };

  const renderBasketItem = ({ item }) => (
    <View style={styles.purchaseModalBasketItem}>
      <Image
        source={item.image || DEFAULT_IMAGES.thumbnail}
        style={styles.purchaseModalItemImage}
      />
      <View style={styles.purchaseModalItemDetails}>
        <Text style={styles.purchaseModalItemTitle} numberOfLines={1}>
          {item.title?.[selectedLanguage] || item.title}
        </Text>
        <View style={styles.purchaseModalPriceContainer}>
          <Text style={styles.purchaseModalItemPrice}>
            {item.price?.value || item.price} {item.currency || "XAF"}
          </Text>
          <TouchableOpacity
            onPress={() => removeFromBasket(item.id)}
            style={styles.purchaseModalRemoveButton}
          >
            <Text style={styles.purchaseModalRemoveButtonText}>
              {t("cart.remove")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Modal
        transparent={true}
        visible={isPurchaseModalVisible}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.purchaseModalOverlay}>
          <TouchableOpacity style={styles.dismissArea} onPress={handleClose} />
          <View style={styles.purchaseModalContainer}>
            <View style={styles.dragIndicator} />
            <Text style={styles.purchaseModalTitle}>{t("cart.your_cart")}</Text>

            {/* Basket items update dynamically */}
            <FlatList
              data={basket}
              renderItem={renderBasketItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.purchaseModalEmptyBasketText}>
                  {t("cart.empty")}
                </Text>
              }
              style={styles.purchaseModalBasketList}
            />

            {/* Payment method selection section */}
            <View style={styles.paymentMethodContainer}>
              <Text style={styles.paymentMethodTitle}>
                {t("cart.payment_method")}
              </Text>

              <View style={styles.paymentMethodImageContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodImageOption,
                    selectedPaymentMethod === "paypal" &&
                      styles.selectedPaymentMethodImageOption,
                  ]}
                  onPress={() => setSelectedPaymentMethod("paypal")}
                >
                  <Image
                    source={require("../../../assets/scrollboxImg/PAYPAL.png")}
                    style={styles.paymentMethodImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodImageOption,
                    selectedPaymentMethod === "mtnmoney" &&
                      styles.selectedPaymentMethodImageOption,
                  ]}
                  onPress={() => setSelectedPaymentMethod("mtnmoney")}
                >
                  <Image
                    source={require("../../../assets/scrollboxImg/MTNMONEY.png")}
                    style={styles.paymentMethodImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodImageOption,
                    selectedPaymentMethod === "orangemoney" &&
                      styles.selectedPaymentMethodImageOption,
                  ]}
                  onPress={() => setSelectedPaymentMethod("orangemoney")}
                >
                  <Image
                    source={require("../../../assets/scrollboxImg/ORANGEMONEY.png")}
                    style={styles.paymentMethodImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.purchaseModalSummaryContainer}>
              <View style={styles.purchaseModalTotalRow}>
                <Text style={styles.purchaseModalTotalText}>
                  {t("cart.total")}
                </Text>
                <Text style={styles.purchaseModalGrandTotalAmount}>
                  {totalAmount}{" "}
                  {basket.length > 0 ? basket[0]?.currency || "XAF" : "XAF"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.purchaseModalBuyButton,
                (!selectedPaymentMethod || isLoading) &&
                  styles.purchaseModalDisabledButton,
              ]}
              onPress={async () => {
                if (!selectedPaymentMethod) {
                  showMessage(t("cart.payment_method_required"), "error");
                  return;
                }
                setIsLoading(true);
                try {
                  const token = await AsyncStorage.getItem("userToken");
                  if (!token) {
                    showMessage(t("cart.login_required_proceed"), "error");
                    setIsLoading(false);
                    return;
                  }
                  const transactionData = {
                    chapterIds: basket.map((item) => item.id),
                    amount: totalAmount,
                    currency: basket[0]?.currency || "XAF",
                    paymentMethod: selectedPaymentMethod,
                  };

                  let apiResponse;
                  if (selectedPaymentMethod === "paypal") {
                    apiResponse = await ApiService.createPayPalTransaction(
                      transactionData,
                      token
                    );
                  } else if (
                    selectedPaymentMethod === "mtnmoney" ||
                    selectedPaymentMethod === "orangemoney"
                  ) {
                    apiResponse = await ApiService.createTransaction(
                      transactionData,
                      token
                    );
                  }

                  if (apiResponse?.success) {
                    const paymentUrl =
                      apiResponse.paymentUrl || apiResponse.link;
                    if (paymentUrl) {
                      setPaymentLink(paymentUrl);
                      handleClose();
                    } else {
                      throw new Error("No payment link received.");
                    }
                  } else {
                    throw new Error(
                      apiResponse?.message || "Transaction failed."
                    );
                  }
                } catch (error) {
                  console.error("Payment Error:", error.message);
                  showMessage(
                    t("cart.payment_error", {
                      message: error.message || t("cart.payment_default_error"),
                    }),
                    "error"
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={!selectedPaymentMethod || isLoading}
            >
              <Text style={styles.purchaseModalBuyButtonText}>
                {isLoading
                  ? t("cart.processing")
                  : t("cart.proceed_to_checkout")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Only show floating basket button when comments are not visible */}
      {!visibleCommentForChapter && (
        <FloatingBasketButton
          cartItemsCount={cartItemsCount}
          setIsPurchaseModalVisible={setIsPurchaseModalVisible}
          t={t}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  purchaseModalOverlay: {
    flex: 1,
    justifyContent: "flex-end", // Position content at the bottom
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dismissArea: {
    flex: 1, // Takes up the top half of the screen as a dismissal area
  },
  purchaseModalContainer: {
    width: "100%",
    height: "60%", // Takes up bottom 60% of screen
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: "relative",
  },
  dragIndicator: {
    width: 60,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  purchaseModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  purchaseModalBasketList: {
    maxHeight: "30%",
  },
  purchaseModalBasketItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  purchaseModalItemImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
  },
  purchaseModalItemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  purchaseModalItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  purchaseModalPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  purchaseModalItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  purchaseModalRemoveButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  purchaseModalRemoveButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  purchaseModalEmptyBasketText: {
    textAlign: "center",
    padding: 20,
    color: "#999",
  },
  paymentMethodContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  paymentMethodImageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 15,
  },
  paymentMethodImageOption: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    width: "30%",
    alignItems: "center",
  },
  selectedPaymentMethodImageOption: {
    borderColor: "#4CAF50",
    borderWidth: 2,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  paymentMethodImage: {
    height: 30,
    width: "100%",
    resizeMode: "contain",
  },
  purchaseModalSummaryContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  purchaseModalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  purchaseModalTotalText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  purchaseModalGrandTotalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  purchaseModalBuyButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: "center",
  },
  purchaseModalBuyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  purchaseModalDisabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  // Floating basket button styles
  floatingBasketButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  basketButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  basketButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginRight: 5,
  },
  basketNumberContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  basketNumber: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 12,
  },
  // Adding optional close button for older UI style
  purchaseModalCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  purchaseModalCloseButtonText: {
    fontSize: 20,
    color: "#333",
    fontWeight: "bold",
  },
});

export default PurchaseModal;

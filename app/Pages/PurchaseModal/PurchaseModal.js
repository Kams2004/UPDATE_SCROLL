import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  TextInput,
  FlatList,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import ApiService from "../../Services/ApiService";
import countries from "./../../../constants/countriesList";

const { height, width } = Dimensions.get("window");

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
  selectedLanguage,
  visibleCommentForChapter,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [userPhone, setUserPhone] = useState({
    number: "",
    prefix: "+237",
    country: { name: "Cameroon", prefix: "+237", flag: "🇨🇲" },
  });
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const cartItemsCount = basket?.length || 0;

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const extractNumericPrice = (price) => {
    if (typeof price === "number") return price;
    if (typeof price === "string") {
      const numericValue = parseFloat(price.replace(/[^\d.]/g, ""));
      return isNaN(numericValue) ? 0 : numericValue;
    }
    if (price && typeof price === "object" && price.value !== undefined) {
      return extractNumericPrice(price.value);
    }
    return 0;
  };

  useEffect(() => {
    const calculateTotal = () => {
      const calculatedTotal = basket.reduce((total, item) => {
        return total + extractNumericPrice(item.price);
      }, 0);
      setTotalAmount(calculatedTotal);
    };
    calculateTotal();
  }, [basket]);

  const removeFromBasket = async (chapterId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("User is not logged in");

      await ApiService.clearCartById(chapterId, token);

      const updatedBasket = basket.filter(
        (chapter) => chapter.id !== chapterId
      );
      setBasket(updatedBasket);
      setCartItemsCount(updatedBasket.length);

      const newTotalAmount = updatedBasket.reduce(
        (sum, chapter) => sum + extractNumericPrice(chapter.price),
        0
      );
      setTotalAmount(newTotalAmount);
    } catch (error) {
      console.error("Error removing from cart:", error.message);
    }
  };

  const handlePayment = async () => {
    if (!userPhone.number) {
      showMessage(t("mobile_money.phone_required"), "error");
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

      const fullPhoneNumber = userPhone.prefix + userPhone.number;
      const transactionData = {
        chapterIds: basket.map((item) => item.id),
        amount: totalAmount,
        currency: basket[0]?.currency || "XAF",
        paymentMethod: "mtnmoney",
        phoneNumber: fullPhoneNumber,
      };

      const apiResponse = await ApiService.createTransaction(
        transactionData,
        token
      );

      if (apiResponse?.success) {
        setIsPurchaseModalVisible(false);
        setBasket([]);
        setCartItemsCount(0);
        setTotalAmount(0);
      } else {
        throw new Error(apiResponse?.message || "Transaction failed.");
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
  };

  const handleClose = () => {
    if (typeof setIsPurchaseModalVisible === "function") {
      setIsPurchaseModalVisible(false);
    } else if (typeof onClose === "function") {
      onClose();
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
            {extractNumericPrice(item.price)} {item.currency || "XAF"}
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
          <View style={styles.purchaseModalContainer}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Image
                source={require("./../../../assets/scrollboxImg/09.png")}
                style={styles.closeIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <Text style={styles.purchaseModalTitle}>{t("cart.your_cart")}</Text>

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

            <View style={styles.phoneNumberSectionContainer}>
              <Text style={styles.phoneNumberSectionTitle}>
                {t("mobile_money.confirm_phone_number")}
              </Text>
              <View style={styles.unifiedInputContainer}>
                <TouchableOpacity
                  style={styles.prefixContainer}
                  onPress={() => setCountryPickerVisible(true)}
                >
                  <Text style={styles.inputText}>
                    {userPhone.country.flag} {userPhone.prefix}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.unifiedPhoneInput}
                  placeholder={t("mobile_money.phone_placeholder")}
                  placeholderTextColor="#444"
                  keyboardType="numeric"
                  value={userPhone.number}
                  onChangeText={(text) =>
                    setUserPhone((prev) => ({ ...prev, number: text }))
                  }
                />
              </View>

              {countryPickerVisible && (
                <View style={styles.countryDropdown}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t("mobile_money.search_country")}
                    placeholderTextColor="#fff"
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                  <ScrollView style={styles.countryList}>
                    {filteredCountries.map((country, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.countryItem}
                        onPress={() => {
                          setUserPhone((prev) => ({
                            ...prev,
                            prefix: country.prefix,
                            country: country,
                          }));
                          setCountryPickerVisible(false);
                          setSearchText("");
                        }}
                      >
                        <Text style={styles.countryText}>
                          {country.flag} {country.name} {country.prefix}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
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
                (userPhone.number === "" || isLoading) &&
                  styles.purchaseModalDisabledButton,
              ]}
              onPress={handlePayment}
              disabled={userPhone.number === "" || isLoading}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  purchaseModalContainer: {
    width: "100%",
    height: height * 0.6,
    backgroundColor: "black",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(43, 20, 9, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
  purchaseModalTitle: {
    color: "#EF7F1A",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    marginTop: 20,
    marginBottom: 15,
  },
  purchaseModalBasketList: {
    maxHeight: "30%",
  },
  purchaseModalBasketItem: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
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
    color: "white",
  },
  purchaseModalPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  purchaseModalItemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#EF7F1A",
  },
  purchaseModalRemoveButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  purchaseModalRemoveButtonText: {
    color: "white",
    fontSize: 12,
  },
  purchaseModalEmptyBasketText: {
    textAlign: "center",
    padding: 20,
    color: "#999",
  },
  phoneNumberSectionContainer: {
    marginTop: 20,
  },
  phoneNumberSectionTitle: {
    color: "#EF7F1A",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 10,
  },
  unifiedInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#222",
    borderWidth: 2,
    borderColor: "#EF7F1A",
    borderRadius: 5,
    overflow: "hidden",
  },
  prefixContainer: {
    width: "25%",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#EF7F1A",
  },
  unifiedPhoneInput: {
    width: "75%",
    paddingVertical: 14,
    paddingHorizontal: 8,
    color: "white",
  },
  inputText: {
    color: "white",
  },
  countryDropdown: {
    width: "90%",
    maxHeight: 180,
    backgroundColor: "black",
    borderWidth: 2,
    borderColor: "#EF7F1A",
    borderRadius: 5,
    marginTop: 5,
    padding: 8,
    alignSelf: "center",
  },
  searchInput: {
    width: "100%",
    backgroundColor: "#222",
    borderRadius: 5,
    padding: 10,
    color: "white",
    marginBottom: 8,
  },
  countryList: {
    width: "100%",
  },
  countryItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  countryText: {
    color: "white",
  },
  purchaseModalSummaryContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  purchaseModalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  purchaseModalTotalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  purchaseModalGrandTotalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#EF7F1A",
  },
  purchaseModalBuyButton: {
    backgroundColor: "#EF7F1A",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
    width: "80%",
  },
  purchaseModalBuyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  purchaseModalDisabledButton: {
    opacity: 0.5,
  },
  floatingBasketButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#EF7F1A",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  basketButtonContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  basketButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  basketNumberContainer: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  basketNumber: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

const DEFAULT_IMAGES = {
  thumbnail: require("./../../../assets/scrollboxImg/06.png"),
};

const FloatingBasketButton = ({
  cartItemsCount,
  setIsPurchaseModalVisible,
  t,
}) => {
  if (cartItemsCount === 0) return null;

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

export default PurchaseModal;

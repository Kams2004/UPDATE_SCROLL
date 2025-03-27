import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MessageModal from "../MessageModal/MessageModal";

const { width, height } = Dimensions.get("window");

// Country Methods and Labels
export const COUNTRY_METHODS = {
  CI: ["OMCIV2", "MOMOCI", "FLOOZ", "WAVECI"],
  BF: ["OMBF"],
  ML: ["OMML"],
  BJ: ["MOMOBJ", "FLOOZBJ"],
  NE: ["AIRTELNG"],
  SN: ["OMSN"],
  GW: ["OMGN"],
  CM: ["OMCM"],
};

export const METHOD_LABELS = {
  OMCIV2: "Orange Money",
  MOMOCI: "MTN",
  FLOOZ: "Moov",
  WAVECI: "Wave",
  OMBF: "Orange Money",
  OMML: "Orange Money",
  MOMOBJ: "MTN",
  FLOOZBJ: "Moov",
  AIRTELNG: "Airtel",
  OMSN: "Orange Money",
  OMGN: "Orange Money",
  OMCM: "Orange Money",
  CARD: "Visa / Mastercard",
  PAYPAL: "PayPal",
};

const PaymentMethodPage = ({
  visible,
  onClose,
  totalPrice,
  currency,
  onPaymentSuccess,
  onPaymentError,
  setIsPurchaseModalVisible,
}) => {
  const [userCountry, setUserCountry] = useState("CM");
  const [mobileMoneyLoading, setMobileMoneyLoading] = useState(null);
  const [buyingPaypal, setBuyingPaypal] = useState(false);
  const [buyingCard, setBuyingCard] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const webViewRef = useRef(null);

  // Message Modal states
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageModalType, setMessageModalType] = useState("error");

  // Verify user country on component mount
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const storedCountryCode = await AsyncStorage.getItem("countryCode");
        if (storedCountryCode) {
          setUserCountry(storedCountryCode.toUpperCase());
          return;
        }

        const userDataString = await AsyncStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          if (userData.countryCode) {
            setUserCountry(userData.countryCode.toUpperCase());
            return;
          }
        }
        console.warn("Could not determine user country, defaulting to CM");
      } catch (error) {
        console.error("Country Verification Error:", error);
      }
    };

    if (visible) {
      fetchUserCountry();
    }
  }, [visible]);

  const handleClose = () => {
    setPaymentUrl(null);
    if (typeof setIsPurchaseModalVisible === "function") {
      setIsPurchaseModalVisible(false);
    } else if (typeof onClose === "function") {
      onClose();
    }
  };

  const showErrorMessage = (message) => {
    setMessageModalMessage(message);
    setMessageModalType("error");
    setIsMessageModalVisible(true);
    onPaymentError?.(message);
  };

  const closeMessageModal = () => {
    setIsMessageModalVisible(false);
  };

  // Handle Mobile Money transactions
  const handleMobileMoneyTransaction = async (method) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showErrorMessage("Authentication required");
        return;
      }

      setMobileMoneyLoading(method);

      const res = await axios.post(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=${method}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
        onPaymentSuccess?.(method);
      } else {
        showErrorMessage("Unable to process transaction");
      }
    } catch (error) {
      console.error(`${method} Transaction Error:`, error);
      showErrorMessage("Mobile Money transaction failed");
    } finally {
      setMobileMoneyLoading(null);
    }
  };

  // Handle PayPal transaction
  const handlePaypalTransaction = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showErrorMessage("Authentication required");
        return;
      }

      setBuyingPaypal(true);

      const res = await axios.post(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=paypal",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
        onPaymentSuccess?.("paypal");
      } else {
        showErrorMessage("Unable to process PayPal transaction");
      }
    } catch (error) {
      console.error("PayPal Transaction Error:", error);
      showErrorMessage("PayPal transaction failed");
    } finally {
      setBuyingPaypal(false);
    }
  };

  // Handle Card transaction
  const handleCardTransaction = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        showErrorMessage("Authentication required");
        return;
      }

      setBuyingCard(true);

      const res = await axios.post(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=card",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
        onPaymentSuccess?.("card");
      } else {
        showErrorMessage("Unable to process card transaction");
      }
    } catch (error) {
      console.error("Card Transaction Error:", error);
      showErrorMessage("Card transaction failed");
    } finally {
      setBuyingCard(false);
    }
  };

  const mobileMoneyMethods = userCountry
    ? COUNTRY_METHODS[userCountry] || ["ORANGE_MONEY"]
    : ["ORANGE_MONEY"];

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
      backgroundColor: "white",
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      padding: 20,
      maxHeight: height * 0.9,
    },
    webViewContainer: {
      flex: 1,
      width: width,
      height: height,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 24,
      color: "#333",
      fontWeight: "bold",
    },
    closeButton: {
      color: "#007bff",
      fontSize: 18,
    },
    amountText: {
      textAlign: "center",
      fontSize: 18,
      marginBottom: 30,
      color: "#666",
    },
    paymentOptions: {
      gap: 15,
    },
    paymentButton: {
      padding: 15,
      backgroundColor: "#007bff",
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    paymentButtonDisabled: {
      backgroundColor: "#cccccc",
    },
    paymentButtonText: {
      color: "white",
      textAlign: "center",
      fontSize: 16,
    },
    loader: {
      alignSelf: "center",
    },
  });

  if (paymentUrl) {
    return (
      <Modal transparent={false} visible={true} animationType="slide">
        <View style={styles.webViewContainer}>
          <TouchableOpacity
            onPress={handleClose}
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              zIndex: 1000,
            }}
          >
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
          <WebView
            ref={webViewRef}
            source={{ uri: paymentUrl }}
            style={styles.webViewContainer}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        transparent={true}
        visible={visible}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Payment Method</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.amountText}>
              Total: {totalPrice} {currency}
            </Text>

            <View style={styles.paymentOptions}>
              {/* Mobile Money Methods */}
              {mobileMoneyMethods.map((methodCode) => {
                const friendlyLabel = METHOD_LABELS[methodCode] || methodCode;
                return (
                  <TouchableOpacity
                    key={methodCode}
                    style={[
                      styles.paymentButton,
                      mobileMoneyLoading === methodCode &&
                        styles.paymentButtonDisabled,
                    ]}
                    onPress={() => handleMobileMoneyTransaction(methodCode)}
                    disabled={mobileMoneyLoading === methodCode}
                  >
                    {mobileMoneyLoading === methodCode ? (
                      <ActivityIndicator color="white" style={styles.loader} />
                    ) : (
                      <Text style={styles.paymentButtonText}>
                        {friendlyLabel}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* PayPal */}
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  buyingPaypal && styles.paymentButtonDisabled,
                ]}
                onPress={handlePaypalTransaction}
                disabled={buyingPaypal}
              >
                {buyingPaypal ? (
                  <ActivityIndicator color="white" style={styles.loader} />
                ) : (
                  <Text style={styles.paymentButtonText}>PayPal</Text>
                )}
              </TouchableOpacity>

              {/* Credit Card */}
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  buyingCard && styles.paymentButtonDisabled,
                ]}
                onPress={handleCardTransaction}
                disabled={buyingCard}
              >
                {buyingCard ? (
                  <ActivityIndicator color="white" style={styles.loader} />
                ) : (
                  <Text style={styles.paymentButtonText}>
                    Visa / Mastercard
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <MessageModal
        visible={isMessageModalVisible}
        message={messageModalMessage}
        type={messageModalType}
        onClose={closeMessageModal}
      />
    </>
  );
};

export default PaymentMethodPage;

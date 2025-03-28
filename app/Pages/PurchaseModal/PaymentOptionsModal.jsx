import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/app/context/AuthContext";
import MessageModal from "../MessageModal/MessageModal";
import WebView from "react-native-webview";

const COUNTRY_METHODS = {
  CI: ["OMCIV2", "MOMOCI", "FLOOZ", "WAVECI"],
  BF: ["OMBF"],
  ML: ["OMML"],
  BJ: ["MOMOBJ", "FLOOZBJ"],
  NE: ["AIRTELNG"],
  SN: ["OMSN"],
  GW: ["OMGN"],
  CM: ["OMCM"],
};

const METHOD_LABELS = {
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
}) => {
  const { user } = useAuth();
  const [mobileMoneyLoading, setMobileMoneyLoading] = useState(null);
  const [buyingPaypal, setBuyingPaypal] = useState(false);
  const [buyingCard, setBuyingCard] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showPawapayPage, setShowPawapayPage] = useState(false);
  const [verifiedCountryCode, setVerifiedCountryCode] = useState(null);

  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageModalType, setMessageModalType] = useState("error");

  useEffect(() => {
    const verifyCountryCode = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userData");
        const parsedData = storedData ? JSON.parse(storedData) : {};
        const storedCountryCode = parsedData.countryCode?.toUpperCase();

        const contextCountryCode = user?.countryCode?.toUpperCase();

        if (storedCountryCode !== contextCountryCode) {
          if (contextCountryCode) {
            const updatedData = {
              ...parsedData,
              countryCode: contextCountryCode,
            };
            await AsyncStorage.setItem("userData", JSON.stringify(updatedData));

            Alert.alert(
              "Country Code Updated",
              `Your country code has been updated to ${contextCountryCode}`
            );
          }
        }

        setVerifiedCountryCode(contextCountryCode || storedCountryCode || "CM");
      } catch (error) {
        console.error("Country Code Verification Error:", error);
        setVerifiedCountryCode("CM");
      }
    };

    if (visible) {
      verifyCountryCode();
    }
  }, [visible, user]);

  const handleClose = () => {
    setPaymentUrl(null);
    onClose?.();
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

  const handleMobileMoneyTransaction = async (methodCode) => {
    try {
      if (!user?.token) {
        showErrorMessage("Authentication required");
        return;
      }

      setMobileMoneyLoading(methodCode);

      const res = await axios.post(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=${methodCode}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
        onPaymentSuccess?.(methodCode);
      } else {
        showErrorMessage("Unable to process transaction");
      }
    } catch (error) {
      console.error(`${methodCode} Transaction Error:`, error);
      showErrorMessage("Mobile Money transaction failed");
    } finally {
      setMobileMoneyLoading(null);
    }
  };

  const handlePawapayMobileMoney = async () => {
    try {
      if (!user?.token) {
        showErrorMessage("Authentication required");
        return;
      }

      setMobileMoneyLoading("PAWAPAY");

      const res = await axios.post(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/pawapay",
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
        onPaymentSuccess?.("PAWAPAY");
      } else {
        showErrorMessage("Unable to process Pawapay transaction");
      }
    } catch (error) {
      console.error("Pawapay Transaction Error:", error);
      showErrorMessage("Pawapay transaction failed");
    } finally {
      setMobileMoneyLoading(null);
    }
  };

  const handlePaypalTransaction = async () => {
    try {
      if (!user?.token) {
        showErrorMessage("Authentication required");
        return;
      }

      setBuyingPaypal(true);

      const res = await axios.post(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=paypal",
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
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

  const handleCardTransaction = async () => {
    try {
      if (!user?.token) {
        showErrorMessage("Authentication required");
        return;
      }

      setBuyingCard(true);

      const res = await axios.post(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=card",
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
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
      maxHeight: "80%",
    },
    webViewContainer: {
      flex: 1,
      width: "100%",
      height: "100%",
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

  const ORIGINAL_PROVIDER_COUNTRIES = ["CI", "ML", "NE", "GW"];

  const isPawapayCountry = Object.keys(COUNTRY_METHODS)
    .filter((key) => !ORIGINAL_PROVIDER_COUNTRIES.includes(key))
    .some(
      (key) =>
        COUNTRY_METHODS[key].includes("PAWAPAY") && key === verifiedCountryCode
    );

  const mobileMoneyMethods = COUNTRY_METHODS[verifiedCountryCode] || [];

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

  if (showPawapayPage) {
    return (
      <MobileMoneyPage
        onClose={() => setShowPawapayPage(false)}
        isPawapay={true}
      />
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

            <ScrollView style={styles.paymentOptions}>
              {ORIGINAL_PROVIDER_COUNTRIES.includes(verifiedCountryCode) &&
                mobileMoneyMethods.map((methodCode) => {
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
                        <ActivityIndicator
                          color="white"
                          style={styles.loader}
                        />
                      ) : (
                        <Text style={styles.paymentButtonText}>
                          {friendlyLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

              {isPawapayCountry && (
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    mobileMoneyLoading === "PAWAPAY" &&
                      styles.paymentButtonDisabled,
                  ]}
                  onPress={handlePawapayMobileMoney}
                  disabled={mobileMoneyLoading === "PAWAPAY"}
                >
                  {mobileMoneyLoading === "PAWAPAY" ? (
                    <ActivityIndicator color="white" style={styles.loader} />
                  ) : (
                    <Text style={styles.paymentButtonText}>Mobile Money</Text>
                  )}
                </TouchableOpacity>
              )}

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
            </ScrollView>
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

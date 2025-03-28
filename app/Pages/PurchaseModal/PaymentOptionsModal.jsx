import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useAuth } from "@/app/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PhoneInput from "react-native-phone-number-input";
import WebView from "react-native-webview";

// Country and method mappings
const COUNTRY_METHODS = {
  CI: ["OMCIV2", "MOMOCI", "FLOOZ", "WAVECI"],
  BF: ["PAWAPAY"],
  ML: ["OMML"],
  NE: ["AIRTELNG"],
  GW: ["OMGN"],
  CM: ["PAWAPAY"],
  BJ: ["PAWAPAY"],
  CD: ["PAWAPAY"],
  GA: ["PAWAPAY"],
  GH: ["PAWAPAY"],
  KE: ["PAWAPAY"],
  MW: ["PAWAPAY"],
  NG: ["PAWAPAY"],
  CG: ["PAWAPAY"],
  RW: ["PAWAPAY"],
  SN: ["PAWAPAY"],
  SL: ["PAWAPAY"],
  TZ: ["PAWAPAY"],
  UG: ["PAWAPAY"],
  ZM: ["PAWAPAY"],
};

const METHOD_LABELS = {
  PAWAPAY: "Mobile Money",
  OMCIV2: "Orange Money",
  MOMOCI: "MTN",
  FLOOZ: "Moov",
  WAVECI: "Wave",
  OMML: "Orange Money",
  AIRTELNG: "Airtel Money",
  OMGN: "Orange Money",
};

const PaymentMethodModal = ({
  visible,
  onClose,
  basket,
  totalAmount,
  currency,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loadingMethod, setLoadingMethod] = useState(null);
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [userCountry, setUserCountry] = useState("CM");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    cca2: "CM",
    callingCode: "237",
  });
  const [paymentUrl, setPaymentUrl] = useState(null);
  const phoneInput = React.useRef(null);

  const ORIGINAL_PROVIDER_COUNTRIES = ["CI", "ML", "NE", "GW"];
  const isPawapayCountry = !ORIGINAL_PROVIDER_COUNTRIES.includes(userCountry);
  const mobileMoneyMethods = userCountry
    ? COUNTRY_METHODS[userCountry] || []
    : [];

  // Load user country and language on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const country = await AsyncStorage.getItem("countryCode");
        const lang = await AsyncStorage.getItem("language");
        if (country) setUserCountry(country.toUpperCase());
        if (lang) setSelectedLanguage(lang);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    loadUserData();
  }, []);

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

  const handleMobileMoneyPayment = async (methodCode) => {
    if (!user?.token) {
      showToast(t("errors.authentication_required"), "error");
      return;
    }

    setLoadingMethod(methodCode);

    try {
      const res = await axios.post(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=${methodCode}&lang=${
          selectedLanguage || "fr"
        }`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error) {
      console.error("Mobile Money Payment Error:", error);
      showToast(
        error.response?.data?.message || t("errors.payment_failed"),
        "error"
      );
    } finally {
      setLoadingMethod(null);
    }
  };

  const handlePawapayPayment = async () => {
    if (!phoneNumber) {
      showToast(t("errors.phone_required"), "error");
      return;
    }

    setLoadingMethod("PAWAPAY");

    try {
      let formattedNumber = phoneNumber.replace(/[^\d+]/g, "");
      formattedNumber = formattedNumber.replace(/^\+/, "");

      if (!formattedNumber.startsWith(selectedCountry.callingCode)) {
        formattedNumber = selectedCountry.callingCode + formattedNumber;
      }

      const res = await axios.post(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/pawapay/?lang=${
          selectedLanguage || "fr"
        }`,
        { number: formattedNumber },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
      } else {
        throw new Error("No redirect URL returned");
      }
    } catch (error) {
      console.error("Pawapay Error:", error);
      showToast(
        error.response?.data?.message || t("errors.payment_failed"),
        "error"
      );
    } finally {
      setLoadingMethod(null);
    }
  };

  const handlePayPalPayment = async () => {
    if (!user?.token) {
      showToast(t("errors.authentication_required"), "error");
      return;
    }

    setLoadingMethod("PAYPAL");

    try {
      const res = await axios.post(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=PAYPAL&lang=${
          selectedLanguage || "fr"
        }`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error) {
      console.error("PayPal Payment Error:", error);
      showToast(
        error.response?.data?.message || t("errors.payment_failed"),
        "error"
      );
    } finally {
      setLoadingMethod(null);
    }
  };

  const handleCardPayment = async () => {
    if (!user?.token) {
      showToast(t("errors.authentication_required"), "error");
      return;
    }

    setLoadingMethod("CARD");

    try {
      const res = await axios.post(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/transaction/create/?method=CARD&lang=${
          selectedLanguage || "fr"
        }`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const { url } = res.data;
      if (url) {
        setPaymentUrl(url);
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error) {
      console.error("Card Payment Error:", error);
      showToast(
        error.response?.data?.message || t("errors.payment_failed"),
        "error"
      );
    } finally {
      setLoadingMethod(null);
    }
  };

  const showToast = (message, type) => {
    console.log(`${type}: ${message}`);
  };

  const handleWebViewNavigation = (navState) => {
    // You can add logic here to handle navigation changes if needed
    console.log("Navigation state changed:", navState);
  };

  const handleWebViewClose = () => {
    setPaymentUrl(null);
    onClose();
  };

  if (paymentUrl) {
    return (
      <Modal
        transparent={false}
        visible={visible}
        animationType="slide"
        onRequestClose={handleWebViewClose}
      >
        <View style={styles.webViewContainer}>
          <TouchableOpacity
            style={styles.webViewCloseButton}
            onPress={handleWebViewClose}
          >
            <Text style={styles.webViewCloseButtonText}>Close</Text>
          </TouchableOpacity>
          <WebView
            source={{ uri: paymentUrl }}
            style={styles.webView}
            onNavigationStateChange={handleWebViewNavigation}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EF7F1A" />
              </View>
            )}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("payment.title")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>{t("general.close")}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.paymentAmount}>
            {t("payment.totalLabel")} {extractNumericPrice(totalAmount)}{" "}
            {currency}
          </Text>

          {showMobileMoneyModal ? (
            <View style={styles.mobileMoneyContainer}>
              <Text style={styles.sectionTitle}>
                {t("payment.mobileMoney")}
              </Text>
              <PhoneInput
                ref={phoneInput}
                defaultValue={phoneNumber}
                defaultCode={selectedCountry.cca2}
                layout="first"
                onChangeText={setPhoneNumber}
                onChangeFormattedText={setFormattedValue}
                containerStyle={styles.phoneInput}
                textContainerStyle={styles.phoneInputText}
                withShadow
                autoFocus
              />
              <Text style={styles.recommendation}>
                {t("payment.momoRecommendation")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.proceedButton,
                  (!phoneNumber || loadingMethod === "PAWAPAY") &&
                    styles.disabledButton,
                ]}
                onPress={handlePawapayPayment}
                disabled={!phoneNumber || loadingMethod === "PAWAPAY"}
              >
                {loadingMethod === "PAWAPAY" ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.proceedButtonText}>
                    {t("payment.make_payment")}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowMobileMoneyModal(false)}
              >
                <Text style={styles.backButtonText}>{t("general.back")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.paymentOptions}>
              {ORIGINAL_PROVIDER_COUNTRIES.includes(userCountry) ? (
                mobileMoneyMethods.map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={styles.paymentButton}
                    onPress={() => handleMobileMoneyPayment(method)}
                    disabled={loadingMethod === method}
                  >
                    {loadingMethod === method ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.paymentButtonText}>
                        {METHOD_LABELS[method] || method}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : isPawapayCountry ? (
                <TouchableOpacity
                  style={styles.paymentButton}
                  onPress={() => setShowMobileMoneyModal(true)}
                >
                  <Text style={styles.paymentButtonText}>
                    {t("payment.mobileMoney")}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.paymentButton}
                onPress={handlePayPalPayment}
                disabled={loadingMethod === "PAYPAL"}
              >
                {loadingMethod === "PAYPAL" ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.paymentButtonText}>
                    {t("payment.paypal")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.paymentButton}
                onPress={handleCardPayment}
                disabled={loadingMethod === "CARD"}
              >
                {loadingMethod === "CARD" ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.paymentButtonText}>
                    {t("payment.creditCard")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "70%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    fontSize: 16,
    color: "#EF7F1A",
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  paymentOptions: {
    gap: 15,
  },
  paymentButton: {
    backgroundColor: "#EF7F1A",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  mobileMoneyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  phoneInput: {
    width: "100%",
    height: 50,
    marginBottom: 15,
  },
  phoneInputText: {
    height: 50,
  },
  recommendation: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  proceedButton: {
    backgroundColor: "#EF7F1A",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  proceedButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  backButton: {
    alignSelf: "center",
    padding: 10,
  },
  backButtonText: {
    color: "#EF7F1A",
    fontWeight: "bold",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  webView: {
    flex: 1,
  },
  webViewCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 10,
  },
  webViewCloseButtonText: {
    color: "#EF7F1A",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PaymentMethodModal;

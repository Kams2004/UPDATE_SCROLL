import React, { useState } from "react";
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
import MobileMoneyModal from "./MobileMoneyModal";

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

const COUNTRY_CODE_MAP = {
  CI: "ci",
  BF: "bf",
  ML: "ml",
  NE: "ne",
  GW: "gw",
  CM: "cm",
  BJ: "bj",
  CD: "cd",
  GA: "ga",
  GH: "gh",
  KE: "ke",
  MW: "mw",
  NG: "ng",
  CG: "cg",
  RW: "rw",
  SN: "sn",
  SL: "sl",
  TZ: "tz",
  UG: "ug",
  ZM: "zm",
};

const PaymentMethodModal = ({
  visible,
  onClose,
  totalPrice,
  currency,
  selectedLanguage = "fr",
  setPaymentLink,
  showMessage,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loadingMethod, setLoadingMethod] = useState(null);
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);

  const ORIGINAL_PROVIDER_COUNTRIES = ["CI", "ML", "NE", "GW"];
  const isPawapayCountry = !ORIGINAL_PROVIDER_COUNTRIES.includes(userCountry);
  const mobileMoneyMethods = userCountry
    ? COUNTRY_METHODS[userCountry] || []
    : [];

  const handleMobileMoneyPayment = async (methodCode) => {
    if (!user?.token) {
      showMessage(t("errors.authentication_required"), "error");
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
        setPaymentLink(url);
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error) {
      console.error("Mobile Money Payment Error:", error);
      showMessage(
        error.response?.data?.message || t("errors.payment_failed"),
        "error"
      );
    } finally {
      setLoadingMethod(null);
    }
  };

  const handlePawapayPayment = () => {
    setShowMobileMoneyModal(true);
  };

  const handlePayPalPayment = async () => {
    if (!user?.token) {
      showMessage(t("errors.authentication_required"), "error");
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
        setPaymentLink(url);
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error) {
      console.error("PayPal Payment Error:", error);
      showMessage(
        error.response?.data?.message || t("errors.payment_failed"),
        "error"
      );
    } finally {
      setLoadingMethod(null);
    }
  };

  const handleCardPayment = async () => {
    if (!user?.token) {
      showMessage(t("errors.authentication_required"), "error");
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
        setPaymentLink(url);
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error) {
      console.error("Card Payment Error:", error);
      showMessage(
        error.response?.data?.message || t("errors.payment_failed"),
        "error"
      );
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <>
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
              {t("payment.totalLabel")} {extractNumericPrice(totalPrice)}{" "}
              {currency}
            </Text>

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
                  onPress={handlePawapayPayment}
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
          </View>
        </View>
      </Modal>

      <MobileMoneyModal
        visible={showMobileMoneyModal}
        onClose={() => setShowMobileMoneyModal(false)}
        isPawapay={isPawapayCountry}
        totalPrice={totalPrice}
        currency={currency}
        selectedLanguage={selectedLanguage}
        setPaymentLink={setPaymentLink}
        showMessage={showMessage}
      />
    </>
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
});

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

export default PaymentMethodModal;

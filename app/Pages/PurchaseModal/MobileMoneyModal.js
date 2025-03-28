import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import PhoneInput from "react-native-phone-number-input";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { useAuth } from "@/app/context/AuthContext";
import Toast from "react-native-toast-message";

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

const MobileMoneyModal = ({
  visible,
  onClose,
  isPawapay,
  totalPrice,
  currency,
  selectedLanguage,
  setPaymentLink,
  showMessage,
}) => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    cca2: "CM",
    callingCode: "237",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const phoneInput = React.useRef(null);

  useEffect(() => {
    if (user?.countryCode) {
      const countryCode =
        COUNTRY_CODE_MAP[user.countryCode.toUpperCase()] || "cm";
      setSelectedCountry({
        cca2: countryCode.toUpperCase(),
        callingCode: getCallingCode(user.countryCode.toUpperCase()),
      });
    }
  }, [user]);

  const getCallingCode = (countryCode) => {
    const callingCodes = {
      CM: "237",
      CI: "225",
      ML: "223",
      NE: "227",
      BF: "226",
      BJ: "229",
      DEFAULT: "237",
    };
    return callingCodes[countryCode] || callingCodes["DEFAULT"];
  };

  const handlePayment = async () => {
    if (!phoneNumber) {
      showMessage(t("errors.phone_required"), "error");
      return;
    }

    setIsLoading(true);

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
        setPaymentLink(url);
        onClose();
      } else {
        throw new Error("No redirect URL returned");
      }
    } catch (error) {
      console.error("Mobile Money Error:", error);
      showMessage(
        error.response?.data?.message || t("errors.payment_failed"),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text style={styles.modalTitle}>
              {isPawapay
                ? t("payment.pawapayMobileMoneyTitle")
                : t("payment.MobileMoneyPagetitle")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>{t("general.close")}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.paymentAmount}>
            {t("payment.totalLabel")} {extractNumericPrice(totalPrice)}{" "}
            {currency}
          </Text>

          <View style={styles.phoneInputContainer}>
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
          </View>

          <Text style={styles.recommendation}>
            {t("payment.momoRecommendation")}
          </Text>

          <TouchableOpacity
            style={[
              styles.proceedButton,
              (!phoneNumber || isLoading) && styles.disabledButton,
            ]}
            onPress={handlePayment}
            disabled={!phoneNumber || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.proceedButtonText}>
                {t("payment.make_payment")}
              </Text>
            )}
          </TouchableOpacity>
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
  phoneInputContainer: {
    marginBottom: 20,
  },
  phoneInput: {
    width: "100%",
    height: 50,
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
  },
  proceedButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
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

export default MobileMoneyModal;

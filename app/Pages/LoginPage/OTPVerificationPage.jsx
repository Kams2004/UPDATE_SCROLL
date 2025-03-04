import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  BackHandler,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import axios from "axios";
import MessageModal from "../MessageModal/MessageModal";

const { width } = Dimensions.get("window");
const API_BASE_URL =
  "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api";

export default function OTPVerificationPage() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef(Array(6).fill(null));
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState("error");
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // Track app state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === "background") {
        await AsyncStorage.setItem("otpState", JSON.stringify({ otp, email }));
      } else if (nextAppState === "active") {
        const savedState = await AsyncStorage.getItem("otpState");
        if (savedState) {
          const { otp: savedOtp, email: savedEmail } = JSON.parse(savedState);
          setOtp(savedOtp);
          setEmail(savedEmail);
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      subscription.remove();
    };
  }, [otp, email]);

  // Prevent back button navigation
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!isVerified) {
          navigation.navigate("Home");
          return true;
        }
        return false;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [isVerified])
  );

  useEffect(() => {
    const retrieveEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("userEmail");
        if (storedEmail) {
          setEmail(storedEmail);
        }
      } catch (error) {
        console.error("Error retrieving email:", error);
      }
    };

    retrieveEmail();
  }, []);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOTPChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
    Keyboard.dismiss();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setErrorMessage(t("otp.error_incomplete"));
      setModalType("error");
      setIsModalVisible(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/verify-otp`,
        { email, otp: otpCode },
        { headers: { "Content-Type": "application/json" } }
      );

      await AsyncStorage.removeItem("userEmail");

      setSuccessMessage(t("otp.verification_success"));
      setModalType("success");
      setIsModalVisible(true);
      setIsVerified(true);
    } catch (error) {
      let errorMsg = t("otp.verification_error");

      if (error.response) {
        errorMsg =
          error.response.data.message || error.response.data.error || errorMsg;
      } else if (error.request) {
        errorMsg = t("otp.network_error");
      } else {
        errorMsg = t("otp.request_error");
      }

      setErrorMessage(errorMsg);
      setModalType("error");
      setIsModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/user/resend-otp`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );

      setResendCooldown(60);
      setSuccessMessage(t("otp.resend_success"));
      setModalType("success");
      setIsModalVisible(true);
    } catch (error) {
      let errorMsg = t("otp.resend_error");

      if (error.response) {
        errorMsg =
          error.response.data.message || error.response.data.error || errorMsg;
      } else if (error.request) {
        errorMsg = t("otp.network_error");
      } else {
        errorMsg = t("otp.request_error");
      }

      setErrorMessage(errorMsg);
      setModalType("error");
      setIsModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    if (modalType === "success" && isVerified) {
      navigation.navigate("LoginPage");
    }
  };

  const handleCloseModal = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={true}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                >
                  <Image
                    source={require("./../../../assets/scrollboxImg/09.png")}
                    style={styles.closeIcon}
                  />
                </TouchableOpacity>

                <View style={styles.userInfoContainer}>
                  <Text
                    style={styles.userName}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {t("otp.title")}
                  </Text>
                  <Text
                    style={styles.subtitleText}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                  >
                    {email ? t("otp.subtitle", { email }) : t("otp.no_email")}
                  </Text>
                </View>

                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={styles.otpInput}
                      keyboardType="numeric"
                      maxLength={1}
                      value={digit}
                      onChangeText={(value) => handleOTPChange(index, value)}
                      onKeyPress={({ nativeEvent }) => {
                        if (
                          nativeEvent.key === "Backspace" &&
                          !digit &&
                          index > 0
                        ) {
                          inputRefs.current[index - 1].focus();
                        }
                      }}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                >
                  <Text style={styles.actionButtonText} numberOfLines={1}>
                    {isLoading
                      ? t("otp.verify_button") + "..."
                      : t("otp.verify_button")}
                  </Text>
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText} numberOfLines={1}>
                    {t("otp.resend_prompt")}
                  </Text>
                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={resendCooldown > 0 || isLoading}
                  >
                    <Text
                      style={[
                        styles.resendLink,
                        (resendCooldown > 0 || isLoading) &&
                          styles.resendLinkDisabled,
                      ]}
                      numberOfLines={1}
                    >
                      {resendCooldown > 0
                        ? `${t("otp.resend_timer")} (${resendCooldown}s)`
                        : t("otp.resend_button")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <MessageModal
          visible={isModalVisible}
          message={successMessage || errorMessage}
          type={modalType}
          onClose={handleModalClose}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  keyboardAvoidingView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
  },
  closeIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  userInfoContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  userName: {
    fontSize: 22,
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitleText: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  otpInput: {
    width: 35,
    height: 55,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 8,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 18,
    marginHorizontal: 4,
  },
  actionButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 20,
  },
  actionButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resendText: {
    color: "#999",
    marginRight: 5,
    fontSize: 12,
  },
  resendLink: {
    color: "#FFA500",
    fontSize: 12,
  },
  resendLinkDisabled: {
    color: "#666",
  },
});

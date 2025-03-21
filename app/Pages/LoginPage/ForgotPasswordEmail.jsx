import React, { useState, useCallback, useEffect } from "react";
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
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import ApiService from "../../Services/ApiService";
import MessageModal from "../MessageModal/MessageModal";

const { width } = Dimensions.get("window");

export default function ForgotPasswordEmail() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [hasBlurred, setHasBlurred] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === "background") {
        // Save state when app goes to background
        await AsyncStorage.setItem(
          "forgotPasswordState",
          JSON.stringify({
            email,
            hasBlurred,
            hasSubmitted,
          })
        );
      } else if (nextAppState === "active") {
        // Restore state when app becomes active
        const savedState = await AsyncStorage.getItem("forgotPasswordState");
        if (savedState) {
          const {
            email: savedEmail,
            hasBlurred: savedHasBlurred,
            hasSubmitted: savedHasSubmitted,
          } = JSON.parse(savedState);

          setEmail(savedEmail);
          setHasBlurred(savedHasBlurred);
          setHasSubmitted(savedHasSubmitted);

          // Validate email if there was previous interaction
          if (savedHasBlurred || savedHasSubmitted) {
            validateEmailInput(savedEmail);
          }
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
  }, [email, hasBlurred, hasSubmitted]);
  useEffect(() => {
    return () => {
      // Cleanup function to reset state
      setEmail("");
      setEmailError("");
      setHasBlurred(false);
      setHasSubmitted(false);
      setIsSuccessModalVisible(false);
    };
  }, []);

  const handleCloseModal = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const handleEmailChange = useCallback(
    (text) => {
      setEmail(text.trim().toLowerCase());
      if (hasBlurred || hasSubmitted) {
        validateEmailInput(text.trim().toLowerCase());
      }
    },
    [hasBlurred, hasSubmitted]
  );

  const validateEmail = (email) => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  };

  const validateEmailInput = (emailValue) => {
    if (!emailValue) {
      setEmailError(t("forgot_password.email_required"));
      return false;
    }
    if (!validateEmail(emailValue)) {
      setEmailError(t("forgot_password.invalid_email"));
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    setHasSubmitted(true);
    const trimmedEmail = email.trim();

    if (!validateEmailInput(trimmedEmail)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await ApiService.forgotPassword(trimmedEmail);

      if (response && response.message) {
        setSuccessMessage(response.message);
        setIsSuccessModalVisible(true);
      }

      setEmail("");
      setHasSubmitted(false);
      setHasBlurred(false);
    } catch (error) {
      console.error("Forgot Password Error:", error);
      setEmailError(error.message || t("forgot_password.error_message"));
    } finally {
      setIsLoading(false);
    }
  }, [email, navigation, t]);

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    navigation.navigate("LoginPage");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <>
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
              <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
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
                    <Image
                      source={require("../../../assets/scrollboxImg/05.png")}
                      style={styles.userIcon}
                    />
                    <Text style={styles.userName}>
                      {t("forgot_password.title")}
                    </Text>
                    <Text style={styles.subtitle}>
                      {t("forgot_password.subtitle")}
                    </Text>
                  </View>

                  <View style={styles.inputWrapper}>
                    <View
                      style={[
                        styles.inputContainer,
                        (hasBlurred || hasSubmitted) &&
                          !email &&
                          styles.errorBorder,
                      ]}
                    >
                      <TextInput
                        style={styles.input}
                        placeholder={t("forgot_password.email_placeholder")}
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={handleEmailChange}
                        onBlur={() => {
                          setHasBlurred(true);
                          validateEmailInput(email);
                        }}
                        returnKeyType="done"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        maxLength={50}
                        onSubmitEditing={handleSubmit}
                      />
                    </View>
                    {emailError && (hasBlurred || hasSubmitted) && (
                      <Text style={styles.errorText}>{emailError}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <Text style={styles.actionButtonText}>
                      {isLoading
                        ? t("forgot_password.sending")
                        : t("forgot_password.submit")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        <MessageModal
          visible={isSuccessModalVisible}
          message={successMessage}
          type="success"
          onClose={handleSuccessModalClose}
        />
      </>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
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
  keyboardAvoidingView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  userInfoContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  userIcon: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#FFFFFF",
    padding: 10,
    fontSize: 16,
  },
  errorBorder: {
    borderColor: "#FF0000",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    alignSelf: "flex-end",
    marginTop: 4,
    marginRight: 4,
  },
  actionButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 50,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#121212",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

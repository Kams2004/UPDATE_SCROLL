import React, { useState, useCallback, useRef } from "react";
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
  Linking,
  ImageBackground, // Import ImageBackground
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import ApiService from "../../Services/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MessageModal from "../MessageModal/MessageModal";

const { width, height } = Dimensions.get("window");

export default function SignUpPage() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  // Refs for input fields
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // State for Sign Up
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Error and loading states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Success Modal
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleCloseModal = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateName = useCallback(
    (nameValue) => {
      if (!nameValue) {
        setNameError(t("signup.error_name_required"));
        return false;
      }
      setNameError("");
      return true;
    },
    [t]
  );

  const validateEmailInput = useCallback(
    (emailValue) => {
      if (!emailValue) {
        setEmailError(t("signup.error_email_required"));
        return false;
      }
      if (!validateEmail(emailValue)) {
        setEmailError(t("signup.error_email_invalid"));
        return false;
      }
      setEmailError("");
      return true;
    },
    [t]
  );

  const validatePassword = useCallback(
    (passwordValue) => {
      if (!passwordValue) {
        setPasswordError(t("signup.error_password_required"));
        return false;
      }
      if (passwordValue.length <= 7) {
        setPasswordError(t("signup.error_password_length"));
        return false;
      }
      setPasswordError("");
      return true;
    },
    [t]
  );

  const handleSignUp = useCallback(async () => {
    Keyboard.dismiss();
    setHasSubmitted(true);

    const isNameValid = validateName(name);
    const isEmailValid = validateEmailInput(email);
    const isPasswordValid = validatePassword(password);

    if (!isTermsAccepted) {
      setNameError(t("signup.error_terms"));
      return;
    }

    if (!(isNameValid && isEmailValid && isPasswordValid)) {
      return;
    }

    setIsLoading(true);

    try {
      // Save email to local storage before API call
      await AsyncStorage.setItem("userEmail", email);

      const user = { name, email, password };
      const response = await ApiService.createUser(user);

      // Handle successful signup with various possible response formats
      if (
        response?.status === 201 ||
        response?.message?.includes("User created successfully") ||
        response?.message?.includes("OTP")
      ) {
        // Navigate to OTP Verification Page
        navigation.replace("OTPVerificationPage");
        return;
      }

      // If response doesn't match success conditions
      throw new Error(response?.message || t("signup.signup_error"));
    } catch (error) {
      console.error("Sign-up error:", error);
      setSuccessMessage(error.message || t("signup.signup_error"));
      setIsSuccessModalVisible(true);

      // Remove email from storage if signup fails
      await AsyncStorage.removeItem("userEmail");
    } finally {
      setIsLoading(false);
    }
  }, [name, email, password, isTermsAccepted, navigation, t]);

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    navigation.navigate("OTPVerificationPage");
  };

  const navigateToLogin = () => {
    navigation.replace("LoginPage");
  };

  const handleTermsLinkPress = () => {
    Linking.openURL("https://scrolbox.com/privacy-policy/");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require("../../../assets/scrollboxImg/02.png")} // Replace with your image path
        style={styles.backgroundImage}
        resizeMode="cover" // Ensure the image covers the entire screen
      >
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
                        source={require("../../../assets/scrollboxImg/07.png")}
                        style={styles.userIcon}
                      />
                      <Text style={styles.userName}>{t("signup.title")}</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                      <View
                        style={[
                          styles.inputContainer,
                          (hasBlurred || hasSubmitted) &&
                            nameError &&
                            styles.errorBorder,
                        ]}
                      >
                        <TextInput
                          ref={nameInputRef}
                          style={styles.input}
                          placeholder={t("signup.name_placeholder")}
                          placeholderTextColor="#666"
                          value={name}
                          onChangeText={(text) => {
                            setName(text);
                            if (hasBlurred || hasSubmitted) {
                              validateName(text);
                            }
                          }}
                          onBlur={() => {
                            setHasBlurred(true);
                            validateName(name);
                          }}
                          returnKeyType="next"
                          onSubmitEditing={() => emailInputRef.current.focus()}
                        />
                      </View>
                      {nameError && (hasBlurred || hasSubmitted) && (
                        <Text style={styles.errorText}>{nameError}</Text>
                      )}
                    </View>

                    <View style={styles.inputWrapper}>
                      <View
                        style={[
                          styles.inputContainer,
                          (hasBlurred || hasSubmitted) &&
                            emailError &&
                            styles.errorBorder,
                        ]}
                      >
                        <TextInput
                          ref={emailInputRef}
                          style={styles.input}
                          placeholder={t("signup.email_placeholder")}
                          placeholderTextColor="#666"
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text.trim().toLowerCase());
                            if (hasBlurred || hasSubmitted) {
                              validateEmailInput(text.trim().toLowerCase());
                            }
                          }}
                          onBlur={() => {
                            setHasBlurred(true);
                            validateEmailInput(email);
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="next"
                          onSubmitEditing={() => passwordInputRef.current.focus()}
                        />
                      </View>
                      {emailError && (hasBlurred || hasSubmitted) && (
                        <Text style={styles.errorText}>{emailError}</Text>
                      )}
                    </View>

                    <View style={styles.inputWrapper}>
                      <View
                        style={[
                          styles.inputContainer,
                          (hasBlurred || hasSubmitted) &&
                            passwordError &&
                            styles.errorBorder,
                        ]}
                      >
                        <TextInput
                          ref={passwordInputRef}
                          style={styles.input}
                          placeholder={t("signup.password_placeholder")}
                          placeholderTextColor="#666"
                          secureTextEntry={!passwordVisible}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            if (hasBlurred || hasSubmitted) {
                              validatePassword(text);
                            }
                          }}
                          onBlur={() => {
                            setHasBlurred(true);
                            validatePassword(password);
                          }}
                          returnKeyType="done"
                          onSubmitEditing={handleSignUp}
                        />
                        <TouchableOpacity
                          style={styles.passwordVisibilityToggle}
                          onPress={() => setPasswordVisible(!passwordVisible)}
                        >
                          <Text style={styles.passwordVisibilityText}>
                            {passwordVisible ? "Hide" : "Show"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {passwordError && (hasBlurred || hasSubmitted) && (
                        <Text style={styles.errorText}>{passwordError}</Text>
                      )}
                    </View>

                    <View style={styles.termsContainer}>
                      <TouchableOpacity
                        onPress={() => setIsTermsAccepted(!isTermsAccepted)}
                        style={styles.checkbox}
                      >
                        {isTermsAccepted && (
                          <AntDesign name="check" size={16} color="#FFA500" />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.termsText}>
                        {t("signup.texts")}
                        <Text
                          style={styles.termsLink}
                          onPress={handleTermsLinkPress}
                        >
                          {t("signup.terms")}
                        </Text>
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        isLoading && styles.disabledButton,
                      ]}
                      onPress={handleSignUp}
                      disabled={isLoading}
                    >
                      <Text style={styles.actionButtonText}>
                        {isLoading
                          ? t("signup.signup_button") + "..."
                          : t("signup.signup_button")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={navigateToLogin}>
                      <Text style={styles.toggleViewText}>
                        {t("signup.texts_login")}
                        <Text
                          style={styles.loginLink}
                          onPress={navigateToLogin}
                        >
                          {t("signup.login_link")}
                        </Text>
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
        </View>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  userIcon: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  inputWrapper: {
    width: "100%",
    marginBottom: 15,
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
  passwordVisibilityToggle: {
    position: "absolute",
    right: 10,
  },
  passwordVisibilityText: {
    color: "#FFA500",
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  termsText: {
    color: "#999",
    fontSize: 12,
    flex: 1,
  },
  termsLink: {
    color: "#FFA500",
    textDecorationLine: "underline",
  },
  actionButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 50,
    marginBottom: 20,
  },
  actionButtonText: {
    color: "#121212",
    fontSize: 18,
    fontWeight: "bold",
  },
  toggleViewText: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10,
  },
  loginLink: {
    color: "#FFA500",
    textDecorationLine: "underline",
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
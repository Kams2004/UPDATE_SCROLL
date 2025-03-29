import React, { useState, useRef, useCallback } from "react";
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
  ImageBackground, // Import ImageBackground
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../../Services/ApiService";
import GoogleSignUpModal from "./GoogleSignUpModal";
import axios from "axios";
import { useAuth } from "@/app/context/AuthContext";
const { width, height } = Dimensions.get("window");

export default function LoginPage() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  // State Management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [hasBlurredEmail, setHasBlurredEmail] = useState(false);
  const [hasBlurredPassword, setHasBlurredPassword] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const { login } = useAuth();

  // Refs
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Validation Functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const validateEmailInput = (emailValue) => {
    if (!emailValue) {
      setEmailError(t("login.email_required"));
      return false;
    }
    if (!validateEmail(emailValue)) {
      setEmailError(t("login.invalid_email"));
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePasswordInput = (passwordValue) => {
    if (!passwordValue) {
      setPasswordError(t("login.password_required"));
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Event Handlers
  const handleEmailChange = useCallback(
    (text) => {
      const formattedText = text.replace(/\s+/g, " ").trimStart();
      setEmail(formattedText);
      if (hasBlurredEmail || hasSubmitted) {
        validateEmailInput(formattedText);
      }
    },
    [hasBlurredEmail, hasSubmitted]
  );

  const handlePasswordChange = useCallback(
    (text) => {
      const formattedText = text.trimStart();
      setPassword(formattedText);
      if (hasBlurredPassword || hasSubmitted) {
        validatePasswordInput(formattedText);
      }
    },
    [hasBlurredPassword, hasSubmitted]
  );
  const logStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const email = await AsyncStorage.getItem("email");
      const userName = await AsyncStorage.getItem("userName");
      const userID = await AsyncStorage.getItem("userID");
      const countryCode = await AsyncStorage.getItem("countryCode");
      const loginTime = await AsyncStorage.getItem("loginTime");

      console.log("==== Stored Login Data ====");
      console.log("Token:", token ? "✓ Token Exists" : "✗ No Token");
      console.log("Email:", email || "No email stored");
      console.log("User Name:", userName || "No username stored");
      console.log("User ID:", userID || "No user ID stored");
      console.log("Country Code:", countryCode || "No country code stored");
      console.log(
        "Login Time:",
        loginTime
          ? new Date(parseInt(loginTime)).toLocaleString()
          : "No login time stored"
      );
      console.log("==== End of Stored Data ====");
    } catch (error) {
      console.error("Error logging stored data:", error);
    }
  };
  const handleLogin = useCallback(async () => {
    Keyboard.dismiss();
    setHasSubmitted(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    const isEmailValid = validateEmailInput(trimmedEmail);
    const isPasswordValid = validatePasswordInput(trimmedPassword);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await ApiService.userLogin({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      const { token } = response;

      if (token) {
        const userResponse = await axios.get(
          "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userData = userResponse.data.user;

        // Use the auth context login function instead of direct AsyncStorage
        await login({
          token,
          email: userData.email,
          name: userData.name,
          id: userData._id,
          countryCode: userData.countryCode || "CM",
          role: userData.role,
        });

        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        setPasswordError(t("login.login_error"));
      }
    } catch (error) {
      console.error("Login Error:", error);

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      setPasswordError(
        error.response?.data?.message ||
          error.message ||
          t("login.credentials_error")
      );
    } finally {
      setIsLoading(false);
    }
  }, [email, password, navigation, t, login]);

  const handleCloseModal = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const navigateToSignUp = () => {
    navigation.replace("SignUpPage");
  };

  const navigateToForgotPassword = () => {
    navigation.replace("ForgotPasswordEmail");
  };

  const handleGoogleSignIn = () => {
    Keyboard.dismiss();
    setShowGoogleAuth(true);
  };

  const handleGoogleAuthSuccess = () => {
    setShowGoogleAuth(false);
    navigation.navigate("Home");
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
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
                      <Text style={styles.userName}>{t("login.titles")}</Text>
                    </View>

                    <View style={styles.inputWrapper}>
                      <View
                        style={[
                          styles.inputContainer,
                          (hasBlurredEmail || hasSubmitted) &&
                            emailError &&
                            styles.errorBorder,
                        ]}
                      >
                        <TextInput
                          ref={emailInputRef}
                          style={styles.input}
                          placeholder={t("login.email_placeholder")}
                          placeholderTextColor="#666"
                          value={email}
                          onChangeText={handleEmailChange}
                          onBlur={() => {
                            setHasBlurredEmail(true);
                            validateEmailInput(email);
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="next"
                          blurOnSubmit={false}
                          onSubmitEditing={() =>
                            passwordInputRef.current?.focus()
                          }
                          autoCorrect={false}
                          spellCheck={false}
                          maxLength={100}
                        />
                      </View>
                      {emailError && (hasBlurredEmail || hasSubmitted) && (
                        <Text style={styles.errorText}>{emailError}</Text>
                      )}
                    </View>

                    <View style={styles.inputWrapper}>
                      <View
                        style={[
                          styles.inputContainer,
                          (hasBlurredPassword || hasSubmitted) &&
                            passwordError &&
                            styles.errorBorder,
                        ]}
                      >
                        <TextInput
                          ref={passwordInputRef}
                          style={styles.input}
                          placeholder={t("login.password_placeholder")}
                          placeholderTextColor="#666"
                          secureTextEntry={!passwordVisible}
                          value={password}
                          onChangeText={handlePasswordChange}
                          onBlur={() => {
                            setHasBlurredPassword(true);
                            validatePasswordInput(password);
                          }}
                          returnKeyType="done"
                          blurOnSubmit={true}
                          onSubmitEditing={handleLogin}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          maxLength={50}
                        />
                        <TouchableOpacity
                          style={styles.passwordVisibilityToggle}
                          onPress={togglePasswordVisibility}
                        >
                          <Text style={styles.passwordVisibilityText}>
                            {passwordVisible
                              ? t("login.password_hide")
                              : t("login.password_show")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {passwordError &&
                        (hasBlurredPassword || hasSubmitted) && (
                          <Text style={styles.errorText}>{passwordError}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                      style={styles.forgotPasswordButton}
                      onPress={navigateToForgotPassword}
                    >
                      <Text style={styles.forgotPasswordText}>
                        {t("login.forgot_password")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        isLoading && styles.disabledButton,
                      ]}
                      onPress={handleLogin}
                      disabled={isLoading}
                    >
                      <Text style={styles.actionButtonText}>
                        {isLoading
                          ? t("login.logging_in")
                          : t("login.login_button")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={navigateToSignUp}>
                      <Text style={styles.toggleViewText}>
                        {t("login.sign_up")}
                        <Text style={styles.signUpLink}>
                          {t("login.sign_up_link")}
                        </Text>
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.socialButtonsContainer}>
                      <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading}
                      >
                        <Image
                          source={require("../../../assets/scrollboxImg/google-removebg.png")}
                          style={styles.googleLogo}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </Modal>

          <GoogleSignUpModal
            visible={showGoogleAuth}
            onClose={() => setShowGoogleAuth(false)}
            onSuccess={handleGoogleAuthSuccess}
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
  googleLogo: {
    width: 50,
    height: 50,
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
    borderWidth: 1,
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
    marginBottom: 10,
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
    padding: 10,
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#FFA500",
    fontSize: 14,
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
  disabledButton: {
    opacity: 0.7,
  },
  toggleViewText: {
    color: "#999",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 15,
  },
  signUpLink: {
    color: "#FFA500",
    paddingBottom: 5,
  },
  socialButtonsContainer: {
    width: "100%",
    alignItems: "center",
  },
  googleButton: {
    backgroundColor: "transparent",
    padding: 10,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#DB4437",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

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
  ImageBackground,
  FlatList,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import ApiService from "../../Services/ApiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MessageModal from "../MessageModal/MessageModal";
import { GoogleSignUpModal } from "./GoogleAuthWebView";
import countries from "../../../constants/countriesList";

const { width, height } = Dimensions.get("window");

function SignUpPage() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const phoneNumberInputRef = useRef(null);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [nameError, setNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [modalActionType, setModalActionType] = useState("");

  const [isGoogleSignUpModalVisible, setIsGoogleSignUpModalVisible] =
    useState(false);

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);

  const handleCloseModal = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const validateEmail = (emailValue) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailValue);
  };

  const validateName = useCallback(
    (nameValue) => {
      if (!nameValue) {
        setNameError(t("signup.error_name_required"));
        return false;
      }
      if (nameValue.length < 2) {
        setNameError("Name must be at least 2 characters long");
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
      if (passwordValue.length < 8) {
        setPasswordError(t("signup.error_password_length"));
        return false;
      }
      setPasswordError("");
      return true;
    },
    [t]
  );

  const validatePhoneNumber = useCallback((phoneVal) => {
    if (!phoneVal) {
      setPhoneNumberError("Please enter a phone number");
      return false;
    }
    if (phoneVal.length < 9 || phoneVal.length > 12) {
      setPhoneNumberError("Invalid phone number");
      return false;
    }
    setPhoneNumberError("");
    return true;
  }, []);

  const handleSignUp = useCallback(async () => {
    Keyboard.dismiss();
    setHasSubmitted(true);

    const isNameValid = validateName(name);
    const isEmailValid = validateEmailInput(email);
    const isPasswordValid = validatePassword(password);
    const isPhoneValid = validatePhoneNumber(phoneNumber);

    if (!isTermsAccepted) {
      setNameError(t("signup.error_terms"));
      return;
    }

    if (!(isNameValid && isEmailValid && isPasswordValid && isPhoneValid)) {
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhoneNumber = phoneNumber.replace(/\D/g, "");

      const user = {
        name,
        email,
        password,
        phoneNumber: formattedPhoneNumber,
        phonePrefix: selectedCountry.prefix,
      };

      const response = await ApiService.createUser(user);

      if (response.status === "email_exists") {
        setSuccessMessage(
          "User already exists. Please log in or use a different email."
        );
        setModalActionType("email_exists");
        setIsSuccessModalVisible(true);
        return;
      }

      if (
        response?.status === 201 ||
        response?.message?.includes("User created successfully") ||
        response?.message?.includes("OTP")
      ) {
        await AsyncStorage.setItem("userEmail", email);
        await AsyncStorage.setItem("userCountryCode", selectedCountry.code);
        await AsyncStorage.setItem("userPhoneNumber", formattedPhoneNumber);

        navigation.replace("OTPVerificationPage");
        return;
      }

      throw new Error(response?.message || t("signup.signup_error"));
    } catch (error) {
      console.error("Sign-up error:", error);
      setSuccessMessage(error.message || t("signup.signup_error"));
      setModalActionType("error");
      setIsSuccessModalVisible(true);

      await AsyncStorage.removeItem("userEmail");
      await AsyncStorage.removeItem("userCountryCode");
      await AsyncStorage.removeItem("userPhoneNumber");
    } finally {
      setIsLoading(false);
    }
  }, [
    name,
    email,
    password,
    phoneNumber,
    isTermsAccepted,
    selectedCountry,
    navigation,
    t,
    validateName,
    validateEmailInput,
    validatePassword,
    validatePhoneNumber,
  ]);

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);

    if (modalActionType === "email_exists") {
      navigation.navigate("LoginPage");
    } else {
      navigation.navigate("Home");
    }
  };

  const navigateToLogin = () => {
    navigation.replace("LoginPage");
  };

  const handleTermsLinkPress = () => {
    Linking.openURL("https://scrolbox.com/privacy-policy/");
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setIsCountryModalVisible(false);
      }}
    >
      <Text style={styles.countryText}>
        {item.flag} {item.name} ({item.prefix})
      </Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require("../../../assets/scrollboxImg/02.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
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
                        source={require("../../../assets/scrollboxImg/09.png")}
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
                          onSubmitEditing={() =>
                            phoneNumberInputRef.current.focus()
                          }
                        />
                      </View>
                      {nameError && (hasBlurred || hasSubmitted) && (
                        <Text style={styles.errorText}>{nameError}</Text>
                      )}
                    </View>

                    <View style={styles.inputWrapper}>
                      <View
                        style={[
                          styles.phoneContainer,
                          (hasBlurred || hasSubmitted) &&
                            phoneNumberError &&
                            styles.errorBorder,
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.prefixContainer}
                          onPress={() => setIsCountryModalVisible(true)}
                        >
                          <Text style={styles.prefixText}>
                            {selectedCountry.prefix}
                          </Text>
                          <AntDesign
                            name="caretdown"
                            size={14}
                            color="#EF7F1A"
                          />
                        </TouchableOpacity>
                        <TextInput
                          ref={phoneNumberInputRef}
                          style={[styles.input, styles.phoneInput]}
                          placeholder="Enter your phone number"
                          placeholderTextColor="#666"
                          value={phoneNumber}
                          onChangeText={(text) => {
                            const formattedText = text.replace(/[^0-9]/g, "");
                            setPhoneNumber(formattedText);
                            if (hasBlurred || hasSubmitted) {
                              validatePhoneNumber(formattedText);
                            }
                          }}
                          onBlur={() => {
                            setHasBlurred(true);
                            validatePhoneNumber(phoneNumber);
                          }}
                          keyboardType="phone-pad"
                          returnKeyType="next"
                          onSubmitEditing={() => emailInputRef.current.focus()}
                        />
                      </View>
                      {phoneNumberError && (hasBlurred || hasSubmitted) && (
                        <Text style={styles.errorText}>{phoneNumberError}</Text>
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
                          onSubmitEditing={() =>
                            passwordInputRef.current.focus()
                          }
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
                          <AntDesign name="check" size={16} color="#EF7F1A" />
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

                    <View style={styles.signUpWithContainer}>
                      <Text style={styles.signUpWithText}>Sign up with</Text>
                      <TouchableOpacity
                        style={styles.googleButton}
                        onPress={() => setIsGoogleSignUpModalVisible(true)}
                      >
                        <Image
                          source={require("../../../assets/scrollboxImg/google-removebg.png")}
                          style={styles.googleIcon}
                        />
                      </TouchableOpacity>
                    </View>

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
            type={modalActionType === "email_exists" ? "warning" : "error"}
            onClose={handleSuccessModalClose}
          />

          <GoogleSignUpModal
            visible={isGoogleSignUpModalVisible}
            onClose={() => setIsGoogleSignUpModalVisible(false)}
          />

          <Modal
            animationType="slide"
            transparent={true}
            visible={isCountryModalVisible}
            onRequestClose={() => setIsCountryModalVisible(false)}
          >
            <View style={styles.countryModalContainer}>
              <View style={styles.countryModalContent}>
                <Text style={styles.countryModalTitle}>Select a country</Text>
                <FlatList
                  data={countries}
                  keyExtractor={(item) => item.prefix}
                  renderItem={renderCountryItem}
                />
                <TouchableOpacity
                  style={styles.closeCountryModalBtn}
                  onPress={() => setIsCountryModalVisible(false)}
                >
                  <Text style={styles.closeCountryModalBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
    width: width * 0.92,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 18,
    paddingLeft: 24,
    paddingRight: 24,
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
    borderColor: "#EF7F1A",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  phoneContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EF7F1A",
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  prefixContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  prefixText: {
    color: "#EF7F1A",
    fontSize: 16,
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
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
    color: "#EF7F1A",
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
    color: "#EF7F1A",
    textDecorationLine: "underline",
  },
  actionButton: {
    backgroundColor: "#EF7F1A",
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
    color: "#EF7F1A",
    textDecorationLine: "underline",
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  signUpWithContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  signUpWithText: {
    color: "#999",
    fontSize: 16,
    marginBottom: 8,
  },
  googleButton: {
    padding: 10,
  },
  googleIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  countryModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  countryModalContent: {
    width: "80%",
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 20,
  },
  countryModalTitle: {
    color: "#FFF",
    fontSize: 18,
    marginBottom: 15,
    alignSelf: "center",
  },
  countryItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  countryText: {
    color: "#FFF",
    fontSize: 16,
  },
  closeCountryModalBtn: {
    alignSelf: "center",
    marginTop: 15,
    backgroundColor: "#EF7F1A",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  closeCountryModalBtnText: {
    color: "#121212",
    fontWeight: "bold",
  },
});

export default SignUpPage;

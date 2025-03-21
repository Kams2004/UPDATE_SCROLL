import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  BackHandler,
  Image,
} from "react-native";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const MessageModal = ({ visible, message, type, onClose }) => {
  const { t } = useTranslation();

  // Handle Android back button to prevent app exit when modal is visible
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (visible) {
          onClose();
          return true; // Consume the event
        }
        return false;
      }
    );
    return () => backHandler.remove();
  }, [visible, onClose]);

  // Modal style configurations for different states using images
  const modalStyles = {
    success: {
      backgroundColor: "#2B1409",
      iconColor: "#2ECC71",
      icon: (
        <Image
          source={require("../../../assets/scrollboxImg/success.png")}
          style={styles.iconImage}
        />
      ),
    },
    error: {
      backgroundColor: "#2B1409",
      iconColor: "#E74C3C",
      icon: (
        <Image
          source={require("../../../assets/scrollboxImg/failed.png")}
          style={styles.iconImage}
        />
      ),
    },
    warning: {
      backgroundColor: "#2B1409",
      iconColor: "#F39C12",
      icon: (
        <Image
          source={require("../../../assets/scrollboxImg/failed.png")}
          style={styles.iconImage}
        />
      ),
    },
    offline: {
      backgroundColor: "#2B1409",
      iconColor: "#95A5A6",
      icon: (
        <Image
          source={require("../../../assets/scrollboxImg/failed.png")}
          style={styles.iconImage}
        />
      ),
    },
  };

  const { backgroundColor, icon, iconColor } =
    modalStyles[type] || modalStyles.error;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <View style={[styles.topBorder, { backgroundColor: iconColor }]} />
          <View style={styles.content}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.messageText}>{message}</Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: iconColor }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>
                {t("message_modal.dismiss")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  // Fixed modal size
  modalContainer: {
    width: width * 0.9,
    height: height * 0.45,
    borderRadius: 20,
    overflow: "hidden",
  },
  topBorder: {
    height: 10,
    width: "100%",
  },
  content: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconContainer: {
    marginBottom: 0,
    backgroundColor: "white",
    borderRadius: 50,
    padding: 10,
  },
  iconImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  messageText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
};

export default MessageModal;

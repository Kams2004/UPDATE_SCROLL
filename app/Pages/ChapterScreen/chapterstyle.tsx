import { StyleSheet,Dimensions } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  downloadModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  paymentMethodContainer: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },

  // downloadButton: {
  //   // backgroundColor: '#4CAF50', // Green color for download button
  //   paddingHorizontal: 16,
  //   paddingVertical: 8,
  //   borderRadius: 4,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   minWidth: 5,
  // },
  // Add these to your existing styles
  disabledButton: {
    opacity: 0.6,
  },
  progressContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadProgressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  downloaddownloadSpinner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },


  progressCircleIndicator: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressCircleCenter: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2B1409',
  },
  progressCircleFill: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF7F1A',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '0deg' }],
  },
  progressCircleBackground: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  progressText: {
    position: 'absolute',
    color: '#EF7F1A',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pauseImage: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  pauseIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 12,
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderBottomWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: '#EF7F1A',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    transform: [{ translateX: 2 }],
  },
  playIcon: {
    position: 'absolute',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBar: {
    width: 3,
    height: 12,
    backgroundColor: '#EF7F1A',
  },
  downloadIcon: {
    width: 28,
    height: 24,
    marginRight: 3,
    marginLeft: 3,
    tintColor: "#FFFFFF",
    resizeMode: "contain",
  },


  readerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  readerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  readerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeReaderButton: {
    padding: 5,
  },
  closeReaderButtonText: {
    color: '#FFF',
    fontSize: 24,
  },
  readerContent: {
    flex: 1,
    backgroundColor: '#000',
  },
  readerImage: {
    width: '100%',
    height: Dimensions.get('window').height - 150,
  },
  readerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  readerControlButton: {
    padding: 10,
    backgroundColor: '#EF7F1A',
    borderRadius: 5,
  },
  disabledControlButton: {
    opacity: 0.5,
  },
  readerControlText: {
    color: '#FFF',
    fontSize: 16,
  },
  extractionProgressContainer: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  extractionProgressText: {
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  extractionProgressBar: {
    height: 5,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  extractionProgressFill: {
    height: '100%',
    backgroundColor: '#EF7F1A',
  },



  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  progressPercentage: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  readButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  readButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
 
 
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  paymentOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  paymentOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10, // Vertical spacing between options
    alignItems: "center",
  },
  selectedPaymentOption: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F8FF",
  },
  paymentOptionText: {
    fontSize: 14,
    color: "#333",
  },
  selectedPaymentOptionText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  downloadModalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
  },
  downloadModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 16,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#EF7F1A",
    borderRadius: 4,
  },
  downloadStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  downloadStatusText: {
    fontSize: 14,
    color: "#666",
  },
  navBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingBottom: 10,
  },
  navBar: {
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    color: "#EF7F1A",
    fontSize: 20,
    marginRight: 20,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  downdrop: {
    width: 13,
    height: 13,
    marginRight: 10,
    marginBottom: 7,
    transform: [{ rotate: "270deg" }],
  },
  logo: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    marginRight: 5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  settingsIcon: {
    width: 35,
    height: 30,
    resizeMode: "contain",
  },
  dropdownContainer: {
    position: "absolute",
    top: 80,
    left: 20,
    backgroundColor: "#2B1409",
    borderRadius: 8,
    padding: 10,
    zIndex: 20,
  },
  dropdownItem: {
    color: "#EF7F1A",
    paddingVertical: 8,
    fontSize: 16,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  cardContainer: {
    width: "95%",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#2B1409",
    padding: 10,
    borderRadius: 10,
    borderColor: "gray",
    borderWidth: 1,
    width: "100%",
  },
  topImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  expandedContentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  largeImageLeft: {
    width: "35%",
    height: 130,
    resizeMode: "contain",
    borderRadius: 10,
  },
  textContainerRight: {
    flex: 1, // Allows text to take remaining space
    paddingLeft: 10,
    justifyContent: "center", // Centers text vertically
  },
  synopsisTitle: {
    color: "#EF7F1A",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 5,
    marginRight: 10,
  },
  descriptionText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "justify",
    marginBottom: 10,
  },
  iconsAndReadButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  iconsRowOverlayContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginHorizontal: 10,
  },
  iconImage: {
    width: 15,
    height: 15,
    resizeMode: "contain",
  },
  iconText: {
    fontSize: 10,
    color: "#f5f5f5",
  },
  downloadSpinner: {
    marginRight: 8,
  },
  // downloadSpinner: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
  downloadControlButton: {
    marginLeft: 8,
    padding: 4,
  },
  downloadingButton: {
    opacity: 0.8,
  },
  buttonIcon: {
    color: "#FFFFFF",
    marginRight: 8,
  },
  progressControlIcon: {
    color: "#FFFFFF",
  },
 
  progressBarBackground: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  progressPercentage: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "right",
  },
  readButton: {
    backgroundColor: "#7D3B1C",
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderRadius: 10,
    alignSelf: "center",
    marginRight: 10,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardImage: {
    width: 70,
    height: 70,
    marginRight: 10,
    resizeMode: "contain",
  },
  iconsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 1,
  },
  addToBasketIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  cardList: {
    flex: 1,
    width: "100%",
    marginTop: 110,
  },
  commentModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    padding: 20,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  commentSectionContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "40%", // Adjust this to control height
    backgroundColor: "#2B1409",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  cardDisabled: {
    opacity: 0.8,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff20",
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  buyButtonText: {
    color: "#ffffff",
    marginLeft: 5,
    fontSize: 12,
  },
  commentTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  readMoreButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  priceBasketContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8, // Add vertical padding for better spacing
    gap: 10, // Ensure spacing between image and price
  },
  priceText: {
    color: "white",
    fontWeight: "bold",
  },
  priceContainer: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  basketIconContainer: {
    position: "absolute",
    top: 20,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
  },
  basketIcon: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  basketCount: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  purchaseModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  purchaseModalContainer: {
    backgroundColor: "black",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "100%",
    padding: 15,
  },
  purchaseModalCloseButton: {
    alignSelf: "flex-end",
    padding: 10,
  },

  purchaseModalCloseButtonText: {
    color: "#EF7F1A",
    fontSize: 24,
    fontWeight: "bold",
  },
  purchaseModalTitle: {
    color: "#EF7F1A",
    fontSize: 22,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  purchaseModalBasketList: {
    maxHeight: "50%",
  },
  purchaseModalBasketItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  purchaseModalItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    resizeMode: "contain",
  },
  purchaseModalItemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  purchaseModalItemTitle: {
    color: "white",
    fontSize: 16,
    marginBottom: 5,
  },
  purchaseModalPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  purchaseModalItemPrice: {
    color: "#EF7F1A",
    fontSize: 16,
  },
  purchaseModalRemoveButton: {
    backgroundColor: "rgba(239, 127, 26, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  purchaseModalRemoveButtonText: {
    color: "#EF7F1A",
  },
  addMoreChaptersButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  addMoreChaptersButtonText: {
    color: "#EF7F1A",
    fontSize: 16,
  },
  purchaseModalSummaryContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  purchaseModalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  purchaseModalTotalText: {
    color: "white",
    fontSize: 14,
  },
  purchaseModalTotalAmount: {
    color: "white",
    fontSize: 14,
  },
  purchaseModalTaxText: {
    color: "gray",
    fontSize: 12,
  },
  purchaseModalTaxAmount: {
    color: "gray",
    fontSize: 12,
  },
  purchaseModalGrandTotalText: {
    color: "#EF7F1A",
    fontSize: 16,
    fontWeight: "bold",
  },
  purchaseModalGrandTotalAmount: {
    color: "#EF7F1A",
    fontSize: 16,
    fontWeight: "bold",
  },

  purchaseModalBuyButton: {
    backgroundColor: "#EF7F1A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
  },

  purchaseModalBasketIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  purchaseModalBuyButtonText: {
    color: "#2B1409",
    fontSize: 16,
    fontWeight: "bold",
  },
  purchaseModalDisabledButton: {
    opacity: 0.5,
  },
  purchaseModalLoadingButton: {
    backgroundColor: "rgba(239, 127, 26, 0.5)",
  },
  floatingBasketButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  basketdownloadSpinner: {
    position: "absolute",
    alignItems: "center", // Center children horizontally
    justifyContent: "center", // Center children vertically
  },
  basketButtonText: {
    color: "#2B1409",
    fontSize: 14, // Slightly smaller font size to fit better
    fontWeight: "bold",
    textAlign: "center", // Center the text
  },
  basketIcon: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
  basketNumberContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF7F1A",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  basketNumber: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  cartCountBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartCountText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  readButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  paymentMethodImageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  paymentMethodImageOption: {
    width: "30%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedPaymentMethodImageOption: {
    borderColor: "#007BFF",
    backgroundColor: "#F0F8FF",
  },
  paymentMethodImage: {
    width: 80,
    height: 50,
  },
  
  downloadProgress: {
    width: 20,
    height: 20,
  },
});

export default styles;

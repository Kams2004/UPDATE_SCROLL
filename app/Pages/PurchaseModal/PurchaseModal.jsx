// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   Modal,
//   SafeAreaView,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import ApiService from "@/app/Services/ApiService";

// const PaymentOption = ({
//   icon: Icon,
//   title,
//   description,
//   selected,
//   onPress,
// }) => (
//   <TouchableOpacity
//     style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
//     onPress={onPress}
//   >
//     <View style={styles.paymentOptionContent}>
//       <View
//         style={[styles.iconContainer, selected && styles.iconContainerSelected]}
//       >
//         <Icon style={[styles.icon, selected && styles.iconSelected]} />
//       </View>
//       <View style={styles.paymentOptionText}>
//         <Text style={styles.paymentOptionTitle}>{title}</Text>
//         <Text style={styles.paymentOptionDescription}>{description}</Text>
//       </View>
//     </View>
//   </TouchableOpacity>
// );

// const PurchaseCartPage = ({ navigation }) => {
//   const [cartItems, setCartItems] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [paymentUrl, setPaymentUrl] = useState(null);
//   const [processingPayment, setProcessingPayment] = useState(false);
//   const [removingItemId, setRemovingItemId] = useState(null);
//   const [clearingCart, setClearingCart] = useState(false);
//   const [currency, setCurrency] = useState(null);
//   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

//   const fetchCurrencyFromStorage = async () => {
//     try {
//       const storedCurrency = await AsyncStorage.getItem("currency");
//       setCurrency(storedCurrency);
//     } catch (error) {
//       Alert.alert("Error", "Failed to fetch currency preference");
//     }
//   };

//   const fetchCart = async () => {
//     setLoading(true);
//     try {
//       const token = await AsyncStorage.getItem("userToken");
//       if (!token) throw new Error("No auth token found");
//       const response = await ApiService.getCart(token);

//       if (response.items) {
//         setCartItems(response.items);
//         const total = response.items.reduce(
//           (sum, item) => sum + parseFloat(item.price),
//           0
//         );
//         setTotalAmount(total);
//       }
//     } catch (error) {
//       if (error.message === "Authentication required. Please log in again.") {
//         Alert.alert("Session Expired", "Please login again");
//         navigation.navigate("Login");
//       } else {
//         Alert.alert("Error", error.message || "Failed to fetch cart");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePayment = async () => {
//     if (!selectedPaymentMethod) {
//       Alert.alert("Error", "Please select a payment method");
//       return;
//     }

//     if (cartItems.length === 0) {
//       Alert.alert("Error", "Your cart is empty");
//       return;
//     }

//     setProcessingPayment(true);
//     try {
//       const token = await AsyncStorage.getItem("userToken");
//       if (!token) throw new Error("No auth token found");

//       const payload = {
//         amount: totalAmount,
//         chapterIds: cartItems.map((item) => item.id),
//       };

//       let response;
//       if (selectedPaymentMethod === "paypal") {
//         response = await ApiService.createPayPalTransaction(payload, token);
//         if (response?.success && response?.paymentUrl) {
//           setPaymentUrl(response.paymentUrl);
//         }
//       } else {
//         response = await ApiService.createTransaction(payload, token);
//         if (response?.data?.link) {
//           setPaymentUrl(response.data.link);
//         } else {
//           throw new Error("Payment link not received");
//         }
//       }
//     } catch (error) {
//       Alert.alert("Error", error.message || "Failed to process payment");
//     } finally {
//       setProcessingPayment(false);
//     }
//   };

//   const handleClearCart = async () => {
//     setClearingCart(true);
//     try {
//       const token = await AsyncStorage.getItem("userToken");
//       if (!token) throw new Error("No auth token found");
//       await ApiService.clearCart(token);
//       setCartItems([]);
//       setTotalAmount(0);
//       Alert.alert("Success", "Cart cleared successfully");
//     } catch (error) {
//       Alert.alert("Error", "Failed to clear cart");
//     } finally {
//       setClearingCart(false);
//     }
//   };

//   const handleRemoveItem = async (itemId) => {
//     setRemovingItemId(itemId);
//     try {
//       const token = await AsyncStorage.getItem("userToken");
//       if (!token) throw new Error("No auth token found");
//       await ApiService.removeFromCart(itemId, token);
//       await fetchCart();
//     } catch (error) {
//       Alert.alert("Error", "Failed to remove item");
//     } finally {
//       setRemovingItemId(null);
//     }
//   };

//   useEffect(() => {
//     fetchCurrencyFromStorage();
//     fetchCart();
//   }, []);

//   const renderCartItem = ({ item }) => (
//     <View style={styles.cartItem}>
//       <View style={styles.cartItemContent}>
//         <View>
//           <Text style={styles.cartItemTitle}>{item.title}</Text>
//           <Text style={styles.cartItemPrice}>
//             {currency} {parseFloat(item.price).toFixed(2)}
//           </Text>
//         </View>
//         <TouchableOpacity
//           style={[
//             styles.removeButton,
//             removingItemId === item.id && styles.removeButtonDisabled,
//           ]}
//           onPress={() => handleRemoveItem(item.id)}
//           disabled={removingItemId === item.id}
//         >
//           <Text style={styles.removeButtonText}>Remove</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.content}>
//         <Text style={styles.header}>Shopping Cart ({currency})</Text>

//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#0000ff" />
//           </View>
//         ) : cartItems.length === 0 ? (
//           <View style={styles.emptyCartContainer}>
//             <Text style={styles.emptyCartText}>Your cart is empty</Text>
//           </View>
//         ) : (
//           <View style={styles.cartContent}>
//             <TouchableOpacity
//               style={[
//                 styles.clearButton,
//                 clearingCart && styles.clearButtonDisabled,
//               ]}
//               onPress={handleClearCart}
//               disabled={clearingCart}
//             >
//               <Text style={styles.clearButtonText}>
//                 {clearingCart ? "Clearing..." : "Clear All"}
//               </Text>
//             </TouchableOpacity>

//             <FlatList
//               data={cartItems}
//               renderItem={renderCartItem}
//               keyExtractor={(item) => item.id}
//               style={styles.cartList}
//             />

//             <View style={styles.totalContainer}>
//               <Text style={styles.totalText}>
//                 Total: {currency} {totalAmount.toFixed(2)}
//               </Text>
//             </View>

//             <View style={styles.paymentMethodsContainer}>
//               <Text style={styles.paymentMethodsTitle}>
//                 Select Payment Method
//               </Text>
//               <PaymentOption
//                 title="PayPal"
//                 description="Pay securely with PayPal"
//                 selected={selectedPaymentMethod === "paypal"}
//                 onPress={() => setSelectedPaymentMethod("paypal")}
//               />
//               <PaymentOption
//                 title="Flutterwave"
//                 description="Pay with card, bank transfer, or mobile money"
//                 selected={selectedPaymentMethod === "flutterwave"}
//                 onPress={() => setSelectedPaymentMethod("flutterwave")}
//               />

//               <TouchableOpacity
//                 style={[
//                   styles.payButton,
//                   (processingPayment || !selectedPaymentMethod) &&
//                     styles.payButtonDisabled,
//                 ]}
//                 onPress={handlePayment}
//                 disabled={processingPayment || !selectedPaymentMethod}
//               >
//                 <Text style={styles.payButtonText}>
//                   {processingPayment
//                     ? "Processing..."
//                     : `Pay ${totalAmount.toFixed(2)} ${currency}`}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}
//       </View>

//       <Modal visible={!!paymentUrl} animationType="slide">
//         <SafeAreaView style={styles.modalContainer}>
//           <WebView
//             source={{ uri: paymentUrl }}
//             style={styles.webView}
//             onNavigationStateChange={(navState) => {
//               if (navState.url.includes("success")) {
//                 setPaymentUrl(null);
//                 setCartItems([]);
//                 setTotalAmount(0);
//                 Alert.alert("Success", "Payment completed successfully!");
//               } else if (navState.url.includes("cancel")) {
//                 setPaymentUrl(null);
//                 Alert.alert("Payment Cancelled", "You cancelled the payment");
//               }
//             }}
//           />
//           <TouchableOpacity
//             style={styles.closeButton}
//             onPress={() => setPaymentUrl(null)}
//           >
//             <Text style={styles.closeButtonText}>Close</Text>
//           </TouchableOpacity>
//         </SafeAreaView>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   content: {
//     flex: 1,
//     padding: 16,
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 16,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   emptyCartContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   emptyCartText: {
//     fontSize: 18,
//     color: "#666",
//   },
//   cartContent: {
//     flex: 1,
//   },
//   clearButton: {
//     backgroundColor: "#ff4444",
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 16,
//   },
//   clearButtonDisabled: {
//     opacity: 0.5,
//   },
//   clearButtonText: {
//     color: "white",
//     textAlign: "center",
//     fontWeight: "bold",
//   },
//   cartList: {
//     flex: 1,
//   },
//   cartItem: {
//     backgroundColor: "white",
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 8,
//     elevation: 2,
//   },
//   cartItemContent: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   cartItemTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   cartItemPrice: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 4,
//   },
//   removeButton: {
//     backgroundColor: "#ff4444",
//     padding: 8,
//     borderRadius: 4,
//   },
//   removeButtonDisabled: {
//     opacity: 0.5,
//   },
//   removeButtonText: {
//     color: "white",
//   },
//   totalContainer: {
//     borderTopWidth: 1,
//     borderTopColor: "#ddd",
//     paddingTop: 16,
//     marginBottom: 16,
//   },
//   totalText: {
//     fontSize: 18,
//     fontWeight: "bold",
//     textAlign: "right",
//   },
//   paymentMethodsContainer: {
//     marginBottom: 16,
//   },
//   paymentMethodsTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 12,
//   },
//   paymentOption: {
//     borderWidth: 2,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 8,
//   },
//   paymentOptionSelected: {
//     borderColor: "#007AFF",
//     backgroundColor: "#F0F8FF",
//   },
//   paymentOptionContent: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   iconContainer: {
//     padding: 8,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   iconContainerSelected: {
//     backgroundColor: "#007AFF",
//   },
//   icon: {
//     width: 24,
//     height: 24,
//     tintColor: "#666",
//   },
//   iconSelected: {
//     tintColor: "white",
//   },
//   paymentOptionText: {
//     flex: 1,
//   },
//   paymentOptionTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   paymentOptionDescription: {
//     fontSize: 14,
//     color: "#666",
//   },
//   payButton: {
//     backgroundColor: "#007AFF",
//     padding: 16,
//     borderRadius: 8,
//     marginTop: 16,
//   },
//   payButtonDisabled: {
//     opacity: 0.5,
//   },
//   payButtonText: {
//     color: "white",
//     textAlign: "center",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
//   modalContainer: {
//     flex: 1,
//   },
//   webView: {
//     flex: 1,
//   },
//   closeButton: {
//     backgroundColor: "#333",
//     padding: 16,
//   },
//   closeButtonText: {
//     color: "white",
//     textAlign: "center",
//     fontWeight: "bold",
//   },
// });

// export default PurchaseCartPage;

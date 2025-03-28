import React, { useState, useEffect } from "react";
import {
  isChapterDownloaded,
  getChapterFilePath,
  saveDownloadedChapter,
} from "../ChapterReader/storageHelpers";
import DownloadProgressIndicator from "./DownloadProgressIndicator";
import { useRef } from "react";
import JSZip from "jszip";
import { Buffer } from "buffer";
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ImageBackground,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PurchaseModal from "../PurchaseModal/PurchaseModal";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import styles from "./chapterstyle";
import CommentSection from "../Comment/Comment";
import ApiService from "../../Services/ApiService";
import ChapterReader from "../ChapterReader/ChapterReader";
import MessageModal from "../MessageModal/MessageModal";
import i18n from "../locales/i18n";
const { height } = Dimensions.get("window");
import { useTranslation } from "react-i18next";
import Loader from "../../../components/Loader";
import SocialInteractions from "../SocialInteractions/SocialInteractions";

const DEFAULT_IMAGES = {
  thumbnail: require("./../../../assets/scrollboxImg/06.png"),
  liked: require("../../../assets/scrollboxImg/like.png"),
  viewed: require("../../../assets/scrollboxImg/view.png"),
  large: require("./../../../assets/scrollboxImg/Img02.png"),
  basket: require("./../../../assets/scrollboxImg/15.png"),
  dropdown: require("./../../../assets/scrollboxImg/08.png"),
  logo: require("./../../../assets/scrollboxImg/14.png"),
  settings: require("./../../../assets/scrollboxImg/09.png"),
  background: require("./../../../assets/scrollboxImg/02.png"),
  comments: require("./../../../assets/scrollboxImg/11.png"),
  likes: require("./../../../assets/scrollboxImg/13.png"),
  views: require("./../../../assets/scrollboxImg/12.png"),
  inCart: require("./../../../assets/scrollboxImg/10.png"),
  purchased: require("./../../../assets/scrollboxImg/15.png"),
  inCart: require("./../../../assets/scrollboxImg/10.png"),
  purchased: require("./../../../assets/scrollboxImg/15.png"),
  download: require("./../../../assets/scrollboxImg/16.png"), // Add this line
};
const ChapterScreen = () => {
  const [selectedChapterForReading, setSelectedChapterForReading] =
    useState(null);
  const [socialInteractions, setSocialInteractions] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [chapterCommentCounts, setChapterCommentCounts] = useState({});

  const [downloadingChapters, setDownloadingChapters] = useState({});
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentLink, setPaymentLink] = useState(null);
  const navigation = useNavigation();
  const [viewedChapters, setViewedChapters] = useState(new Set());
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [selectedTome, setSelectedTome] = useState("Tome 1");
  const [visibleCommentForChapter, setVisibleCommentForChapter] =
    useState(null);
  const [chapters, setChapters] = useState([]);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageSource, setSelectedImageSource] = useState(null);
  const [basket, setBasket] = useState([]);
  const [expandedText, setExpandedText] = useState({});
  const [purchasedChapters, setPurchasedChapters] = useState([]);
  const [isPurchaseModalVisible, setIsPurchaseModalVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastLoadedLanguage, setLastLoadedLanguage] = useState({});
  const [likedChapters, setLikedChapters] = useState(new Set());
  const [tomes, setTomes] = useState([]); // <--- Add this line
  const [loadingTomes, setLoadingTomes] = useState(false); // Optional for loading state
  const [errorTomes, setErrorTomes] = useState(null);
  const [userId, setUserId] = useState(null);
  const [comics, setComics] = useState([]);
  const [user, setuser] = useState([]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentlyDownloadingChapter, setCurrentlyDownloadingChapter] =
    useState(null);
  const [isDownloadingPaused, setIsDownloadingPaused] = useState(false);
  const downloadResumableRef = useRef(null);
  const [selectedComic, setSelectedComic] = useState(null);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageModalType, setMessageModalType] = useState("info");
  const currentIndex = chapters.findIndex(
    (ch) => ch.id === selectedChapterForReading
  );

  const [downloadedChapters, setDownloadedChapters] = useState(new Set());
  const nextChapterId =
    currentIndex !== -1 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1].id
      : null;
  const previousChapterId =
    currentIndex > 0 ? chapters[currentIndex - 1].id : null;
  useEffect(() => {
    const initializeSocialInteractions = async () => {
      const social = new SocialInteractions();
      await social.initialize();
      setSocialInteractions(social);
    };

    initializeSocialInteractions();
  }, []);
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await ApiService.getCurrentUserAndStoreId();
        setUserId(userId); // Store user ID in state
      } catch (error) {
        console.error("Error fetching user ID:", error.message);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const loadDownloadedChapters = async () => {
      try {
        const savedChapters = await AsyncStorage.getItem("savedChapters");
        if (savedChapters) {
          setDownloadedChapters(new Set(JSON.parse(savedChapters)));
        }
      } catch (error) {
        console.error("Error loading downloaded chapters:", error);
      }
    };
    loadDownloadedChapters();
  }, []);
  const handleDownloadStart = (chapterId) => {
    setDownloadingChapters((prev) => ({
      ...prev,
      [chapterId]: {
        progress: 0,
        stage: "Starting download...",
        isPaused: false,
      },
    }));
  };

  const handleDownloadProgress = (chapterId, progress, stage) => {
    setDownloadingChapters((prev) => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        progress,
        stage,
      },
    }));
  };

  const handleDownloadComplete = (chapterId) => {
    setDownloadingChapters((prev) => {
      const newState = { ...prev };
      delete newState[chapterId];
      return newState;
    });
    // Update downloaded chapters state
    setDownloadedChapters((prev) => new Set([...prev, chapterId]));
  };

  const handleDownloadError = (chapterId, error) => {
    setDownloadingChapters((prev) => {
      const newState = { ...prev };
      delete newState[chapterId];
      return newState;
    });
    showMessage(`Download failed: ${error}`, "error");
  };

  useEffect(() => {
    const fetchComics = async () => {
      try {
        const response = await fetch(
          "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/comics"
        );
        const data = await response.json();
        setComics(data); // Store fetched comics

        // Log the fetched comics
        console.log(
          "(NOBRIDGE) LOG  Fetched Comics:",
          data.map((comic) => ({ id: comic._id, title: comic.title }))
        );

        // Auto-select the first comic and fetch tomes
        if (data.length > 0) {
          const selectedComicId = data[0]._id;
          setSelectedComic(selectedComicId);
          console.log("(NOBRIDGE) LOG  Selected Comic ID:", selectedComicId);

          // Fetch tome ID using selected comic ID
          fetchTomeId(selectedComicId);
        }
      } catch (error) {
        console.error("Error fetching comics:", error);
      }
    };

    const fetchTomeId = async (comicId) => {
      try {
        const response = await fetch(
          `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/tome/${comicId}`
        );
        const tomeData = await response.json();

        if (tomeData.length > 0) {
          console.log("(NOBRIDGE) LOG  Fetched Tome ID:", tomeData[0]._id);
        } else {
          console.log("(NOBRIDGE) LOG  No Tome Found for Comic ID:", comicId);
        }
      } catch (error) {
        console.error("Error fetching tome ID:", error);
      }
    };

    fetchComics();
  }, []);
  const showMessage = (message, type = "info") => {
    setMessageModalMessage(message);
    setMessageModalType(type);
    setIsMessageModalVisible(true);
  };

  // Function to close MessageModal
  const closeMessageModal = () => {
    setIsMessageModalVisible(false);
  };
  useEffect(() => {
    if (user) {
      console.log("User Context:", user);
      console.log("User ID:", user?.userID || "No user ID available");
    } else {
      console.warn("User context is null or undefined.");
    }
  }, [user]);

  useEffect(() => {
    const fetchComics = async () => {
      try {
        const comics = await ApiService.getComics(selectedLanguage);
        setComics(comics);
        if (comics.length > 0) {
          setSelectedComic(comics[0]._id); // Automatically select the first comic
        }
      } catch (error) {
        console.error("Error fetching comics:", error.message);
      }
    };

    fetchComics();
  }, [selectedLanguage]);

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      setUserId(storedUserId);
    };

    fetchUserId();
  }, []);
  useEffect(() => {
    console.log("User ID:", userId);
    console.log(
      "Chapters with access:",
      chapters.filter(
        (ch) =>
          Array.isArray(ch.usersWithAccess) &&
          ch.usersWithAccess.includes(userId)
      )
    );
  }, [userId, chapters]);

  useEffect(() => {
    const updateChaptersForLanguage = async () => {
      try {
        // Clear previously cached chapters
        const cacheKey = `chapters_${selectedTome}_${selectedLanguage}`;
        await AsyncStorage.removeItem(cacheKey);

        // Fetch chapters in the new language
        const fetchedChapters = await ApiService.getChaptersByLanguage(
          selectedTome,
          selectedLanguage
        );

        setChapters(fetchedChapters);

        // ✅ Restore the currently selected chapter in the new language
        const storedChapterData = await AsyncStorage.getItem(
          "selectedChapterForReading"
        );
        if (storedChapterData) {
          const parsedData = JSON.parse(storedChapterData);

          // If language changed, fetch the same chapter in the new language
          if (parsedData.language !== selectedLanguage) {
            const newChapter = fetchedChapters.find(
              (ch) => ch.id === parsedData.id
            );
            if (newChapter) {
              setSelectedChapterForReading(newChapter.id);

              // ✅ Update stored chapter with the new language
              await AsyncStorage.setItem(
                "selectedChapterForReading",
                JSON.stringify({
                  id: newChapter.id,
                  language: selectedLanguage,
                })
              );
            }
          }
        }
      } catch (error) {
        console.error("Error updating chapters for language:", error);
      }
    };

    if (selectedLanguage) {
      updateChaptersForLanguage();
    }
  }, [selectedLanguage]);

  // Create a function to safely get image source
  const getImageSource = (backendUrl, defaultImage) => {
    if (backendUrl && backendUrl.trim() !== "") {
      try {
        return { uri: backendUrl };
      } catch (error) {
        console.warn("Invalid backend image URL", backendUrl);
        return defaultImage;
      }
    }
    return defaultImage;
  };
  const navigateBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };
  useEffect(() => {
    fetchTomes();
  }, []);
  useEffect(() => {
    loadBasket(); // Load the basket from the server
  }, []);
  useEffect(() => {
    if (selectedTome) {
      fetchChaptersByTome(selectedTome);
    }
  }, [selectedTome]);
  useEffect(() => {
    const updateChaptersForLanguage = async () => {
      try {
        const cacheKey = `chapters_${selectedTome}_${selectedLanguage}`;
        await AsyncStorage.removeItem(cacheKey); // Clear cached chapters
        fetchChapters(); // Fetch chapters in the newly selected language
      } catch (error) {
        console.error("Error updating chapters for language:", error);
      }
    };
    updateChaptersForLanguage();
  }, [selectedLanguage]);

  // test de prince
  useEffect(() => {
    if (chapters.length > 0) {
      chapters.forEach((chapter) => {
        console.log(
          `Chapter ${chapter.title}: isFree=${chapter.isFree}, isPurchased=${chapter.isPurchased}`
        );
      });
    }
  }, [chapters]);

  // fin de test de prince
  const handleCommentCountChange = (chapterId, newCount) => {
    setChapters((prevChapters) =>
      prevChapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, commentNumber: newCount }
          : chapter
      )
    );
  };
  const fetchTomes = async () => {
    if (!selectedComic) {
      console.warn("(NOBRIDGE) LOG  No selected comic, skipping tome fetch.");
      return;
    }

    try {
      setLoadingTomes(true);
      setErrorTomes("");

      const response = await ApiService.getTomes(selectedComic); // Fetch tomes based on the selected comic
      const tomesData = response || []; // Ensure it's an array

      console.log("(NOBRIDGE) LOG  Fetched Tomes:", tomesData);

      setTomes(tomesData);

      if (tomesData.length > 0) {
        const firstTome = tomesData[0];
        setSelectedTome(firstTome._id); // Select the first Tome
        console.log("(NOBRIDGE) LOG  Selected Tome ID:", firstTome._id);

        fetchChaptersByTome(firstTome._id); // Fetch Chapters for selected Tome
      } else {
        setSelectedTome(null);
        console.log("(NOBRIDGE) LOG  No Tomes Found.");
      }
    } catch (error) {
      console.error("Error fetching tomes:", error.message);
      setErrorTomes("Failed to load tomes. Please try again.");
    } finally {
      setLoadingTomes(false);
    }
  };

  // Call fetchTomes when `selectedComic` changes
  useEffect(() => {
    fetchTomes();
  }, [selectedComic]); // Triggers re-fetch when comic changes

  useEffect(() => {
    loadBasket();
  }, []);

  const fetchChaptersByTome = async (selectedTome) => {
    if (!selectedTome) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/chapters/${selectedTome}`
      );

      const chapters = response.data || [];
      setChapters(chapters);

      if (chapters.length > 0) {
        setSelectedChapter(chapters[0]);
      } else {
        setError("No chapters found for the selected tome.");
      }
    } catch (error) {
      console.error("Error fetching chapters:", error.message);
      setError("Failed to load chapters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
    loadBasket();
  }, [selectedTome]);
  useEffect(() => {
    const calculateTotalAmount = () => {
      const amount = basket.reduce(
        (sum, chapter) => sum + (chapter.price || 0),
        0
      );
      setTotalAmount(amount);
    };

    calculateTotalAmount();
  }, [basket]);
  const FloatingBasketButton = () => {
    if (cartItemsCount === 0) return null; // Hide if cart is empty

    return (
      <TouchableOpacity
        style={styles.floatingBasketButton}
        onPress={() => {
          setIsPurchaseModalVisible(true);
        }}
      >
        <View style={styles.basketButtonContent}>
          <Text style={styles.basketButtonText}>{t("cart.buy")}</Text>
        </View>
        <View style={styles.basketNumberContainer}>
          <Text style={styles.basketNumber}>{cartItemsCount}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  const extractImagesFromCBZ = async (cbzUri) => {
    try {
      const zipData = await FileSystem.readAsStringAsync(cbzUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const zip = new JSZip();
      await zip.loadAsync(zipData, { base64: true });

      const validExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
      const entries = [];

      zip.forEach((relativePath, file) => {
        if (!file.dir && validExtensions.test(file.name)) {
          entries.push(file);
        }
      });

      entries.sort((a, b) => {
        const getNumber = (str) => {
          const match = str.name.match(/\d+/);
          return match ? parseInt(match[0]) : Infinity;
        };
        return getNumber(a) - getNumber(b);
      });

      if (entries.length === 0) {
        throw new Error("No valid images found in CBZ file");
      }

      const extractDir = `${FileSystem.cacheDirectory}extracted_${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(extractDir, { intermediates: true });

      const extractedPages = [];

      for (let i = 0; i < entries.length; i++) {
        const file = entries[i];
        const data = await file.async("uint8array");
        const base64Data = Buffer.from(data).toString("base64");
        const newFilename = `${extractDir}${String(i).padStart(
          3,
          "0"
        )}.${file.name.split(".").pop()}`;

        await FileSystem.writeAsStringAsync(newFilename, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        extractedPages.push({ uri: `file://${newFilename}` });
      }

      return extractedPages;
    } catch (error) {
      console.error("Image extraction failed:", error);
      throw error;
    }
  };
  const loadBasket = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        throw new Error("No authentication token");
      }

      const cart = await ApiService.getCart(token);

      // Filter chapters not already accessible
      const filteredChapters = cart.chapters.filter((chapter) => {
        return !chapter.usersWithAccess?.includes(user?.userID);
      });

      // Use backend's totalPrice directly
      setBasket(filteredChapters || []);
      setCartItemsCount(filteredChapters.length || 0);
      setTotalAmount(cart.totalPrice || 0);
    } catch (error) {
      console.error("Cart loading error:", error.message);

      if (error.message.includes("Session expired")) {
        await AsyncStorage.removeItem("userToken");
        showMessage(t("cart.session_expired"), "error");
        navigation.navigate("Login");
      }
    }
  };
  const handleWebViewNavigationStateChange = async (newNavState) => {
    const { url } = newNavState;

    // Check for payment completion
    if (url.includes("/success")) {
      try {
        const token = await AsyncStorage.getItem("token");

        // Verify and fetch the latest transactions
        const transactions = await ApiService.getTransactions(token);

        // Find the most recent transaction
        const latestTransaction = transactions[0];

        if (latestTransaction) {
          // Update purchased chapters
          const purchasedChapterIds = transactions.flatMap(
            (txn) => txn.chapterIds
          );

          setPurchasedChapters((prevPurchased) => [
            ...prevPurchased,
            ...purchasedChapterIds,
          ]);

          // Clear the basket
          setBasket([]);
          await AsyncStorage.removeItem("basket");

          // Close WebView
          setPaymentLink(null);

          // Show success message
          showMessage(t("cart.purchase_success"), "success");
          setPaymentStatus("success");
        }
      } catch (error) {
        console.error("Error after successful payment:", error);
        showMessage(t("cart.verification_error"), "error");
      }
    } else if (url.includes("/cancel")) {
      // Payment cancelled
      setPaymentLink(null);
      setIsPurchaseModalVisible(true);
      showMessage(t("cart.payment_cancelled"), "error");
    }
  };
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const likedChaptersData = await AsyncStorage.getItem("likedChapters");
        const viewedChaptersData = await AsyncStorage.getItem("viewedChapters");

        setLikedChapters(new Set(JSON.parse(likedChaptersData) || []));
        setViewedChapters(new Set(JSON.parse(viewedChaptersData) || []));
      } catch (error) {
        console.error("Error loading persisted state:", error.message);
      }
    };

    loadPersistedState();
  }, []);

  const handleLike = async (chapterId) => {
    if (!socialInteractions) return;

    const result = await socialInteractions.toggleLike(
      chapterId,
      navigation,
      showMessage,
      t
    );

    if (result.success) {
      setChapters((prevChapters) =>
        prevChapters.map((chapter) =>
          chapter.id === chapterId
            ? { ...chapter, likes: result.likes, hasLiked: result.hasLiked }
            : chapter
        )
      );

      // Update the likedChapters state
      setLikedChapters((prevLikedChapters) => {
        const newLikedChapters = new Set(prevLikedChapters);
        if (result.hasLiked) {
          newLikedChapters.add(chapterId);
        } else {
          newLikedChapters.delete(chapterId);
        }
        return newLikedChapters;
      });
    }
  };

  const handleViewChapter = async (chapterId) => {
    if (!socialInteractions) return;

    const result = await socialInteractions.viewChapter(
      chapterId,
      navigation,
      showMessage,
      t
    );
    if (result.success) {
      setChapters((prevChapters) =>
        prevChapters.map((chapter) =>
          chapter.id === chapterId
            ? { ...chapter, views: result.views }
            : chapter
        )
      );
      setSelectedChapterForReading(chapterId);
    }
  };
  const handleCheckout = async () => {
    try {
      if (basket.length === 0) {
        showMessage(
          "Your cart is empty. Please add items before checkout.",
          "error"
        );
        return;
      }

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        showMessage(
          "You need to log in to proceed with the purchase.",
          "error"
        );
        navigation.navigate("Login"); // Redirect to login page
        return;
      }

      // Prepare transaction data
      const transactionData = {
        chapterIds: basket.map((chapter) => chapter.id),
        amount: totalAmount,
        currency: basket[0]?.currency || "XAF",
        paymentMethod: selectedPaymentMethod,
      };

      let paymentUrl;
      if (selectedPaymentMethod === "paypal") {
        const response = await ApiService.createPayPalTransaction(
          transactionData,
          token
        );
        paymentUrl = response?.paymentUrl;
      } else {
        const response = await ApiService.createTransaction(
          transactionData,
          token
        );
        paymentUrl = response?.link;
      }

      if (paymentUrl) {
        setPaymentLink(paymentUrl); // Open WebView for payment
        setIsPurchaseModalVisible(false);
      } else {
        throw new Error("Failed to generate payment link.");
      }
    } catch (error) {
      console.error("Error during checkout:", error.message);
      showMessage(
        "An error occurred during checkout. Please try again.",
        "error"
      );
    }
  };

  const removeFromBasket = async (chapterId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("User is not logged in");

      // Remove from backend cart
      const result = await ApiService.clearCartById(chapterId, token);

      // Update the basket state
      const updatedBasket = basket.filter(
        (chapter) => chapter.id !== chapterId
      );
      setBasket(updatedBasket);
      setCartItemsCount(updatedBasket.length);

      // Recalculate total amount
      const newTotalAmount = updatedBasket.reduce(
        (sum, chapter) => sum + (chapter.price?.value || chapter.price || 0),
        0
      );
      setTotalAmount(newTotalAmount);

      // Update the chapter state to reflect removal
      setChapters((prevChapters) =>
        prevChapters.map((ch) =>
          ch.id === chapterId ? { ...ch, isInBasket: false } : ch
        )
      );
    } catch (error) {
      console.error("Error removing from cart:", error.message);
      showMessage(
        t("cart.remove_error", {
          message: error.message || t("cart.remove_default_error"),
        }),
        "error"
      );
    }
  };
  const openBasketModal = () => {
    setBasketModalVisible(true);
  };

  const closeBasketModal = () => {
    setBasketModalVisible(false);
  };
  // Process chapters to update liked and viewed states
  const processChapterStates = (fetchedChapters, userId) => {
    const liked = new Set();
    const viewed = new Set();

    fetchedChapters.forEach((chapter) => {
      if (chapter.likedBy?.includes(userId)) liked.add(chapter.id);
      if (chapter.viewedBy?.includes(userId)) viewed.add(chapter.id);
    });

    setLikedChapters(liked);
    setViewedChapters(viewed);
  };

  const fetchChapters = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      const language = i18n.language || "en";

      if (!selectedComic) {
        console.warn("No selected comic. Skipping chapter fetch.");
        return;
      }

      const tomeResponse = await ApiService.getTomesByComicId(
        selectedComic,
        language
      );

      if (!tomeResponse || tomeResponse.length === 0) {
        throw new Error("No tomes found for the selected comic.");
      }

      const tomeId = tomeResponse[0]._id;
      console.log("(NOBRIDGE) LOG  Fetched Tome ID:", tomeId);

      const chaptersData = await ApiService.getChaptersByLanguage(
        tomeId,
        language,
        token
      );

      const userId = await AsyncStorage.getItem("userId");

      const savedChapters = await AsyncStorage.getItem("savedChapters");
      const savedChapterIds = savedChapters ? JSON.parse(savedChapters) : [];

      const mappedChapters = chaptersData.map((chapter) => {
        const isDownloaded = savedChapterIds.includes(chapter.id);
        return {
          id: chapter.id,
          title: chapter.title,
          description: chapter.synopsis,
          image: getImageSource(chapter.iconUrl, DEFAULT_IMAGES.thumbnail),
          largeImage: getImageSource(chapter.preview, DEFAULT_IMAGES.large),
          price: chapter.price,
          currency: chapter.currency,
          likes: chapter.likes || 0,
          views: chapter.views || 0,
          commentNumber: chapter.commentNumber || 0,
          isAvailable: true,
          isFree: chapter.isFree,
          isInCart: chapter.isInCart || false,
          isPurchased:
            chapter.isFree || chapter.usersWithAccess?.includes(userId),
          hasLiked: chapter.likedBy?.includes(userId),
          hasViewed: chapter.viewedBy?.includes(userId),
          isDownloaded: isDownloaded, // Add this line to track download status
        };
      });

      setChapters(mappedChapters);
    } catch (error) {
      console.error("Error fetching chapters:", error.message);
      setError(error.message || "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  };

  // Automatically refetch chapters when Tome or Language changes
  useEffect(() => {
    if (selectedTome && selectedComic) {
      fetchChapters();
    }
  }, [selectedTome, selectedComic, selectedLanguage]);

  const toggleContentVisibility = (index) => {
    const chapter = chapters[index];
    if (!chapter.isAvailable) {
      showMessage(t("cart.chapter_not_available"), "warning");
      return;
    }

    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const toggleTextExpansion = (chapterId) => {
    const chapter = chapters.find((ch) => ch.id === chapterId);
    if (chapter && chapter.description.length > 100) {
      setExpandedText((prev) => ({
        ...prev,
        [chapterId]: !prev[chapterId],
      }));
    }
  };
  const handleAddToCart = async (chapterId) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.navigate("UserProfile", { screen: "LoginPage" });
        return false;
      }

      const isAlreadyInBasket = basket.some((item) => item.id === chapterId);

      if (isAlreadyInBasket) {
        await removeFromBasket(chapterId);
        return false;
      }

      const chapterToAdd = chapters.find((ch) => ch.id === chapterId);
      if (!chapterToAdd) {
        throw new Error("Chapter not found");
      }

      // Optimistically update UI
      setChapters((prevChapters) =>
        prevChapters.map((ch) =>
          ch.id === chapterId
            ? { ...ch, isInBasket: true, image: DEFAULT_IMAGES.inCart }
            : ch
        )
      );

      const result = await ApiService.addToCart(chapterId, token);

      if (result.success) {
        const updatedBasket = [
          ...basket,
          { ...chapterToAdd, currency: chapterToAdd.currency || "XAF" },
        ];
        setBasket(updatedBasket);
        setCartItemsCount(updatedBasket.length);
        const newTotalAmount = updatedBasket.reduce(
          (sum, chapter) => sum + (chapter.price?.value || chapter.price || 0),
          0
        );
        setTotalAmount(newTotalAmount);
        return true;
      } else {
        setChapters((prevChapters) =>
          prevChapters.map((ch) =>
            ch.id === chapterId ? { ...ch, isInBasket: false } : ch
          )
        );
        showMessage(t("cart.add_to_basket_error"), "error");
        return false;
      }
    } catch (error) {
      setChapters((prevChapters) =>
        prevChapters.map((ch) =>
          ch.id === chapterId ? { ...ch, isInBasket: false } : ch
        )
      );
      console.error("Error adding to cart:", error.message);
      showMessage(t("cart.add_to_basket_failed"), "error");
      return false;
    }
  };
  const getSafeImageSource = (imageUri, defaultImage) => {
    return imageUri && typeof imageUri === "object" && imageUri.uri
      ? imageUri
      : defaultImage;
  };
  const renderChapterCard = (chapter, index) => {
    const isDownloaded = downloadedChapters.has(chapter.id);
    const isFirstChapter = index === 0;
    const isPurchased = chapter.isFree || chapter.isPurchased;
    const isInBasket =
      chapter.isInCart || basket.some((item) => item.id === chapter.id);
    const userId = user?.userID;
    const hasLiked = likedChapters.has(chapter.id);
    const hasViewed = viewedChapters.has(chapter.id);
    const chapterImage = isPurchased
      ? DEFAULT_IMAGES.purchased
      : isInBasket
      ? DEFAULT_IMAGES.inCart
      : DEFAULT_IMAGES.logo;

    // Determine the button state
    let buttonState;
    if (isDownloaded) {
      buttonState = "READ";
    } else if (isPurchased || isFirstChapter) {
      buttonState = "DOWNLOAD";
    } else {
      buttonState = "BUY";
    }
    const handleButtonPress = async () => {
      try {
        switch (buttonState) {
          case "READ":
            // Open the downloaded chapter
            setSelectedChapterForReading(chapter.id);
            break;

          case "DOWNLOAD":
            // Download the chapter
            await handleDownloadClick(chapter.id);
            break;

          case "BUY":
            // Add to cart and show purchase modal
            const addedToCart = await handleAddToCart(chapter.id);
            if (addedToCart) {
              setIsPurchaseModalVisible(true);
            }
            break;
        }
      } catch (error) {
        console.error("Error handling button press:", error);
        showMessage("An error occurred. Please try again.", "error");
      }
    };
    const getSafeImageSource = (imageUri, defaultImage) => {
      return imageUri && typeof imageUri === "object" && imageUri.uri
        ? imageUri
        : defaultImage;
    };

    const handleLikeClick = async () => {
      await handleLike(chapter.id);
    };

    const handleViewClick = async () => {
      await handleViewChapter(chapter.id);
    };
    const DownloadProgress = ({ progress, isPaused, onTogglePause }) => {
      const circumference = 2 * Math.PI * 13;
      const strokeDashoffset = circumference - (progress / 100) * circumference;

      return (
        <TouchableOpacity
          onPress={onTogglePause}
          style={styles.downloadProgressContainer}
        >
          {/* Progress circle */}
          <View style={styles.progressCircle}>
            <svg width="30" height="30" viewBox="0 0 30 30">
              <circle
                cx="15"
                cy="15"
                r="13"
                fill="none"
                stroke="#EF7F1A"
                strokeWidth="2"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
          </View>

          {/* Pause/Resume icon in center */}
          {isPaused ? (
            <Image
              source={require("./../../../assets/scrollboxImg/ev.png")}
              style={styles.pauseImage}
            />
          ) : (
            <View style={styles.pauseIcon}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          )}
        </TouchableOpacity>
      );
    };
    const handleReadOrBuyClick = async () => {
      try {
        if (isPurchased || isFirstChapter) {
          const token = await AsyncStorage.getItem("userToken");
          if (!token) {
            navigation.navigate("UserProfile", { screen: "LoginPage" });
            return;
          }

          const selectedChapterData = {
            id: chapter.id,
            language: selectedLanguage,
          };

          await AsyncStorage.setItem(
            "selectedChapterForReading",
            JSON.stringify(selectedChapterData)
          );

          setTimeout(() => {
            setSelectedChapterForReading(chapter.id);
          }, 100);
        } else if (chapter.isDownloaded) {
          // If the chapter is downloaded, directly set it for reading
          setSelectedChapterForReading(chapter.id);
        } else {
          const addedToCart = await handleAddToCart(chapter.id);
          if (addedToCart) {
            setIsPurchaseModalVisible(true);
          }
        }
      } catch (error) {
        console.error("Error opening chapter:", error);
        Alert.alert(
          "Error",
          "There was an error opening the chapter. Please try again."
        );
      }
    };

    const handleDownloadClick = async (chapterId) => {
      try {
        handleDownloadStart(chapterId);

        const downloadUrl = `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/chapter/${chapterId}/${selectedLanguage}`;

        const downloadDir = `${FileSystem.cacheDirectory}downloads/`;
        await FileSystem.makeDirectoryAsync(downloadDir, {
          intermediates: true,
        });
        const fileUri = `${downloadDir}${chapterId}_${selectedLanguage}.cbz`;

        const downloadResumable = FileSystem.createDownloadResumable(
          downloadUrl,
          fileUri,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
          (downloadProgress) => {
            const progress =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            handleDownloadProgress(chapterId, progress, "Downloading...");
          }
        );

        const { uri } = await downloadResumable.downloadAsync();

        if (!uri) {
          throw new Error("Download failed");
        }

        // Extract and save chapter
        await extractAndSaveChapter(uri, chapterId);

        handleDownloadComplete(chapterId);
      } catch (error) {
        handleDownloadError(chapterId, error.message);
      }
    };

    const handleDownloadComplete = async (chapterId, uri) => {
      try {
        await saveDownloadedChapter(chapterId);
        setDownloadedChapters((prev) => new Set([...prev, chapterId]));

        // Extract the downloaded file
        const pages = await extractImagesFromCBZ(uri);
        if (pages.length > 0) {
          showMessage("Chapter downloaded successfully!", "success");
          // Set the chapter for reading automatically
          setSelectedChapterForReading(chapterId);
        } else {
          throw new Error("Failed to extract chapter content");
        }
      } catch (error) {
        console.error("Download completion error:", error);
        showMessage("Failed to process downloaded chapter", "error");
      }
    };
    const handleAddToBasket = async () => {
      if (isPurchased || isFirstChapter) {
        // For purchased items, toggle expansion
        toggleContentVisibility(index);
      } else if (!isFirstChapter) {
        // For non-purchased items, add to cart
        await handleAddToCart(chapter.id);
      }
    };

    return (
      <SafeAreaView key={chapter.id} style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => toggleContentVisibility(index)}
        >
          {expandedIndex === index ? (
            <View>
              <Image
                source={getSafeImageSource(
                  chapter.largeImage,
                  DEFAULT_IMAGES.large
                )}
                style={styles.topImage}
                defaultSource={DEFAULT_IMAGES.large}
                onError={() => {
                  console.warn(
                    `Large image load error for chapter ${chapter.id}`
                  );
                }}
              />
              <View style={styles.cardContent}>
                <Image
                  source={getSafeImageSource(
                    chapter.image,
                    DEFAULT_IMAGES.thumbnail
                  )}
                  style={styles.cardImage}
                  defaultSource={DEFAULT_IMAGES.thumbnail}
                  onError={() => {
                    console.warn(
                      `Thumbnail image load error for chapter ${chapter.id}`
                    );
                  }}
                />
                <View style={styles.textContainerRight}>
                  <Text style={styles.synopsisTitle}>{chapter.title}</Text>
                  <TouchableOpacity
                    onPress={() => toggleTextExpansion(chapter.id)}
                  >
                    <Text
                      style={[
                        styles.descriptionText,
                        !expandedText[chapter.id] && { maxHeight: 60 },
                      ]}
                      numberOfLines={expandedText[chapter.id] ? undefined : 3}
                    >
                      {chapter.description}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.statsContainer}>
                    {!isPurchased && !isFirstChapter && (
                      <Text style={styles.priceText}>
                        {chapter.price} {chapter.currency}
                      </Text>
                    )}
                  </View>
                  <View style={styles.iconsAndReadButtonContainer}>
                    <View style={styles.iconsRowOverlayContainer}>
                      <TouchableOpacity
                        onPress={() => setVisibleCommentForChapter(chapter.id)}
                        style={styles.iconContainer}
                      >
                        <Image
                          source={DEFAULT_IMAGES.comments}
                          style={styles.iconImage}
                        />
                        <Text style={styles.iconText}>
                          {chapter.commentNumber}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleLikeClick}
                        style={styles.iconContainer}
                      >
                        <Image
                          source={
                            hasLiked
                              ? DEFAULT_IMAGES.liked
                              : DEFAULT_IMAGES.likes
                          }
                          style={styles.iconImage}
                        />
                        <Text style={styles.iconText}>{chapter.likes}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleViewClick}
                        style={styles.iconContainer}
                      >
                        <Image
                          source={
                            hasViewed
                              ? DEFAULT_IMAGES.viewed
                              : DEFAULT_IMAGES.views
                          }
                          style={styles.iconImage}
                        />
                        <Text style={styles.iconText}>{chapter.views}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.readButton,
                        buttonState === "READ"
                          ? styles.freeChapterButton
                          : buttonState === "DOWNLOAD"
                          ? styles.downloadButton
                          : styles.paidChapterButton,
                      ]}
                      onPress={handleButtonPress}
                      disabled={
                        isDownloading &&
                        currentlyDownloadingChapter !== chapter.id
                      }
                    >
                      {buttonState === "READ" ? (
                        <Text style={styles.readButtonText}>Read</Text>
                      ) : buttonState === "DOWNLOAD" ? (
                        isDownloading &&
                        currentlyDownloadingChapter === chapter.id ? (
                          <DownloadProgress
                            progress={downloadProgress}
                            isPaused={isDownloadingPaused}
                            onTogglePause={() =>
                              handleDownloadClick(chapter.id)
                            }
                          />
                        ) : (
                          <Image
                            source={DEFAULT_IMAGES.download}
                            style={styles.downloadIcon}
                          />
                        )
                      ) : (
                        <Text style={styles.readButtonText}>Buy</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.cardContent}>
              <Image
                source={getSafeImageSource(
                  chapter.image,
                  DEFAULT_IMAGES.thumbnail
                )}
                style={styles.cardImage}
                defaultSource={DEFAULT_IMAGES.thumbnail}
                onError={() => {
                  console.warn(
                    `Collapsed image load error for chapter ${chapter.id}`
                  );
                }}
              />
              <View style={styles.iconsRow}>
                <TouchableOpacity
                  onPress={() => setVisibleCommentForChapter(chapter.id)}
                  style={styles.iconContainer}
                >
                  <Image
                    source={DEFAULT_IMAGES.comments}
                    style={styles.iconImage}
                  />
                  <Text style={styles.iconText}>{chapter.commentNumber}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLikeClick}
                  style={styles.iconContainer}
                >
                  <Image
                    source={
                      hasLiked ? DEFAULT_IMAGES.liked : DEFAULT_IMAGES.likes
                    }
                    style={styles.iconImage}
                  />
                  <Text style={styles.iconText}>{chapter.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleViewClick}
                  style={styles.iconContainer}
                >
                  <Image
                    source={
                      hasViewed ? DEFAULT_IMAGES.viewed : DEFAULT_IMAGES.views
                    }
                    style={styles.iconImage}
                  />
                  <Text style={styles.iconText}>{chapter.views}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.priceBasketContainer}>
                {!isPurchased && !isFirstChapter && (
                  <Text style={styles.priceText}>
                    {chapter.price} {chapter.currency}
                  </Text>
                )}
                <TouchableOpacity onPress={handleAddToBasket}>
                  <Image source={chapterImage} style={styles.addToBasketIcon} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBarContainer}>
        <View style={styles.navBar}>
          <View style={styles.leftSection}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                if ((tomes || []).length > 1) {
                  setDropdownVisible(!isDropdownVisible);
                }
              }}
            >
              <View style={styles.row}>
                <Image
                  source={DEFAULT_IMAGES.dropdown}
                  style={styles.downdrop}
                />
                <Text style={styles.navButtonText}>
                  {tomes.length > 0
                    ? `Tome ${
                        tomes.findIndex((tome) => tome._id === selectedTome) + 1
                      }`
                    : "Tome 1"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.navButton} onPress={navigateBack}>
            <Image
              source={DEFAULT_IMAGES.settings}
              style={styles.settingsIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown List for Tomes */}
      {isDropdownVisible && tomes.length > 1 && (
        <View style={styles.dropdownContainer}>
          <FlatList
            data={tomes}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  selectedTome === item._id && styles.selectedDropdownItem,
                ]}
                onPress={() => {
                  setSelectedTome(item._id); // Set the selected Tome ID
                  fetchChaptersByTome(item._id); // Fetch chapters using the actual Tome ID
                  setDropdownVisible(false); // Hide dropdown after selection
                }}
              >
                <Text style={styles.dropdownItemText}>Tome {index + 1}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <ImageBackground
        source={DEFAULT_IMAGES.background}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {loading ? (
          <Loader visible={loading} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error === "TIMEOUT"
                ? "Network error. Please check your internet connection."
                : "Unable to load chapters. Please try again later."}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchChapters}
            >
              <Text style={styles.retryButtonText}>{t("general.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.cardList}>
            {chapters.map((chapter, index) =>
              renderChapterCard(chapter, index)
            )}
          </ScrollView>
        )}
      </ImageBackground>

      {visibleCommentForChapter && (
        <CommentSection
          chapterId={visibleCommentForChapter}
          closeComments={() => setVisibleCommentForChapter(null)}
          onCommentCountChange={(newCount) =>
            handleCommentCountChange(visibleCommentForChapter, newCount)
          }
        />
      )}

      {/* Purchase Modal */}
      {isPurchaseModalVisible && (
        <PurchaseModal
          isPurchaseModalVisible={isPurchaseModalVisible}
          setIsPurchaseModalVisible={setIsPurchaseModalVisible}
          basket={basket}
          setBasket={setBasket}
          totalAmount={totalAmount}
          setTotalAmount={setTotalAmount}
          setCartItemsCount={setCartItemsCount}
          showMessage={showMessage}
          selectedLanguage={selectedLanguage}
          setPaymentLink={setPaymentLink}
        />
      )}
      {/* WebView for payment */}
      {paymentLink && (
        <Modal
          visible={!!paymentLink}
          animationType="slide"
          onRequestClose={() => setPaymentLink(null)}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => setPaymentLink(null)}
              style={{
                padding: 15,
                alignItems: "flex-end",
                backgroundColor: "#f0f0f0",
              }}
            >
              <Text style={{ color: "red", fontSize: 16 }}>
                {t("general.close")}
              </Text>
            </TouchableOpacity>
            <WebView
              source={{ uri: paymentLink }}
              style={{ flex: 1 }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
          </SafeAreaView>
        </Modal>
      )}
      {selectedChapterForReading && (
        <Modal
          visible={selectedChapterForReading !== null}
          animationType="fade"
          onRequestClose={() => setSelectedChapterForReading(null)}
        >
          <ChapterReader
            chapterId={selectedChapterForReading}
            onClose={() => {
              setSelectedChapterForReading(null); // Close the reader
              navigation.navigate("ChapterScreen"); // Ensure navigation back to this screen
            }}
            nextChapterId={nextChapterId ?? null}
            previousChapterId={previousChapterId ?? null}
            nextChapterPurchased={purchasedChapters.includes(
              nextChapterId ?? ""
            )}
            language={selectedLanguage}
          />
        </Modal>
      )}

      <MessageModal
        visible={isMessageModalVisible}
        message={messageModalMessage}
        type={messageModalType}
        onClose={closeMessageModal}
      />
      {!visibleCommentForChapter && <FloatingBasketButton />}
    </SafeAreaView>
  );
};
export default ChapterScreen;

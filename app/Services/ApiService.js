import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../Pages/locales/i18n";
import * as FileSystem from "expo-file-system";
const BASE_URL =
  "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api";
const API_BASE_URL = BASE_URL;
const handleApiError = (error, customMessage) => {
  console.error(`API Error: ${customMessage}`, {
    message: error?.response?.data || error.message,
    status: error?.response?.status,
    details: error,
  });
  // Handle specific HTTP status codes
  switch (error?.response?.status) {
    case 401:
      throw new Error(i18n.t("errors.auth_required"));
    case 403:
      throw new Error(i18n.t("errors.permission_denied"));
    case 404:
      throw new Error(i18n.t("errors.not_found"));
    case 422:
      throw new Error(i18n.t("errors.invalid_data"));
    default:
      throw new Error(customMessage || i18n.t("errors.unexpected_error"));
  }
};
const ApiService = {
  userLogin: async (credentials) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/login`, credentials, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const token = response.data?.token;

      if (token) {
        await AsyncStorage.setItem("userToken", token); // Store the token
        console.log("Login successful. Token saved:", token);
        return response.data;
      } else {
        throw new Error("No token returned from API.");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      throw (
        error.response?.data || new Error("Login failed. Please try again.")
      );
    }
  },
  getChaptersByLanguage: async (tomeId, language, token) => {
    try {
      if (!tomeId) {
        throw new Error("Tome ID is required to fetch chapters.");
      }

      console.log("(NOBRIDGE) LOG Fetching Chapters for Tome ID:", tomeId);

      const response = await axios.get(
        `${BASE_URL}/chapters/${tomeId}/${language}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "(NOBRIDGE) LOG Chapters fetched successfully:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching chapters by language:", error.message);

      // Show user-friendly error alerts
      if (error.response?.status === 401) {
        Alert.alert(
          "Authorization Error",
          "Your session has expired. Please log in again.",
          [
            {
              text: "Login",
              onPress: () => {
                // Navigate to login screen
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else if (error.response?.status === 404) {
        Alert.alert(
          "Not Found",
          "Chapters not found for the selected tome and language."
        );
      } else if (error.response?.status >= 500) {
        Alert.alert(
          "Server Error",
          "We are currently experiencing issues. Please try again later."
        );
      } else {
        Alert.alert(
          "Unexpected Error",
          "Something went wrong while fetching chapters. Please try again."
        );
      }

      // Throw error for the caller function to handle
      throw new Error("Failed to fetch chapters.");
    }
  },

  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  getCurrentUser: async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  createUser: async (userData) => {
    try {
      const { name, email, password } = userData; // Ensure only these fields are included

      console.log("🛠️ Sending API Request with payload:", {
        name,
        email,
        password,
      }); // Debug log

      const response = await axios.post(
        `${BASE_URL}/user/create`,
        { name, email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ User created successfully:", response.data.message);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Error creating user:",
        error.response?.data || error.message
      );
      throw (
        error.response?.data || new Error("Signup failed. Please try again.")
      );
    }
  },

  updateUser: async (id, userData, token) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/user/update`,
        {
          id,
          ...userData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Chapter APIs
  createChapter: async (chapterData, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/chapter/create`,
        chapterData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  likeChapter: async (chapterId, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/chapter/like/${chapterId}`,
        {}, // Empty body for the like request
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Chapter liked successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error liking chapter:",
        error.response?.data || error.message
      );
      handleApiError(error);
    }
  },

  // Fetch chapters by specific tomeId and language
  getChaptersByTomeId: async (tomeId, language, token) => {
    try {
      const response = await axios.get(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/chapters/${tomeId}/${language}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching chapters:", error.message);
      throw new Error("Failed to fetch chapters");
    }
  },

  getChaptersByTomeAndLanguage: async (tomeId, language, token) => {
    try {
      const response = await fetch(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/chapters/${tomeId}?lang=${language}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorMessage = `Error: ${response.status} - ${response.statusText}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("API call error:", error.message);
      throw error;
    }
  },

  getCurrentUserAndStoreId: async () => {
    try {
      // Retrieve the token from AsyncStorage
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authorization token not found. Please log in.");
      }

      // API call to fetch current user details
      const response = await axios.get(`${BASE_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const userId = response?.data?.user?._id;
      if (!userId) {
        throw new Error("User ID not found in the response.");
      }

      // Store the user ID in AsyncStorage
      await AsyncStorage.setItem("userId", userId);
      console.log(`User ID stored successfully: ${userId}`);

      return userId;
    } catch (error) {
      console.error("Error fetching and storing user ID:", error.message);
      throw error;
    }
  },

  getChapterContent: async (chapterId, language = "en", token) => {
    try {
      const url = `${BASE_URL}/chapter/${chapterId}/${language}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Chapter content fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching chapter content:", error.message);
      throw error;
    }
  },

  getChapterById: async (chapterId, token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chapter/${chapterId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  updateChapter: async (id, chapterData, token) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/chapter/update`,
        {
          id,
          ...chapterData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteChapter: async (chapterId, token) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/chapter/delete`, {
        data: { id: chapterId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  createChapter: async (chapterData, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/chapter/create`,
        chapterData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error creating chapter:",
        error.response?.data || error.message
      );
      handleApiError(error);
    }
  },
  // Notifications APIs
  createGlobalNotification: async (notificationData, token) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/notification/create`,
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  markNotificationAsRead: async (notificationId, token) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/notification/read`,
        { id: notificationId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  getNotificationsByUserId: async (userId, token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: { userId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  getComics: async (language) => {
    try {
      const response = await axios.get(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/comics",
        { params: { language } }
      );

      const comics = response.data || [];

      // Log all fetched comic IDs
      console.log(
        "(NOBRIDGE) LOG  All Fetched Comic IDs:",
        comics.map((comic) => comic._id)
      );

      return comics;
    } catch (error) {
      console.error("Error fetching comics:", error.message);
      throw new Error("Failed to fetch comics");
    }
  },

  getTomesByComicId: async (comicId, language) => {
    try {
      const response = await axios.get(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/tome/${comicId}`,
        { params: { language } }
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching tomes:", error.message);
      throw new Error("Failed to fetch tomes");
    }
  },

  getTomeById: async (tomeId, token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tome/${tomeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("✅ Tome fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Error fetching tome:",
        error.response?.data || error.message
      );
      throw error.response?.data || new Error("Failed to fetch tome.");
    }
  },
  // Fetch chapters without requiring a token
  getTomes: async () => {
    try {
      const response = await fetch(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/tomes",
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch tomes");

      return await response.json();
    } catch (error) {
      console.error("Error fetching tomes:", error.message);
      throw error;
    }
  },
  forgotPassword: async (email) => {
    console.log("Initiating password reset request for email:", email);

    try {
      const response = await fetch(`${API_BASE_URL}/user/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Password reset API Response status:", response.status);

      const responseData = await response.json();
      console.log("Password reset API Response:", responseData);

      // Log the reset link if it exists in the response
      if (responseData.resetLink) {
        console.log("Password Reset Link:", responseData.resetLink);
      }

      if (responseData.token) {
        console.log("Reset Token:", responseData.token);
      }

      if (!response.ok) {
        console.error("API Error Response:", responseData);
        throw new Error(
          responseData.message || "Failed to send reset password email"
        );
      }

      // Log success message and any additional data
      console.log("Password reset email sent successfully");
      console.log("Response Data:", {
        message: responseData.message,
        timestamp: new Date().toISOString(),
        email: email,
        // Don't log sensitive information like tokens in production
        ...(process.env.NODE_ENV !== "production" && {
          fullResponse: responseData,
        }),
      });

      return responseData;
    } catch (error) {
      console.error("Forgot Password API Error:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        email: email,
      });
      throw error;
    }
  },

  resetPassword: async (resetToken, password) => {
    try {
      const response = await fetch(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/user/reset-password/${resetToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Comment APIs
  getCommentsByChapterId: async (chapterId, token) => {
    try {
      const response = await axios.get(`${BASE_URL}/comments/${chapterId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      handleApiError(error, "Failed to fetch comments");
    }
  },

  createComment: async (commentData, token) => {
    try {
      console.log("Sending new comment data:", commentData); // Log the data being sent
      console.log("Using token:", token); // Log the token

      const response = await axios.post(
        `${API_BASE_URL}/comment/create`, // Endpoint for creating comments
        commentData, // The comment data (e.g., content and chapterId)
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Comment created successfully:", response.data); // Log the created comment
      return response.data; // Return the response for further use
    } catch (error) {
      console.error(
        "Error creating comment:",
        error.response?.data || error.message
      ); // Log backend error or general message
      handleApiError(error); // Centralized error handling
    }
  },
  // Tome APIs
  getCharacters: async (language = "en", token) => {
    try {
      const response = await axios.get(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/characters/6777db450b6da22352a976be/${language}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Characters fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching characters:",
        error.response?.data || error.message
      );
      handleApiError(error);
    }
  },

  // Create a new character
  createCharacter: async (characterData, token) => {
    try {
      const formData = new FormData();
      Object.keys(characterData).forEach((key) => {
        if (characterData[key] instanceof File) {
          formData.append(key, characterData[key]);
        } else {
          formData.append(key, characterData[key]);
        }
      });

      const response = await axios.post(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/character/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Character created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error creating character:",
        error.response?.data || error.message
      );
      handleApiError(error);
    }
  },
  getGlossaryTerms: async (language = "en") => {
    try {
      const response = await axios.get(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/terms/${language}`
      );
      console.log("Glossary terms fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching glossary terms:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  // Update to ApiService for character GET and POST methods
  getCharacterById: async (characterId, language, token) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/characters/${characterId}/${language}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Character fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching character:",
        error.response?.data || error.message
      );
      handleApiError(error);
    }
  },

  // Create character with language-specific support
  createCharacter: async (characterData, language, token) => {
    try {
      const formData = new FormData();
      Object.keys(characterData).forEach((key) => {
        if (characterData[key] instanceof File) {
          formData.append(key, characterData[key]);
        } else {
          formData.append(key, JSON.stringify(characterData[key]));
        }
      });

      const response = await axios.post(
        `${API_BASE_URL}/characters/${language}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Character created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error creating character:",
        error.response?.data || error.message
      );
      handleApiError(error);
    }
  },

  // Get characters by comic ID with language support
  getCharactersByComic: async (
    comicId = "6777db450b6da22352a976be",
    { language = "en", token }
  ) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/characters/${comicId}/${language}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Characters fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching characters:",
        error.response?.data || error.message
      );
      handleApiError(error);
    }
  },

  createTransaction: async (transactionData, token) => {
    try {
      console.log(
        "🔄 API: Initiating transaction with payload:",
        transactionData
      );

      const response = await axios.post(
        `${BASE_URL}/transaction/create`,
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ Transaction API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Error creating transaction:",
        error.response?.data || error.message
      );
      handleApiError(error);
    }
  },

  getTransactions: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/transactions`);
      console.log("Transactions fetched successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching transactions:", error.message);
      throw new Error("Failed to fetch transactions");
    }
  },

  getChapterContent: async (chapterId) => {
    try {
      // Retrieve the user's token from AsyncStorage
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("User token not found. Please log in again.");
      }

      // Get the current language from i18n
      const language = i18n.language || "en";

      // Construct the API endpoint
      const apiUrl = `${BASE_URL}/chapter/${chapterId}/${language}`;
      console.log("🛠️ API Call Details:");
      console.log(`📍 Endpoint: ${apiUrl}`);
      console.log("🔑 Method: GET");
      console.log(`🔒 Authorization Token: Bearer ${token}`);

      // Make the API call using axios with the token in headers
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      // Log the API response
      console.log("✅ API Response:", response.data);

      if (!response.data?.signedUrl) {
        throw new Error("❌ Missing signed URL in the response.");
      }

      return response.data;
    } catch (error) {
      console.error(
        "❌ Error fetching chapter content:",
        error.response?.data || error.message
      );
      throw (
        error.response?.data || new Error("Failed to fetch chapter content.")
      );
    }
  },
  getFromCache: async (chapterId) => {
    try {
      console.log(`Checking cache for chapter ${chapterId}`);

      // Define cache key
      const cacheKey = `chapter_${chapterId}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        console.log("No cached data found for chapter:", chapterId);
        return null;
      }

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      console.log("Cache age:", {
        hours: Math.round(age / (1000 * 60 * 60)),
        expired: age > CACHE_EXPIRY,
      });

      // Check if cache has expired
      if (age > CACHE_EXPIRY) {
        console.log("Cache expired, removing:", cacheKey);
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      console.log("Valid cached data found for chapter:", chapterId);
      return data;
    } catch (error) {
      console.warn("Cache retrieval error:", {
        chapterId,
        error: error.message,
      });
      return null;
    }
  },

  cleanupStorage: async () => {
    try {
      console.log("Starting storage cleanup");

      // Clean AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const chapterKeys = keys.filter((key) => key.startsWith("chapter_"));
      console.log(`Found ${chapterKeys.length} cached chapters to clean`);

      await AsyncStorage.multiRemove(chapterKeys);

      // Clean FileSystem cache
      const cacheDir = FileSystem.cacheDirectory;
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const tempDirs = files.filter((file) => file.startsWith("temp_"));
      console.log(`Found ${tempDirs.length} temporary directories to clean`);

      for (const dir of tempDirs) {
        console.log(`Cleaning directory: ${dir}`);
        await FileSystem.deleteAsync(`${cacheDir}${dir}`, { idempotent: true });
      }

      console.log("Storage cleanup completed successfully");
    } catch (error) {
      console.warn("Cleanup error:", {
        message: error.message,
        stack: error.stack,
      });
    }
  },

  cleanupChapterFiles: async (chapterId) => {
    try {
      console.log(`Starting cleanup for chapter ${chapterId}`);

      // Define the temporary directory for the chapter
      const tempDir = `${FileSystem.cacheDirectory}temp_${chapterId}/`;
      await FileSystem.deleteAsync(tempDir, { idempotent: true });

      console.log(`Successfully cleaned up files for chapter ${chapterId}`);
    } catch (error) {
      console.warn("Chapter cleanup error:", {
        chapterId,
        error: error.message,
        stack: error.stack,
      });
    }
  },

  createTransaction: async (transactionData, token) => {
    try {
      console.log("🔄 Initiating transaction with data:", transactionData);

      // Make the transaction request to the backend
      const response = await axios.post(
        `${BASE_URL}/transaction/create`,
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Transaction created successfully:", response.data);

      const paymentLink =
        response.data?.paymentUrl || response.data?.data?.link;

      if (!paymentLink) {
        throw new Error("Payment link not provided by the server");
      }

      return {
        success: true,
        paymentUrl: paymentLink,
        transactionId: response.data?.transactionId,
      };
    } catch (error) {
      console.error("❌ Error creating transaction:", error.message);

      // Handle specific errors and user feedback
      if (error.response?.status === 401) {
        Alert.alert("Session Expired", "Please log in again to proceed.");
      } else if (error.response?.status === 400) {
        Alert.alert(
          "Transaction Error",
          "Invalid transaction data. Please try again."
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to create transaction. Please try again later."
        );
      }

      handleApiError(error, "Failed to create transaction.");
    }
  },

  verifyChapter: async (chapterId, token) => {
    try {
      const response = await axios.get(`${BASE_URL}/chapters/${chapterId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      return response.data && response.data.id ? true : false;
    } catch (error) {
      console.error("Chapter verification error:", error);
      return false;
    }
  },

  addToCart: async (chapterId, token) => {
    if (!chapterId) throw new Error("Chapter ID is required");
    try {
      const response = await axios.post(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/cart/add/${chapterId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return {
        success: true,
        chapters: response.data.chapters || [],
        totalPrice: response.data.totalPrice || 0,
        currency: response.data.currency || "XAF",
      };
    } catch (error) {
      console.error(
        "Error adding chapter to cart:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Failed to add chapter to cart"
      );
    }
  },
  removeFromCart: async (chapterId, token) => {
    if (!chapterId) throw new Error("Chapter ID is required");
    try {
      const response = await axios.delete(
        `https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/cart/remove/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return {
        chapters: response.data.chapters || [],
        totalPrice: response.data.totalPrice || 0,
        currency: response.data.currency || "XAF",
      };
    } catch (error) {
      console.error(
        "Error removing chapter from cart:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Failed to remove chapter from cart"
      );
    }
  },
  getCart: async (token) => {
    if (!token) {
      throw new Error("User is not authenticated");
    }
    try {
      const response = await axios.get(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return {
        chapters: response.data.chapters || [],
        totalPrice: response.data.totalPrice || 0,
        currency: response.data.currency || "XAF",
        contentCount: response.data.chapters?.length || 0,
      };
    } catch (error) {
      console.error("Error fetching cart:", error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch cart");
    }
  },

  clearCartById: async (chapterId, token) => {
    if (!chapterId) throw new Error("Chapter ID is required");

    try {
      const response = await axios.delete(
        `${BASE_URL}/cart/remove/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Chapter removed successfully:", response.data);
      return {
        chapters: response.data.chapters || [],
        totalPrice: response.data.totalPrice || 0,
        currency: response.data.currency || "XAF",
      };
    } catch (error) {
      console.error("Error removing chapter from cart:", error.message);
      throw new Error(
        error.response?.data?.message || "Failed to remove chapter from cart"
      );
    }
  },

  clearCart: async (token) => {
    try {
      if (!token) throw new Error("Authorization token is required");

      const response = await axios.delete(`${BASE_URL}/cart/clear`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Cart cleared successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "❌ Error clearing cart:",
        error.response?.data || error.message
      );
      throw new Error("Failed to clear cart");
    }
  },

  // Update the createTransaction method
  createTransaction: async (transactionData, token) => {
    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      console.log("🔄 Creating transaction with payload:", transactionData);

      const response = await axios.post(
        `${BASE_URL}/transaction/create`,
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const paymentLink = response.data?.data?.data?.link;

      if (!paymentLink) {
        throw new Error("Payment link not provided by the server");
      }

      console.log("✅ Transaction created successfully:", response.data);
      return {
        success: true,
        link: paymentLink,
      };
    } catch (error) {
      console.error(
        "❌ Error creating transaction:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Failed to create transaction"
      );
    }
  },

  createPayPalTransaction: async (transactionData, token) => {
    if (!token) {
      throw new Error("Authentication required");
    }

    if (!transactionData?.chapterIds?.length) {
      throw new Error("No chapters selected for purchase");
    }

    if (!transactionData.amount || transactionData.amount <= 0) {
      throw new Error("Invalid transaction amount");
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/transaction/create/?method=paypal`,
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
          retry: 2,
          retryDelay: 1000,
        }
      );

      if (!response?.data?.data?.links) {
        throw new Error("Invalid response format from payment server");
      }

      const paypalLink = response.data.data.links.find(
        (link) => link.rel === "approval_url"
      )?.href;

      if (!paypalLink) {
        throw new Error("Payment URL not found in response");
      }

      return {
        success: true,
        paymentUrl: paypalLink,
        transactionId: response.data.data.id,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        switch (error.response?.status) {
          case 401:
            throw new Error("Session expired - please log in again");
          case 404:
            throw new Error("Cart not found - please try again");
          case 400:
            throw new Error(
              error.response.data.message || "Invalid request data"
            );
          case 422:
            throw new Error("Invalid payment information");
          case 500:
            throw new Error("Payment service temporarily unavailable");
          default:
            throw new Error("Payment processing failed - please try again");
        }
      }

      if (error.code === "ECONNABORTED") {
        throw new Error(
          "Payment request timed out - please check your connection"
        );
      }

      throw new Error(
        error.message || "An unexpected error occurred while processing payment"
      );
    }
  },
};
export default ApiService;

// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const AuthContext = createContext();

export default AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.multiGet([
        "token",
        "email",
        "userName",
        "userID",
        "countryCode",
        "userRole",
      ]);

      const data = {
        token: storedData[0][1],
        email: storedData[1][1],
        name: storedData[2][1],
        id: storedData[3][1],
        countryCode: storedData[4][1] || "CM", // Default to CM if not set
        role: storedData[5][1],
      };

      if (data.token && data.id) {
        setUser(data);
        console.log("Loaded user data:", data);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Update the login function to ensure countryCode is properly saved
  const login = async (userData) => {
    try {
      await AsyncStorage.multiSet([
        ["token", userData.token],
        ["email", userData.email],
        ["userName", userData.name],
        ["userID", userData.id],
        ["countryCode", userData.countryCode || "CM"], // Ensure countryCode is saved
        ["userRole", userData.role],
      ]);

      setUser({
        ...userData,
        countryCode: userData.countryCode || "CM",
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };
  const updateCountryCode = async (countryCode) => {
    try {
      await AsyncStorage.setItem("countryCode", countryCode);
      setUser((prev) => ({
        ...prev,
        countryCode,
      }));
      console.log("Country code updated to:", countryCode);
    } catch (error) {
      console.error("Error updating country code:", error);
    }
  };
  const logout = async () => {
    try {
      // Clear all AsyncStorage data
      await AsyncStorage.multiRemove([
        "token",
        "email",
        "userName",
        "userID",
        "countryCode",
        "userRole",
        "loginTime",
      ]);

      // Clear context state
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUser = async (updates) => {
    try {
      // Update AsyncStorage with new values
      const updatePromises = [];
      if (updates.email) {
        updatePromises.push(AsyncStorage.setItem("email", updates.email));
      }
      if (updates.name) {
        updatePromises.push(AsyncStorage.setItem("userName", updates.name));
      }
      if (updates.countryCode) {
        updatePromises.push(
          AsyncStorage.setItem("countryCode", updates.countryCode)
        );
      }
      if (updates.role) {
        updatePromises.push(AsyncStorage.setItem("userRole", updates.role));
      }

      await Promise.all(updatePromises);

      // Update context state
      setUser((prev) => ({
        ...prev,
        ...updates,
      }));
    } catch (error) {
      console.error("Update user error:", error);
    }
  };

  const refreshUserData = async () => {
    if (!user?.token) return;

    try {
      const response = await axios.get(
        "https://q1x8l0qpnb.execute-api.eu-west-3.amazonaws.com/production/api/user",
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      const userData = response.data.user;
      await login({
        token: user.token,
        email: userData.email,
        name: userData.name,
        id: userData._id,
        countryCode: userData.countryCode,
        role: userData.role,
      });
    } catch (error) {
      console.error("Refresh user data error:", error);
      // If token is invalid, log out the user
      if (error.response?.status === 401) {
        await logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        updateCountryCode,
        // ... other methods
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

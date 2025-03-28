// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const AuthContext = createContext();

export default AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data from AsyncStorage when app starts
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const email = await AsyncStorage.getItem("email");
        const userName = await AsyncStorage.getItem("userName");
        const userID = await AsyncStorage.getItem("userID");
        const countryCode = await AsyncStorage.getItem("countryCode");
        const userRole = await AsyncStorage.getItem("userRole");

        console.log("Stored Data in AsyncStorage:", {
          token,
          email,
          userName,
          userID,
          countryCode,
          userRole,
        });

        if (token && userID) {
          setUser({
            token,
            email,
            name: userName,
            id: userID,
            countryCode,
            role: userRole,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Update the login function to ensure countryCode is properly saved
  const login = async (userData) => {
    try {
      // Make sure countryCode is included in the stored data
      await AsyncStorage.multiSet([
        ["token", userData.token],
        ["email", userData.email],
        ["userName", userData.name],
        ["userID", userData.id],
        ["countryCode", userData.countryCode || "CM"], // Default to "CM" if not provided
        ["userRole", userData.role],
        ["loginTime", Date.now().toString()],
      ]);

      // Update context state with the countryCode
      setUser({
        token: userData.token,
        email: userData.email,
        name: userData.name,
        id: userData.id,
        countryCode: userData.countryCode || "CM", // Default to "CM"
        role: userData.role,
      });

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
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
        logout,
        updateUser,
        refreshUserData,
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

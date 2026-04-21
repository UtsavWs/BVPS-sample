// AuthContext - Simple authentication context for the app

import { createContext, useState, useEffect, useMemo } from "react";
import { apiPost, apiGet, apiPut } from "../api/api";

// Create the context - this is what components will use to access auth
export const AuthContext = createContext(null);

// Storage keys - where we save token and user in browser
const TOKEN_KEY = "bpvs_token";
const USER_KEY = "bpvs_user";

// Decode a JWT's payload and check the `exp` claim. Fail-closed: any parse
// error or missing `exp` is treated as expired so we never trust a bad token.
const isTokenExpired = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(padded));
    if (typeof exp !== "number") return true;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

// The AuthProvider component wraps your app and provides auth functionality
export function AuthProvider({ children }) {
  // User state - holds the logged in user's information
  const [user, setUser] = useState(null);

  // Token state - holds the authentication token
  const [token, setToken] = useState(null);

  // isInitializing state - true while checking if user is already logged in (app startup)
  const [isInitializing, setIsInitializing] = useState(true);

  // isProcessing state - true during login, register, etc.
  const [isProcessing, setIsProcessing] = useState(false);

  // Error state - holds any error messages
  const [error, setError] = useState(null);

  // Run this once when the app starts - check if user is already logged in
  useEffect(() => {
    checkLoggedIn();
  }, []);

  // Read from localStorage first (persistent) then sessionStorage (tab-only).
  // Returns the storage object that actually held the value, so writes go
  // back to the same place and we don't accidentally promote a session-only
  // login into a persistent one.
  const readAuthStorage = () => {
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken) {
      return {
        token: localToken,
        user: localStorage.getItem(USER_KEY),
        storage: localStorage,
      };
    }
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) {
      return {
        token: sessionToken,
        user: sessionStorage.getItem(USER_KEY),
        storage: sessionStorage,
      };
    }
    return { token: null, user: null, storage: null };
  };

  const clearAuthStorage = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  };

  // Function to check if user is already logged in
  const checkLoggedIn = async () => {
    const { token: storedToken, user: storedUser, storage } = readAuthStorage();

    if (storedToken && storedUser) {
      if (isTokenExpired(storedToken)) {
        clearAuthStorage();
        setIsInitializing(false);
        return;
      }
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Verify token with server
        try {
          const res = await apiGet("/users/profile", storedToken);
          if (res.success) {
            setUser(res.data.user);
            storage.setItem(USER_KEY, JSON.stringify(res.data.user));
          } else {
            // Token invalid, clear storage
            clearAuthStorage();
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.warn("Could not verify token:", err);
        }
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        clearAuthStorage();
      }
    }
    setIsInitializing(false);
  };

  // Function to login user
  const login = async (email, password, rememberMe = false) => {
    setError(null);
    setIsProcessing(true);
    try {
      const res = await apiPost("/auth/login", { email, password, rememberMe });

      if (res.success) {
        const { token: newToken, user: userData } = res.data;

        // Clear any stale entries in the *other* storage so we don't end up
        // with both a local and a session token for the same user.
        clearAuthStorage();
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, newToken);
        storage.setItem(USER_KEY, JSON.stringify(userData));

        setToken(newToken);
        setUser(userData);

        return { success: true, user: userData };
      } else {
        setError(res.message);
        return {
          success: false,
          message: res.message,
          status: res.data?.user?.status,
        };
      }
    } catch (err) {
      const errorMsg = "Network error. Please try again.";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to register new user
  const register = async (userData) => {
    setError(null);
    setIsProcessing(true);
    try {
      const res = await apiPost("/auth/register", userData);

      if (res.success) {
        return { success: true, message: res.message, email: userData.email };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const errorMsg = "Network error. Please try again.";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to verify OTP
  const verifyOtp = async (email, otp) => {
    setError(null);
    setIsProcessing(true);
    try {
      const res = await apiPost("/auth/verify-otp", { email, otp });

      if (res.success) {
        return { success: true, message: res.message };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const errorMsg = "Network error. Please try again.";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to resend OTP
  const resendOtp = async (email) => {
    setError(null);
    try {
      const res = await apiPost("/auth/resend-otp", { email });

      if (res.success) {
        return { success: true, message: res.message };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const errorMsg = "Network error. Please try again.";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Function to logout user
  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Function to update user profile
  const updateUser = async (updates) => {
    if (!token) {
      return { success: false, message: "Not authenticated" };
    }

    try {
      const res = await apiPut("/users/profile", updates, token);

      if (res.success) {
        const updatedUser = { ...user, ...res.data.user };
        setUser(updatedUser);
        const { storage } = readAuthStorage();
        (storage || localStorage).setItem(
          USER_KEY,
          JSON.stringify(updatedUser),
        );
        return { success: true, user: updatedUser };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const errorMsg = "Failed to update profile. Please try again.";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Provide all these functions and states to child components
  const value = useMemo(
    () => ({
      user,
      token,
      isInitializing,
      isProcessing,
      loading: isInitializing, // Keep alias for backward compatibility
      error,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === "admin",
      isSubadmin: user?.role === "subadmin",
      isStaff: user?.role === "admin" || user?.role === "subadmin",
      isApproved: user?.status === "active",
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      updateUser,
      clearError: () => setError(null),
    }),
    [user, token, isInitializing, isProcessing, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

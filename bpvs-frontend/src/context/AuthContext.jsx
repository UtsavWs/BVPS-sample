// AuthContext - Simple authentication context for the app
// This provides user login, logout, and registration functionality

import { createContext, useState, useEffect, useMemo } from 'react';
import { apiPost, apiGet, apiPut } from '../api/api';

// Create the context - this is what components will use to access auth
export const AuthContext = createContext(null);

// Storage keys - where we save token and user in browser
const TOKEN_KEY = 'bpvs_token';
const USER_KEY = 'bpvs_user';

// The AuthProvider component wraps your app and provides auth functionality
export function AuthProvider({ children }) {
  // User state - holds the logged in user's information
  const [user, setUser] = useState(null);

  // Token state - holds the authentication token
  const [token, setToken] = useState(null);

  // Loading state - true while checking if user is already logged in
  const [loading, setLoading] = useState(true);

  // Error state - holds any error messages
  const [error, setError] = useState(null);

  // Run this once when the app starts - check if user is already logged in
  useEffect(() => {
    checkLoggedIn();
  }, []);

  // Function to check if user is already logged in
  const checkLoggedIn = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Verify token with server
        try {
          const res = await apiGet('/users/profile', storedToken);
          if (res.success) {
            setUser(res.data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.warn('Could not verify token:', err);
        }
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  };

  // Function to login user
  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost('/auth/login', { email, password });

      if (res.success) {
        const { token: newToken, user: userData } = res.data;

        // Save to localStorage
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));

        setToken(newToken);
        setUser(userData);

        return { success: true, user: userData };
      } else {
        setError(res.message);
        return {
          success: false,
          message: res.message,
          status: res.inactive ? "inactive" : res.data?.user?.status,
        };
      }
    } catch (err) {
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Function to register new user
  const register = async (userData) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost('/auth/register', userData);

      if (res.success) {
        return { success: true, message: res.message, email: userData.email };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Function to verify OTP
  const verifyOtp = async (email, otp) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiPost('/auth/verify-otp', { email, otp });

      if (res.success) {
        return { success: true, message: res.message };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Function to resend OTP
  const resendOtp = async (email) => {
    setError(null);
    try {
      const res = await apiPost('/auth/resend-otp', { email });

      if (res.success) {
        return { success: true, message: res.message };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const errorMsg = 'Network error. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Function to logout user
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Function to update user profile
  const updateUser = async (updates) => {
    if (!token) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const res = await apiPut('/users/profile', updates, token);

      if (res.success) {
        const updatedUser = { ...user, ...res.data.user };
        setUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        setError(res.message);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const errorMsg = 'Failed to update profile. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Provide all these functions and states to child components
  const value = useMemo(() => ({
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isApproved: user?.status === 'active',
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    updateUser,
    clearError: () => setError(null),
  }), [user, token, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

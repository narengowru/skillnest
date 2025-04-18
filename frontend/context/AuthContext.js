// context/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import { freelancerAPI } from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      fetchUserData(userId);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user data from backend
  const fetchUserData = async (userId) => {
    try {
      setLoading(true);
      const response = await freelancerAPI.getFreelancer(userId);
      setCurrentUser(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to authenticate. Please log in again.");
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await freelancerAPI.login(credentials);
      const { token, user } = response.data;
      
      // Save token and user ID to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      
      // Set current user
      setCurrentUser(user);
      setError(null);
      return user;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await freelancerAPI.register(userData);
      const { token, user } = response.data;
      
      // Save token and user ID to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user._id);
      
      // Set current user
      setCurrentUser(user);
      setError(null);
      return user;
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
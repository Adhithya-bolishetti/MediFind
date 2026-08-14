import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import api from '../services/api';
import doctorService from '../services/doctorService';
import userService from '../services/userService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetUser = async (currentToken) => {
    try {
      const userData = await authService.me();
      let isProfileComplete = false;

      if (userData.role === 'DOCTOR') {
        try {
          const status = await doctorService.getProfileStatus();
          isProfileComplete = status && status.status !== 'INCOMPLETE';
        } catch (e) {
          isProfileComplete = false;
        }
      } else if (userData.role === 'PATIENT') {
        try {
          const profile = await userService.getProfile(userData.id);
          // Assuming phone and gender are the minimum required fields for a completed patient profile
          isProfileComplete = !!(profile.phone && profile.gender);
        } catch (e) {
          isProfileComplete = false;
        }
      } else {
        isProfileComplete = true; // Admin or other roles
      }

      const fullUser = { ...userData, isProfileComplete };
      setUser(fullUser);
      return fullUser;
    } catch (e) {
      logout();
      throw e;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          await fetchAndSetUser(token);
        } catch (e) {
          // fetchAndSetUser handles logout on failure
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for unauthorized events to trigger logout
    const handleUnauthorized = () => logout();
    window.addEventListener('unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = async (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Explicitly fetch user so callers can await this and route appropriately
    return await fetchAndSetUser(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

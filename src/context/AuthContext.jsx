import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Authenticate user session with me endpoint on initial mount
  const checkAuthStatus = async () => {
    try {
      // Check if we can get user info (will try to silent refresh if accessToken is empty/expired)
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      // Not authenticated, token missing or refresh failed
      setUser(null);
      setIsAuthenticated(false);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();

    // Listen for logout events triggered by interceptor (e.g. on refresh token failure)
    const handleLogoutTriggered = () => {
      setUser(null);
      setIsAuthenticated(false);
      setAccessToken(null);
    };

    window.addEventListener('auth-logout-triggered', handleLogoutTriggered);
    return () => {
      window.removeEventListener('auth-logout-triggered', handleLogoutTriggered);
    };
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, ...userData } = response.data;
      setAccessToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAccessToken(null);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.roles.includes('SUPER_ADMIN') || user.permissions.includes(permission);
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

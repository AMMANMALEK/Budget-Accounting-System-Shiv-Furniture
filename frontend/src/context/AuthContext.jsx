import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log('🏁 AuthProvider: Initializing auth check...');
      try {
        // First try to get user from localStorage
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          console.log('🔍 AuthProvider: Found user in localStorage:', currentUser);
          setUser(currentUser);

          // Verify with backend to ensure token is still valid
          try {
            console.log('🔄 AuthProvider: Verifying token with backend...');
            const verifiedUser = await authService.fetchMe();
            console.log('✅ AuthProvider: Backend verification successful:', verifiedUser);
            // MERGE local storage token with verified user data if needed, or just use verified
            // verifiedUser from /me likely doesn't have the token, so we keep the token from local storage
            // But authService.fetchMe() returns what?
            // backend/routes/auth.js /me returns {id, email, role, name}

            // We need to preserve the token!
            const userWithToken = { ...currentUser, ...verifiedUser, token: currentUser.token };
            console.log('✨ AuthProvider: Updating user state with verified data:', userWithToken);
            setUser(userWithToken);
          } catch (error) {
            console.warn('⚠️ AuthProvider: Token verification failed:', error);
            console.log('🧹 AuthProvider: Clearing invalid session');
            authService.logout();
            setUser(null);
          }
        } else {
          console.log('ℹ️ AuthProvider: No user in localStorage');
        }
      } catch (error) {
        console.error("❌ AuthProvider: Initialization error:", error);
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
        console.log('🏁 AuthProvider: Initialization complete, loading set to false');
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    console.log('🔐 AuthProvider: login called for:', email);
    try {
      const response = await authService.login(email, password);
      console.log('📥 AuthProvider: login response received:', response);

      // The login response has structure: { success: true, token: "...", user: {...} }
      // We want to store the whole object which includes the token

      // NOTE: authService.login returns response.data

      // Ensure we have the user object
      if (!response.user) {
        throw new Error('Login response missing user data');
      }

      const loggedInUser = {
        ...response.user,
        token: response.token // Ensure token is accessible at top level if needed, or structured as received
      };

      console.log('👤 AuthProvider: Setting user state:', loggedInUser);
      setUser(loggedInUser);

      return loggedInUser;
    } catch (error) {
      console.error('❌ AuthProvider: Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    console.log('📝 AuthProvider: signup called');
    return await authService.signup(userData);
  };

  const logout = () => {
    console.log('👋 AuthProvider: logout called');
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

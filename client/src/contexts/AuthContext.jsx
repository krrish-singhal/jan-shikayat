import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { performTokenRefresh, getTokenExpiry } from '../services/api.js';
import i18n from '../i18n.js';
import { ROLES, ROLE_DASHBOARD_ROUTES } from '../constants/roles.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  // Restore session on initial load
  const restoreSession = useCallback(async () => {
    let token = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    // If access token is missing or expired, attempt proactive refresh using stored refresh token / cookie
    const expiry = token ? getTokenExpiry(token) : null;
    const isExpired = expiry && expiry <= Date.now();

    if (!token || isExpired) {
      try {
        token = await performTokenRefresh();
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          setLoading(false);
          return;
        }
      }
    }

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/me');
      if (res.data?.success) {
        const userData = res.data.data.user;
        setUser(userData);
        setAccessToken(token);
        setUnreadNotifications(res.data.data.unreadNotifications || 0);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData?.preferredLanguage) {
          i18n.changeLanguage(userData.preferredLanguage);
        }
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        console.warn('[Session Restore] Auth error, clearing local session.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setAccessToken(null);
      } else {
        console.warn('[Session Restore] Network issue during session restore, preserving offline session.');
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {}
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Synchronize state on token refresh or session expiration events dispatched by api.js
  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      if (e.detail?.accessToken) {
        setAccessToken(e.detail.accessToken);
      }
      if (e.detail?.user) {
        setUser(e.detail.user);
      }
    };

    const handleSessionExpired = () => {
      setAccessToken(null);
      setUser(null);
      setUnreadNotifications(0);
    };

    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  // Proactive background renewal: silently refresh 60 seconds before access token expires
  useEffect(() => {
    if (!accessToken) return;
    const expiry = getTokenExpiry(accessToken);
    if (!expiry) return;

    // Refresh 60s before expiry (or 5s minimum if already close to expiry)
    const delay = Math.max(expiry - Date.now() - 60 * 1000, 5000);
    const timer = setTimeout(async () => {
      try {
        await performTokenRefresh();
      } catch (err) {
        console.warn('[Proactive Refresh] Silent token renewal failed:', err.message);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [accessToken]);

  // Citizen Login
  const loginCitizen = async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken: token, refreshToken } = res.data.data;
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData?.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage);
    }
    return userData;
  };

  // Staff Login (OP-0001 / ENG-0001 / ADM-0001 or email)
  const loginStaff = async ({ identifier, password }) => {
    const res = await api.post('/auth/staff/login', { identifier, password });
    const { user: userData, accessToken: token, refreshToken, mustChangePassword } = res.data.data;
    userData.mustChangePassword = mustChangePassword;
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData?.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage);
    }
    return { user: userData, mustChangePassword };
  };

  // Citizen Registration
  const registerCitizen = async ({ name, email, password, phone }) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    const { user: userData, accessToken: token, refreshToken } = res.data.data;
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData?.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage);
    }
    return userData;
  };

  // Google OAuth Login
  const loginWithGoogle = async ({ email, name, googleId, phone, accessToken }) => {
    const res = await api.post('/auth/google', { email, name, googleId, phone, accessToken });
    const { user: userData, accessToken: token, refreshToken } = res.data.data;
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData?.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage);
    }
    return userData;
  };

  // Check Google User existence & phone status
  const checkGoogleUser = async ({ email, googleId }) => {
    const res = await api.post('/auth/google/check', { email, googleId });
    return res.data.data;
  };

  // Change language preference
  const changeUserLanguage = async (newLang) => {
    await i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);

    if (user) {
      const updated = { ...user, preferredLanguage: newLang };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      try {
        await api.patch('/me/language', { language: newLang });
      } catch (err) {
        console.warn('[Sync Language Error]', err?.response?.data || err.message);
      }
    }
  };

  // Logout
  const logout = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken: storedRefreshToken || undefined });
    } catch (err) {
      console.error('[Logout API Error]', err.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setAccessToken(null);
      setUser(null);
      setUnreadNotifications(0);
    }
  };

  // Update Profile
  const updateProfile = async ({ name, phone }) => {
    const res = await api.patch('/me', { name, phone });
    const updatedUser = res.data.data.user;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  // Change Password
  const changePassword = async ({ currentPassword, newPassword }) => {
    const res = await api.post('/me/change-password', { currentPassword, newPassword });
    if (user) {
      const updated = { ...user, mustChangePassword: false };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
    return res.data;
  };

  // Delete / Anonymize Account
  const deleteAccount = async () => {
    const res = await api.delete('/me');
    await logout();
    return res.data;
  };

  // Refresh notifications count
  const refreshNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        const unread = res.data.data.filter((n) => !n.isRead).length;
        setUnreadNotifications(unread);
      }
    } catch {}
  };

  const isCitizen = user?.role === ROLES.CITIZEN;
  const isOperator = user?.role === ROLES.OPERATOR;
  const isEngineer = user?.role === ROLES.ENGINEER;
  const isAdmin = user?.role === ROLES.ADMIN;

  const defaultDashboard = user ? ROLE_DASHBOARD_ROUTES[user.role] || '/' : '/login';

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        unreadNotifications,
        loading,
        isCitizen,
        isOperator,
        isEngineer,
        isAdmin,
        defaultDashboard,
        loginCitizen,
        loginStaff,
        registerCitizen,
        loginWithGoogle,
        checkGoogleUser,
        logout,
        changeUserLanguage,
        updateProfile,
        changePassword,
        deleteAccount,
        refreshNotifications,
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

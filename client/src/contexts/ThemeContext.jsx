import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

const getSystemPreference = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch (e) {
      console.warn('[Theme] Could not read stored theme:', e);
    }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState(getSystemPreference);

  // Listen to OS color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      // Legacy Safari fallback
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'theme') {
        const val = e.newValue;
        if (val === 'light' || val === 'dark' || val === 'system') {
          setThemeState(val);
        } else if (!val) {
          setThemeState('system');
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const resolvedTheme = useMemo(() => {
    return theme === 'system' ? systemTheme : theme;
  }, [theme, systemTheme]);

  const isDark = resolvedTheme === 'dark';

  // Apply to DOM and meta tags
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Sync with <meta name="color-scheme">
    const metaTag = document.querySelector('meta[name="color-scheme"]');
    if (metaTag) {
      metaTag.content = resolvedTheme;
    }
  }, [isDark, resolvedTheme]);

  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') return;
    setThemeState(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
      // Also update color-scheme item for standalone compliance
      localStorage.setItem('color-scheme', newTheme === 'system' ? 'light dark' : newTheme);
    } catch (e) {
      console.warn('[Theme] Could not save theme preference:', e);
    }
  };

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      isDark,
      toggleTheme,
      setTheme,
    }),
    [theme, resolvedTheme, isDark]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


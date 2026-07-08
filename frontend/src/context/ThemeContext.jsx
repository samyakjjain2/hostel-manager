import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always force light mode — dark mode disabled
  const [theme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    // Forcibly remove dark class and ensure light mode always
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.setItem('aegis_theme', 'light');

    // Extra guard: re-apply on any system color-scheme change
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const forceLight = () => {
      root.classList.remove('dark');
      root.classList.add('light');
    };
    mediaQuery.addEventListener('change', forceLight);
    return () => mediaQuery.removeEventListener('change', forceLight);
  }, []);

  const toggleTheme = () => {
    // No-op — theme switching disabled, always light
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

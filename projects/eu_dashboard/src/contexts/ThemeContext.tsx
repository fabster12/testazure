import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { themes, Theme } from '../themes';

interface ThemeContextType {
  theme: Theme;
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<string>(() => {
    try {
      const storedTheme = window.localStorage.getItem('app-theme');
      return storedTheme && themes[storedTheme] ? storedTheme : 'dark';
    } catch (error) {
      console.warn('Could not read theme from localStorage', error)
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('app-theme', themeName);
    } catch (error) {
      console.error('Failed to save theme to localStorage', error);
    }
    const root = window.document.documentElement;
    const newTheme = themes[themeName];
    
    // Apply theme colors as CSS variables
    Object.entries(newTheme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
      }
    });
    
    // Set text color on html element
    root.style.color = `rgb(${newTheme.colors['text-primary']})`;

  }, [themeName]);

  const value = useMemo(() => ({
    theme: themes[themeName],
    setTheme: setThemeName,
  }), [themeName]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
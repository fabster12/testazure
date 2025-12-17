/**
 * Theme context for multi-theme support (light, dark, fedex)
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'fedex';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Check localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored && ['light', 'dark', 'fedex'].includes(stored)) return stored;

    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes first
    root.classList.remove('dark', 'fedex');

    // Add the current theme class
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'fedex') {
      root.classList.add('fedex');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      // Cycle through: light → dark → fedex → light
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'fedex';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

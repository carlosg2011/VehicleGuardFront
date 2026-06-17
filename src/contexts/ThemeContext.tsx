import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = `darkMode_${user?.id ?? 'guest'}`;

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(storageKey) === 'true');

  // When the logged-in user changes, load their saved preference
  useEffect(() => {
    setDarkMode(localStorage.getItem(storageKey) === 'true');
  }, [storageKey]);

  // Apply to DOM and persist whenever value or user changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(storageKey, String(darkMode));
  }, [darkMode, storageKey]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode: () => setDarkMode((p) => !p) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

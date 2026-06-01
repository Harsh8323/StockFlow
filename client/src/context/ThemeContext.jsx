import { createContext, useContext, useEffect, useMemo } from 'react';

const ThemeContext = createContext(null);

/** App is dark-mode only. */
export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('stockflow_theme', 'dark');
  }, []);

  const value = useMemo(
    () => ({
      theme: 'dark',
      isDark: true,
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
};

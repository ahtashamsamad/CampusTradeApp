import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
type BaseTheme = 'light' | 'dark';

export type Colors = {
  background: string;
  surface: string;
  surfaceHighlight: string;
  primary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  statusBarStyle: 'dark-content' | 'light-content';
};

type ThemeContextValue = {
  theme: BaseTheme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: Colors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedTheme: BaseTheme;
};

const lightColors: Colors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceHighlight: '#f1f5f9',
  primary: '#2563eb',
  border: '#e6eef8',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  statusBarStyle: 'dark-content',
};

const darkColors: Colors = {
  background: '#0b1220',
  surface: '#0f1724',
  surfaceHighlight: '#0d1b2a',
  primary: '#60a5fa',
  border: '#162234',
  textPrimary: '#e6eef8',
  textSecondary: '#9fb0c8',
  textMuted: '#7f98b0',
  statusBarStyle: 'light-content',
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const resolvedTheme: BaseTheme = useMemo(() => {
    if (themeMode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
    return themeMode === 'dark' ? 'dark' : 'light';
  }, [themeMode, systemScheme]);

  const theme = resolvedTheme;
  const isDark = theme === 'dark';

  const toggleTheme = () => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const value = useMemo(() => ({ theme, isDark, toggleTheme, colors, themeMode, setThemeMode, resolvedTheme }),
    [theme, isDark, colors, themeMode, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

export default ThemeProvider;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    resolvedTheme: ResolvedTheme;
    setThemeMode: (mode: ThemeMode) => void;
    colors: ThemeColors;
}

export interface ThemeColors {
    // Backgrounds
    background: string;
    surface: string;
    surfaceHighlight: string;
    surfaceCard: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    // Brand
    primary: string;
    primaryLight: string;
    // Borders
    border: string;
    // Status bar
    statusBarStyle: 'light-content' | 'dark-content';
    // Tab bar
    tabBarBg: string;
    // Input
    inputBg: string;
    inputBorder: string;
    // Chip / Badge
    chipBg: string;
    chipText: string;
}

const darkColors: ThemeColors = {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHighlight: '#334155',
    surfaceCard: '#1e293b',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    primary: '#6366f1',
    primaryLight: '#818cf8',
    border: '#334155',
    statusBarStyle: 'light-content',
    tabBarBg: 'rgba(15, 23, 42, 0.97)',
    inputBg: '#1e293b',
    inputBorder: '#334155',
    chipBg: '#334155',
    chipText: '#94a3b8',
};

const lightColors: ThemeColors = {
    background: '#f1f5f9',
    surface: '#ffffff',
    surfaceHighlight: '#e2e8f0',
    surfaceCard: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    primary: '#6366f1',
    primaryLight: '#818cf8',
    border: '#e2e8f0',
    statusBarStyle: 'dark-content',
    tabBarBg: 'rgba(255, 255, 255, 0.97)',
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
    chipBg: '#e2e8f0',
    chipText: '#475569',
};

const ThemeContext = createContext<ThemeContextType>({
    themeMode: 'system',
    resolvedTheme: 'dark',
    setThemeMode: () => { },
    colors: darkColors,
});

const THEME_STORAGE_KEY = '@campus_trade_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useSystemColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                setThemeModeState(saved);
            }
        });
    }, []);

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    };

    const resolvedTheme: ResolvedTheme =
        themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;

    const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

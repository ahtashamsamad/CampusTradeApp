import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import "../global.css";

import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Notifications, isExpoGo, isBrowser } from '@/src/utils/notifications';

// ──────────────────────────────────────────────────────────────
// Helper: extract navigation target from a notification response
// ──────────────────────────────────────────────────────────────
function getRouteFromNotification(response: any): string | null {
  const data = response?.notification?.request?.content?.data;
  if (!data) return null;

  // Chat notification → navigate to the specific chat room
  if (data.chatId) {
    return `/chat/${data.chatId}`;
  }

  // Listing notification → navigate to the listing detail
  if (data.listingId) {
    return `/listing/${data.listingId}`;
  }

  // Generic screen redirect (if the sender provided a screen field)
  if (data.screen) {
    return data.screen;
  }

  // Default: open the notifications screen
  return '/notifications';
}

// ──────────────────────────────────────────────────────────────
// Hook: sets up notification tap listeners with proper cleanup
// ──────────────────────────────────────────────────────────────
function useNotificationObserver() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  // Guard: only enable on native, non-Expo-Go, when module is loaded
  const canListen = Platform.OS !== 'web' && isBrowser && !isExpoGo && Notifications;

  // ── 1. Handle cold-start (app opened from quit state via notification tap) ──
  useEffect(() => {
    if (!canListen || isLoading) return;

    let isMounted = true;

    const checkLastNotification = async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse && isMounted && isLoggedIn) {
          const route = getRouteFromNotification(lastResponse);
          if (route) {
            // Small delay to let navigation tree mount first
            setTimeout(() => {
              if (isMounted) router.push(route as any);
            }, 500);
          }
        }
      } catch (e) {
        console.warn('[Notifications] Error checking last response:', e);
      }
    };

    checkLastNotification();

    return () => {
      isMounted = false;
    };
  }, [canListen, isLoading, isLoggedIn]);

  // ── 2. Handle taps while the app is running (foreground / background) ──
  useEffect(() => {
    if (!canListen) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const route = getRouteFromNotification(response);
        if (route && isLoggedIn) {
          router.push(route as any);
        }
      }
    );

    return () => subscription.remove();
  }, [canListen, isLoggedIn]);
}

function RootLayoutNav() {
  const { resolvedTheme } = useTheme();
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // ── Auth redirect logic ──
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    // Check for protected routes - in this app, most things besides login/signup are protected
    // If not logged in and not on login/signup, redirect to login
    if (!isLoggedIn && segments[0] !== 'login' && segments[0] !== 'signup') {
      router.replace('/login' as any);
    } else if (isLoggedIn && (segments[0] === 'login' || segments[0] === 'signup')) {
      // If logged in and on login/signup, redirect to home
      router.replace('/(tabs)' as any);
    }
  }, [isLoggedIn, segments, isLoading]);

  // ── Notification observers (tap handling + cold-start) ──
  useNotificationObserver();

  // Show a loading spinner while checking auth state to prevent flashing
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: resolvedTheme === 'dark' ? '#020617' : '#ffffff', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <NavThemeProvider value={resolvedTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="categories" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="edit_profile" options={{ headerShown: false }} />
        <Stack.Screen name="privacy_security" options={{ headerShown: false }} />
        <Stack.Screen name="manage_listings" options={{ headerShown: false }} />
        <Stack.Screen name="edit_listing/[id]" options={{ headerShown: false }} />

        <Stack.Screen name="item_sold" options={{ headerShown: false }} />

      </Stack>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

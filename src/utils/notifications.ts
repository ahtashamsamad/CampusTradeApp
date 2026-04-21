import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Universal Guard: Check if we are running in a browser environment
const isBrowser = typeof window !== 'undefined';
const isExpoGo = Constants.appOwnership === 'expo';

// Conditional imports to avoid SSR crashes - only utilize if NOT web OR definitely browser
let Notifications: any = null;
let Device: any = null;

if (isBrowser || Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (e) {
    // console.error("Failed to load notification modules", e);
  }
}

// The dedicated Android channel name for chat messages
export const ANDROID_CHANNEL_ID = 'chat_messages';

// Configure how notifications are handled when the app is OPEN (foreground)
// We want heads-up banners even if the app is in focus.
const shouldInitialize = Platform.OS !== 'web' && isBrowser;

if (shouldInitialize && Notifications && !isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,   // Show in-app alert / heads-up banner
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,  // iOS 15+ banner
      shouldShowList: true,    // iOS notification center
    }),
  });
}

/**
 * Creates a high-importance Android Notification Channel for chat messages.
 * High importance = heads-up popup, sound, vibration in the system tray.
 */
async function ensureNotificationChannel() {
  if (Platform.OS !== 'android' || !Notifications || isExpoGo) return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Chat Messages',
    description: 'Notifications for new chat messages and trades',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366f1',
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
  });
}

export async function registerForPushNotificationsAsync() {
  if (!isBrowser || !Notifications || !Device) return null;
  
  if (isExpoGo) {
    console.log("Running in Expo Go: Skipping Push Setup");
    return null;
  }

  let token;

  // Ensure the high-importance channel exists on Android
  await ensureNotificationChannel();

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  } else {
    // console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Fire a local notification that appears in the system tray / top bar.
 * 
 * @param title  Notification title
 * @param body   Notification body text
 * @param data   Extra data payload (e.g. { chatId, screen, listingId })
 *               — this is what the tap handler uses for navigation.
 */
export async function sendLocalNotification(title: string, body: string, data?: any) {
  if (!isBrowser || !Notifications || isExpoGo) return;

  // Make sure the channel exists before scheduling
  await ensureNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
      // Android-specific: direct to our high-importance channel
      ...(Platform.OS === 'android' && { channelId: ANDROID_CHANNEL_ID }),
    },
    trigger: null, // trigger immediately
  });
}

// ──────────────────────────────────────────────────────────────
// Push Token Persistence — save to Firestore so we can send
// remote pushes to other users' devices.
// ──────────────────────────────────────────────────────────────
let _firestore: any = null;
function getFirestore() {
  if (!_firestore) {
    try {
      const { db } = require('@/src/config/firebase');
      const firestore = require('firebase/firestore');
      _firestore = { db, ...firestore };
    } catch { }
  }
  return _firestore;
}

/**
 * Persist the device push token to the user's Firestore document
 * so other users can send them remote push notifications.
 */
export async function savePushToken(userId: string, token: string) {
  if (!userId || !token) return;
  try {
    const fs = getFirestore();
    if (!fs) return;
    const userRef = fs.doc(fs.db, 'users', userId);
    await fs.updateDoc(userRef, { expoPushToken: token });
    console.log('[Push] Token saved to Firestore for user:', userId);
  } catch (e: any) {
    console.warn('[Push] Failed to save token:', e.message);
  }
}

// ──────────────────────────────────────────────────────────────
// Remote Push Notification — sends via the Expo Push API
// ──────────────────────────────────────────────────────────────
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a remote push notification to another user's device.
 *
 * This is a **fire-and-forget** background task — errors are logged
 * but NEVER thrown back to the caller, so the Firestore message
 * write is never interrupted.
 *
 * @param recipientPushToken  The Expo push token of the recipient
 * @param title               Notification title text
 * @param body                Notification body text
 * @param data                Extra data payload for tap navigation
 */
export async function sendPushNotification(
  recipientPushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  // ── Guard: validate the push token before attempting to fetch ──
  if (!recipientPushToken || typeof recipientPushToken !== 'string' || recipientPushToken.trim() === '') {
    console.log('[Push] Skipped — no valid push token for recipient');
    return;
  }

  const payload = {
    to: recipientPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  // ── Debug: inspect exactly what is being sent ──
  console.log('Push Payload:', payload);

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Push] Expo API returned error:', response.status, result);
    } else {
      console.log('[Push] Sent successfully:', result);
    }
  } catch (error: any) {
    // ── Non-blocking: log but never re-throw ──
    console.error('Push Notification Fetch Error:', error.message);
  }
}

/**
 * Lookup a user's push token from Firestore by their userId.
 * Returns null if not found or on error.
 */
export async function getUserPushToken(userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    const fs = getFirestore();
    if (!fs) return null;
    const userRef = fs.doc(fs.db, 'users', userId);
    const snap = await fs.getDoc(userRef);
    if (snap.exists()) {
      return snap.data()?.expoPushToken || null;
    }
  } catch (e: any) {
    console.warn('[Push] Failed to fetch token for user:', e.message);
  }
  return null;
}

// Re-export Notifications module for use in listeners (root layout)
export { Notifications, isExpoGo, isBrowser };


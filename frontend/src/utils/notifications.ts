import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Notifications Utility - Safe Version for Expo Go SDK 53/54+
 * Provides mock implementations in Dev/Expo Go to prevent crashes.
 */

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Initialize notification handler settings.
 * Safe to call in Root Layout or AuthContext.
 */
export async function initNotifications() {
  if (Platform.OS === 'web' || isExpoGo) {
    console.log('[Notifications] Mock: Initialized in Dev/Web mode');
    return;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.warn('[Notifications] Initialization failed:', error);
  }
}

/**
 * Request user permissions for push notifications.
 * @returns boolean indicating if permission was granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  if (isExpoGo && __DEV__) {
    console.log('[Notifications] Mock: Permission granted in Dev');
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.error('[Notifications] Permission request error:', error);
    return false;
  }
}

/**
 * Send a local notification.
 * Falls back to console log in unsupported environments.
 */
export async function sendNotification(title: string, body: string, data: any = {}) {
  console.log(`[Notification] ${title}: ${body}`, data);

  if (Platform.OS === 'web') return;

  try {
    if (isExpoGo && __DEV__) {
      // Just console log is enough for mock, but we can try to schedule if SDK allows
      console.log('[Notifications] Dev-mode: Local notification scheduled (Mock)');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[Notifications] Failed to send local notification:', error);
  }
}

/**
 * Get Expo Push Token safely.
 */
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice || isExpoGo) {
    return 'mock-token-dev';
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    return token;
  } catch (error) {
    console.error('[Notifications] Token generation error:', error);
    return null;
  }
}

/**
 * Retrieve user push token from Firestore.
 */
export async function getUserPushToken(userId: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().expoPushToken || null;
    }
  } catch (error) {
    console.error('[Notifications] Error getting user push token:', error);
  }
  return null;
}

/**
 * Send remote push notification via Expo API.
 */
export async function sendPushNotification(token: string | null, title: string, body: string, data?: any) {
  if (!token || token === 'mock-token-dev') {
    console.log(`[Notifications] Mock Push Sent to ${token}: ${title} - ${body}`);
    return;
  }

  const message = {
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const resData = await response.json();
    console.log('[Notifications] Send response:', resData);
  } catch (error) {
    console.error('[Notifications] Error sending push notification:', error);
  }
}

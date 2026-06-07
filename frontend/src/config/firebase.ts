import { FirebaseApp, initializeApp, getApp, getApps } from 'firebase/app';
import { Firestore, initializeFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Helper to clean the API key from hidden characters or whitespace
const cleanApiKey = (key: string | undefined) => {
  if (!key) return "";
  return key.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
};

const firebaseConfig = {
  apiKey: cleanApiKey(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;
let storage!: FirebaseStorage;

try {
  // Initialize Firebase only if not already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with persistence for React Native
    if (Platform.OS !== 'web') {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('✅ Firebase initialized with Native Persistence');
    } else {
      auth = getAuth(app);
      console.log('✅ Firebase initialized with Web Persistence');
    }
  } else {
    app = getApp();
    auth = getAuth(app);
    console.log('✅ Firebase using existing app instance');
  }

  // Initialize Firestore
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });

  // Initialize Storage
  storage = getStorage(app);

} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

export { app, auth, db, storage };
export default app;


import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to clean the API key from hidden characters or whitespace
const cleanApiKey = (key: string | undefined) => {
  if (!key) return "";
  return key.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
};

const firebaseConfig = {
  apiKey: cleanApiKey(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if not already initialized
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export initialized instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

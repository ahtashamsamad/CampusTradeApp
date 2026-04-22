import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDyS-eEtWRtfWqbXVG-JEJHeA63vSDonsI",
    authDomain: "campustrade-c72be.firebaseapp.com",
    projectId: "campustrade-c72be",
    storageBucket: "campustrade-c72be.firebasestorage.app",
    messagingSenderId: "980281093064",
    appId: "1:980281093064:web:2dd250447511928e182efd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { app, auth, db };
export default app;

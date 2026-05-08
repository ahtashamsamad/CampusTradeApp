import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyS-eEtWRtfWqbXVG-JEJHeA63vSDonsI",
  authDomain: "campustrade-c72be.firebaseapp.com",
  projectId: "campustrade-c72be",
  storageBucket: "campustrade-c72be.firebasestorage.app",
  messagingSenderId: "980281093064",
  appId: "1:980281093064:web:2dd250447511928e182efd",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

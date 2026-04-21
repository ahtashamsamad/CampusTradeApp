import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const storage = getStorage(app);

export { app, auth, db, storage };
export default app;


import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAj0_vu8OxPWVHvAWSRVN90y9GIStvQASY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "legendstech001.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "legendstech001",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "legendstech001.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "749589426436",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:749589426436:web:64b0455b7f90a7849c6051",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7MWNJDZ5D0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enforce local persistence (Browser Only)
if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.error("Failed to enable persistence:", err);
    });
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

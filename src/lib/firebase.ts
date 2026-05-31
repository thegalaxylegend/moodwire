
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || (typeof process !== 'undefined' && process.env.VITE_FIREBASE_API_KEY) || "AIzaSyAj0_vu8OxPWVHvAWSRVN90y9GIStvQASY",
    authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || (typeof process !== 'undefined' && process.env.VITE_FIREBASE_AUTH_DOMAIN) || "legendstech001.firebaseapp.com",
    projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || (typeof process !== 'undefined' && process.env.VITE_FIREBASE_PROJECT_ID) || "legendstech001",
    storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || (typeof process !== 'undefined' && process.env.VITE_FIREBASE_STORAGE_BUCKET) || "legendstech001.firebasestorage.app",
    messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || (typeof process !== 'undefined' && process.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "749589426436",
    appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || (typeof process !== 'undefined' && process.env.VITE_FIREBASE_APP_ID) || "1:749589426436:web:64b0455b7f90a7849c6051",
    measurementId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) || (typeof process !== 'undefined' && process.env.VITE_FIREBASE_MEASUREMENT_ID) || "G-7MWNJDZ5D0"
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

// Initialize Firestore with modern persistent caching when in browser
export const db = typeof window !== 'undefined'
    ? initializeFirestore(app, {
        cache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
      })
    : getFirestore(app);

export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

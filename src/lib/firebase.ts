
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_API_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || 'AIzaSy' + 'dummykey'.repeat(4),
    authDomain: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_AUTH_DOMAIN) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || 'dummy.firebaseapp.com',
    projectId: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_PROJECT_ID) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || 'dummy-project-id',
    storageBucket: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_STORAGE_BUCKET) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || 'dummy.firebasestorage.app',
    messagingSenderId: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || '123456789012',
    appId: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_APP_ID) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || '1:123456789012:web:dummyappid123456',
    measurementId: (typeof process !== 'undefined' && process.env.VITE_FIREBASE_MEASUREMENT_ID) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) || 'G-DUMMY12345'
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

// Enable offline persistence
if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a a time.
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.warn('The current browser does not support all of the features required to enable persistence');
        }
    });
}

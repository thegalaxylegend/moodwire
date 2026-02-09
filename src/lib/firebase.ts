
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAj0_vu8OxPWVHvAWSRVN90y9GIStvQASY",
    authDomain: "legendstech001.firebaseapp.com",
    projectId: "legendstech001",
    storageBucket: "legendstech001.firebasestorage.app",
    messagingSenderId: "749589426436",
    appId: "1:749589426436:web:64b0455b7f90a7849c6051",
    measurementId: "G-7MWNJDZ5D0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enforce local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Failed to enable persistence:", err);
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

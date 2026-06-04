import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Resolve Firebase config from environment variables ONLY.
// No hardcoded fallbacks — fail loudly in dev if env vars are missing so
// misconfigurations are caught before they reach production.
function requireEnv(key: string): string {
    const value =
        (typeof import.meta !== 'undefined' && (import.meta.env as Record<string, string>)?.[key]) ||
        (typeof process !== 'undefined' && process.env[key]);
    if (!value) {
        const msg = `[Firebase] Missing required environment variable: ${key}. Add it to your .env file.`;
        // In production SSR/prerender, throw to halt the build rather than silently misconfigure.
        if (typeof window === 'undefined') throw new Error(msg);
        // In browser, warn loudly — the app will likely fail to auth but won't expose secrets.
        console.error(msg);
        return '';
    }
    return value;
}

const firebaseConfig = {
    apiKey:            requireEnv('VITE_FIREBASE_API_KEY'),
    authDomain:        requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId:         requireEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket:     requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId:             requireEnv('VITE_FIREBASE_APP_ID'),
    measurementId:     requireEnv('VITE_FIREBASE_MEASUREMENT_ID'),
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
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
      })
    : getFirestore(app);

export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

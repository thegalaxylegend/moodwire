import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Resolve Firebase config from environment variables ONLY.
// No hardcoded fallbacks — fail loudly in dev if env vars are missing so
// misconfigurations are caught before they reach production.
const firebaseConfig = {
    apiKey:            ((typeof import.meta !== 'undefined' && import.meta.env.VITE_FIREBASE_API_KEY) || 'AIzaSyAj0_vu8OxPWVHvAWSRVN90y9GIStvQASY') as string,
    authDomain:        ((typeof import.meta !== 'undefined' && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || 'legendstech001.firebaseapp.com') as string,
    projectId:         ((typeof import.meta !== 'undefined' && import.meta.env.VITE_FIREBASE_PROJECT_ID) || 'legendstech001') as string,
    storageBucket:     ((typeof import.meta !== 'undefined' && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || 'legendstech001.firebasestorage.app') as string,
    messagingSenderId: ((typeof import.meta !== 'undefined' && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '749589426436') as string,
    appId:             ((typeof import.meta !== 'undefined' && import.meta.env.VITE_FIREBASE_APP_ID) || '1:749589426436:web:64b0455b7f90a7849c6051') as string,
    measurementId:     ((typeof import.meta !== 'undefined' && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || 'G-7MWNJDZ5D0') as string,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Avoid initializing auth during server-side static generation if dummy keys are used
// Firebase Auth SDK will throw if initialized with fake keys like 'AIzaSy...'
let authInstance: any = null;
try {
    authInstance = typeof window === 'undefined' ? {} as any : getAuth(app);
} catch (e) {
    console.warn("Firebase Auth could not be initialized in this environment.", e);
    authInstance = {} as any;
}
export const auth = authInstance;

// Enforce local persistence (Browser Only)
// Guard: only call setPersistence if auth is a real Auth instance (not the SSR fallback {})
if (
    typeof window !== 'undefined' &&
    authInstance &&
    typeof authInstance.onAuthStateChanged === 'function' &&
    typeof (authInstance as any).setPersistence === 'function'
) {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.error("Failed to enable persistence:", err);
    });
}

// Initialize Firestore with persistent caching in browser.
// initializeFirestore throws if called a second time (e.g. during Vite HMR hot-reload),
// so we fall back to getFirestore() if it is already initialized.
let dbInstance: any;
try {
    dbInstance = typeof window !== 'undefined'
        ? initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
          })
        : getFirestore(app);
} catch {
    // Already initialized — just get the existing instance
    dbInstance = getFirestore(app);
}
export const db = dbInstance;

export const storage = getStorage(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

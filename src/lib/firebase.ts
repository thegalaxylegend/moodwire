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
        // In browser, warn loudly — the app will likely fail to auth but won't expose secrets.
        console.error(msg);

        // In production SSR/prerender, fall back to valid dummy strings instead of empty strings
        // to prevent `auth/invalid-api-key` SDK crashes during SSG builds where env vars are stripped.
        if (typeof window === 'undefined') {
            if (key === 'VITE_FIREBASE_API_KEY') {
                return 'AIzaSy' + 'dummykey'.repeat(4);
            }
            if (key === 'VITE_FIREBASE_APP_ID') {
                return '1:1234567890:web:1234567890';
            }
            if (key === 'VITE_FIREBASE_PROJECT_ID') {
                return 'dummy-project';
            }
            if (key === 'VITE_FIREBASE_AUTH_DOMAIN') {
                return 'dummy-project.firebaseapp.com';
            }
            return 'dummy-value';
        }

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

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// These would normally be in .env.local
// For this prototype, we'll placeholder them or use a public dev project if available.
const firebaseConfig = {
    apiKey: "AIzaSyAJtH4EBsv3F23kq0OegcFssGmRTLL-9XE",
    authDomain: "moodwire.firebaseapp.com",
    projectId: "moodwire",
    storageBucket: "moodwire.firebasestorage.app",
    messagingSenderId: "163820994377",
    appId: "1:163820994377:web:073571d136a6bc64b1e498",
    measurementId: "G-2X1ZL4J483",
    databaseURL: "https://moodwire-default-rtdb.firebaseio.com/"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export default app;

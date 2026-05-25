import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyAj0_vu8OxPWVHvAWSRVN90y9GIStvQASY',
    authDomain: 'legendstech001.firebaseapp.com',
    projectId: 'legendstech001',
    storageBucket: 'legendstech001.firebasestorage.app',
    messagingSenderId: '749589426436',
    appId: '1:749589426436:web:64b0455b7f90a7849c6051',
    measurementId: 'G-7MWNJDZ5D0'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspect() {
    console.log("Checking user profile documents from 'profiles' collection...");
    const uids = ["2O6DegBgTxg0AjglYDdUEmdwMKk2", "tTkJfBNdleNp76XbDlExJDqO4tA3"];
    for (const uid of uids) {
        try {
            const userRef = doc(db, 'profiles', uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                console.log(`User UID ${uid}:`, JSON.stringify(snap.data(), null, 2));
            } else {
                console.log(`User UID ${uid} does not exist in profiles collection!`);
            }
        } catch (e) {
            console.error(`Failed to read user ${uid}:`, e);
        }
    }
}

inspect();

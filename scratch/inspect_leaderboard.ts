import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
    console.log("Querying leaderboards/2026-05/users...");
    try {
        const usersRef = collection(db, 'leaderboards', '2026-05', 'users');
        const snap = await getDocs(usersRef);
        console.log(`Found ${snap.size} documents in leaderboard.`);
        snap.docs.forEach(d => {
            console.log(`Document ID: ${d.id}`, JSON.stringify(d.data(), null, 2));
        });
    } catch (e) {
        console.error("Query failed:", e);
    }
}

inspect();

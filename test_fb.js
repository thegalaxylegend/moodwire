import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
    apiKey: "AIzaSyAJtH4EBsv3F23kq0OegcFssGmRTLL-9XE",
    authDomain: "moodwire.firebaseapp.com",
    projectId: "moodwire",
    storageBucket: "moodwire.firebasestorage.app",
    messagingSenderId: "163820994377",
    appId: "1:163820994377:web:073571d136a6bc64b1e498",
    databaseURL: "https://moodwire-default-rtdb.firebaseio.com/"
};

async function test() {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('debug_fb.log', msg + '\n');
    };

    try {
        log("Testing Firebase connection...");
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        log("Attempting to write a test document...");
        const docRef = await addDoc(collection(db, 'test_collection'), {
            test: true,
            timestamp: Date.now()
        });
        log("Success! ID: " + docRef.id);
    } catch (e) {
        log("FAILED: " + e.message);
        log("CODE: " + e.code);
        log("STACK: " + e.stack);
    }
    process.exit(0);
}

test();


import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAJtH4EBsv3F23kq0OegcFssGmRTLL-9XE",
    authDomain: "moodwire.firebaseapp.com",
    projectId: "moodwire",
    storageBucket: "moodwire.firebasestorage.app",
    messagingSenderId: "163820994377",
    appId: "1:163820994377:web:073571d136a6bc64b1e498"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
    console.log("🌱 Seeding REAL training data structure...");

    try {
        const userCredential = await signInAnonymously(auth);
        const userId = userCredential.user.uid;
        console.log(`👤 Simulated User: ${userId}`);

        const SESSIONS = 50;
        const EVENTS_PER_SESSION = 10;
        const totalEvents = SESSIONS * EVENTS_PER_SESSION;

        console.log(`Generating ${totalEvents} pairs of events...`);

        const promises = [];

        for (let s = 0; s < SESSIONS; s++) {
            const sessionId = `sess_${Date.now()}_${s}`;

            for (let i = 0; i < EVENTS_PER_SESSION; i++) {
                const trackId = `track_${Math.floor(Math.random() * 1000)}`;
                const timestamp = Date.now() - (Math.random() * 10000000); // Past events

                // 1. Generate Features (Random)
                const features = {
                    longTermSimilarity: Math.random(),
                    shortTermSimilarity: Math.random(),
                    artistAffinity: Math.random() > 0.8 ? 1.0 : 0.0,
                    languageScore: Math.random() > 0.5 ? 1.0 : 0.5,
                    flowScore: Math.random(),
                    explorationScore: Math.random() > 0.9 ? 1.0 : 0.0,
                    artistFatigue: 0,
                    genreFatigue: 0
                };

                // 2. Determine Outcome based on Logic (so ML can learn!)
                // Logic: High Similarity OR High Artist Affinity => Like/Complete
                let score = (features.longTermSimilarity * 0.5) + (features.artistAffinity * 0.5);
                let outcomeType = 'track_skip';

                if (score > 0.6) outcomeType = 'track_complete';
                if (score > 0.8) outcomeType = 'track_like';
                if (score < 0.2) outcomeType = 'track_skip'; // Explicit skip

                // 3. Log Served Event
                promises.push(addDoc(collection(db, 'users', userId, 'events'), {
                    type: 'recommendation_served_v2',
                    data: {
                        trackId,
                        rank: i,
                        score: score, // Fake score
                        features, // THE IMPORTANT PART
                        sessionId,
                        surface: 'autoplay'
                    },
                    sessionId,
                    timestamp: timestamp
                }));

                // 4. Log Interaction
                promises.push(addDoc(collection(db, 'users', userId, 'events'), {
                    type: outcomeType,
                    data: { trackId, progress: outcomeType === 'track_skip' ? 10 : 100 },
                    sessionId,
                    timestamp: timestamp + 30000 // 30s later
                }));
            }
        }

        console.log("Committing to Firestore...");
        await Promise.all(promises);
        console.log("✅ Seeding Complete!");

    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

seed();

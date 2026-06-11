import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAJtH4EBsv3F23kq0OegcFssGmRTLL-9XE",
    authDomain: "moodwire.firebaseapp.com",
    projectId: "moodwire",
    storageBucket: "moodwire.firebasestorage.app",
    messagingSenderId: "163820994377",
    appId: "1:163820994377:web:073571d136a6bc64b1e498",
    databaseURL: "https://moodwire-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
    console.log("🚀 Seeding synthetic ML training data (Authenticated)...");

    try {
        const userCredential = await signInAnonymously(auth);
        const userId = userCredential.user.uid;
        console.log(`Signed in as: ${userId}`);

        const allPromises = [];
        const sessionId = `sess_seed_${Math.random().toString(36).substr(2, 5)}`;

        // Generate 20 events for this session
        for (let i = 0; i < 20; i++) {
            const trackId = `track_${i}`;
            const features = {
                cosine_similarity: Math.random(),
                artist_affinity_score: Math.random(),
                language_match_score: 1.0,
                mood_context_score: Math.random(),
                popularity_score: Math.random(),
                completion_rate_score: 0.8,
                recency_penalty: 0,
                repetition_penalty: 0,
                discovery_score: 0.1,
                time_of_day_bias: 0.5,
                session_fatigue: i / 20,
                genre_overexposure: 0.1
            };

            allPromises.push(addDoc(collection(db, 'users', userId, 'events'), {
                type: 'recommendation_served',
                data: { trackId, rank: i + 1, features, predictedScore: 5.0, explorationFlag: false },
                sessionId,
                clientTimestamp: Date.now() + i * 1000,
                userAgent: "Seed/1.0"
            }));

            allPromises.push(addDoc(collection(db, 'users', userId, 'events'), {
                type: Math.random() > 0.3 ? 'track_complete' : 'track_skip',
                data: { trackId, progress: 100 },
                sessionId,
                clientTimestamp: Date.now() + i * 1000 + 500,
                userAgent: "Seed/1.0"
            }));
        }

        console.log(`Pushing ${allPromises.length} events...`);
        await Promise.all(allPromises);
        console.log("✅ Seeding complete for user:", userId);

        // Print the UID so we can verify with analyze script
        console.log(`UID_FOR_ANALYSIS:${userId}`);

    } catch (e) {
        console.error("❌ Seeding failed:", e);
    }
    process.exit(0);
}

seed();

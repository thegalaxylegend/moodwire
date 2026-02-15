import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getCountFromServer, addDoc } from 'firebase/firestore';
import { SYLLABUS_DB, SyllabusTopic } from '../src/lib/constants';
import dotenv from 'dotenv';
dotenv.config();

// ----------------------
// FIREBASE CONFIG (Hardcoded for script reliability)
// ----------------------
const firebaseConfig = {
    apiKey: "AIzaSyAj0_vu8OxPWVHvAWSRVN90y9GIStvQASY",
    authDomain: "legendstech001.firebaseapp.com",
    projectId: "legendstech001",
    storageBucket: "legendstech001.firebasestorage.app",
    messagingSenderId: "749589426436",
    appId: "1:749589426436:web:64b0455b7f90a7849c6051",
    measurementId: "G-7MWNJDZ5D0"
};

// Initialize Firebase locally for this script
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ----------------------
// CONFIGURATION
// ----------------------
const QUESTIONS_PER_TOPIC_TARGET = 3;

/**
 * Fallback Generator (No AI)
 * Generates a valid placeholder question.
 */
function generateFallbackQuestion(exam: string, subject: string, topic: string) {
    return {
        exam,
        subject,
        topic,
        chapter: topic,
        type: 'MCQ',
        difficulty: 'Medium',
        question: `Practice Question: Which of the following best describes the core concept of ${topic}?`,
        options: [
            `A fundamental principle of ${subject}.`,
            `A complex derivation in ${exam} syllabus.`,
            `An experimental observation.`,
            `A theoretical assumption.`
        ],
        correct_answer: `A fundamental principle of ${subject}.`,
        explanation: `This is a placeholder question to ensure comprehensive syllabus coverage. The correct answer highlights the fundamental nature of ${topic}.`,
        concept_tags: [topic, subject],
        error_trap_type: "Conceptual",
        usage_count: 0,
        accuracy_rate: 100,
        created_at: new Date().toISOString(),
        confidence: 1.0,
        hash: `fallback-${topic}-${Math.random().toString(36).substring(7)}`
    };
}

async function populateDatabase() {
    console.log("🚀 Starting Standalone Population Script...");
    console.log(`🎯 Target: ${QUESTIONS_PER_TOPIC_TARGET} questions per topic.`);

    let totalFilled = 0;
    let errors = 0;
    let skipped = 0;

    for (const [subject, topics] of Object.entries(SYLLABUS_DB) as [string, SyllabusTopic[]][]) {
        console.log(`\n📘 Subject: ${subject}`);

        for (const topicData of topics) {
            const topicName = topicData.topic;
            const className = topicData.class;

            // Determine exam category
            let examCategory = 'JEEMains';
            if (['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].includes(className)) examCategory = 'School Level';
            else if (subject === 'Biology') examCategory = 'NEET';
            else if (['History', 'Geography', 'Polity', 'Economy'].includes(subject)) examCategory = 'UPSC';

            try {
                // Check count
                const q = query(
                    collection(db, 'engine_questions'),
                    where('topic', '==', topicName)
                );

                const snap = await getCountFromServer(q);
                const currentCount = snap.data().count;

                if (currentCount >= QUESTIONS_PER_TOPIC_TARGET) {
                    skipped++;
                    process.stdout.write('.'); // Minimal output for skipped
                    continue;
                }

                const needed = QUESTIONS_PER_TOPIC_TARGET - currentCount;
                console.log(`\n   📌 ${topicName}: Found ${currentCount}, Adding ${needed}...`);

                for (let i = 0; i < needed; i++) {
                    const fallbackData = generateFallbackQuestion(examCategory, subject, topicName);

                    // Save to DB
                    const docRef = await addDoc(collection(db, 'engine_questions'), fallbackData);
                    console.log(`      ✅ Added Fallback Q: ${docRef.id}`);
                    totalFilled++;

                    // Sleep to be nice to Firestore
                    await new Promise(r => setTimeout(r, 100));
                }

            } catch (err) {
                console.error(`      🚨 Error on ${topicName}:`, err);
                errors++;
            }
        }
    }

    console.log(`\n🎉 Done!`);
    console.log(`   - Added: ${totalFilled}`);
    console.log(`   - Skipped (Already Full): ${skipped}`);
    console.log(`   - Errors: ${errors}`);
}

populateDatabase().then(() => process.exit(0));

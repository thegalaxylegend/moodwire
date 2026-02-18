import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SYLLABUS_DB, SyllabusTopic } from '../src/lib/constants';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------
// ADMIN INIT
// ----------------------
const serviceAccountPath = path.join(__dirname, "../service-account.json");
if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ Critical: service-account.json missing. Cannot run Admin Population.");
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

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
                // Check count using Admin SDK syntax
                const snap = await db.collection('engine_questions')
                    .where('topic', '==', topicName)
                    .count()
                    .get();

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

                    // Save to DB using Admin SDK syntax
                    const docRef = await db.collection('engine_questions').add(fallbackData);
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

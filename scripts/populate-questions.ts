import { db } from '../src/lib/firebase';
import { collection, query, where, getCountFromServer, addDoc } from 'firebase/firestore';
import { SYLLABUS_DB, SyllabusTopic } from '../src/lib/constants';
import { generateInspiredQuestion } from '../src/services/questionEngine';
import dotenv from 'dotenv';
dotenv.config();

const TOPIC_LIMIT = 50;

/**
 * Script to populate the database with questions for every topic in the syllabus.
 * It iterates through every Class, Subject, and Topic, checking if the question count < 50.
 * If < 50, it generates questions until the limit is reached.
 */
async function populateDatabase() {
    console.log("🚀 Starting Syllabus Population Script...");

    // Iterate over all subjects in the SYLLABUS_DB
    for (const [subject, topics] of Object.entries(SYLLABUS_DB) as [string, SyllabusTopic[]][]) {
        console.log(`\n📘 Processing Subject: ${subject}`);

        for (const topicData of topics) {
            const topicName = topicData.topic;
            const className = topicData.class;
            // Determine exam category based on class/subject context
            let examCategory = 'JEEMains'; // Default fallback

            if (['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].includes(className)) {
                examCategory = 'School Level';
            } else if (subject === 'Biology') {
                examCategory = 'NEET';
            } else if (['History', 'Geography', 'Polity', 'Economy'].includes(subject)) {
                examCategory = 'UPSC';
            }

            console.log(`   📌 Checking Topic: ${topicName} ([${className}] - ${examCategory})`);

            try {
                // 1. Check current count in DB
                const q = query(
                    collection(db, 'engine_questions'),
                    where('topic', '==', topicName),
                    where('exam', '==', examCategory)
                );

                const snap = await getCountFromServer(q);
                const currentCount = snap.data().count;

                if (currentCount >= TOPIC_LIMIT) {
                    console.log(`      ✅ Saturation Reached (${currentCount}/${TOPIC_LIMIT}). Skipping.`);
                    continue;
                }

                const needed = TOPIC_LIMIT - currentCount;
                console.log(`      ⚠️ Needs ${needed} more questions. Generating batch...`);

                // 2. Generate missing questions
                // We generate in small batches to avoid timeouts/rate-limits
                // For this script, we'll generate 1 at a time to be safe and rigorous
                for (let i = 0; i < needed; i++) {
                    // Alternate difficulties for variety
                    const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];
                    const diff = difficulties[i % 3];

                    console.log(`      🔨 Generating Q ${i + 1}/${needed} (${diff})...`);

                    const result = await generateInspiredQuestion({
                        exam: examCategory,
                        subject: subject,
                        topic: topicName,
                        difficulty: diff
                    });

                    if (result) {
                        console.log(`         ✨ Saved Question ID: ${result.id}`);
                    } else {
                        console.log(`         ❌ Generation Failed. Retrying next loop.`);
                    }

                    // Small delay to respect rate limits
                    await new Promise(r => setTimeout(r, 2000));
                }

            } catch (err) {
                console.error(`      🚨 Error processing ${topicName}:`, err);
            }
        }
    }

    console.log("\n🎉 Population Script Complete!");
}

// Run
populateDatabase();


import { db } from '../src/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { SYLLABUS_DB, SyllabusTopic } from '../src/lib/constants';
import dotenv from 'dotenv';
dotenv.config();

async function auditCounts() {
    console.log("📊 Starting Syllabus Audit...");
    let totalTopics = 0;
    let emptyTopics = 0;
    let totalQuestions = 0;

    for (const [subject, topics] of Object.entries(SYLLABUS_DB) as [string, SyllabusTopic[]][]) {
        for (const topicData of topics) {
            totalTopics++;
            const topicName = topicData.topic;
            // Simplified query - just check by topic name for now
            const q = query(
                collection(db, 'engine_questions'),
                where('topic', '==', topicName)
            );

            try {
                const snap = await getCountFromServer(q);
                const count = snap.data().count;
                totalQuestions += count;

                if (count === 0) {
                    emptyTopics++;
                    // console.log(`   ❌ EMPTY: ${topicName} (${subject})`);
                }
            } catch (e) {
                console.error(`Error checking ${topicName}:`, e);
            }
        }
    }

    console.log("\n📈 Audit Results:");
    console.log(`Total Topics: ${totalTopics}`);
    console.log(`Empty Topics: ${emptyTopics}`);
    console.log(`Total Questions: ${totalQuestions}`);
    console.log(`Coverage: ${((totalTopics - emptyTopics) / totalTopics * 100).toFixed(1)}%`);
}

auditCounts().then(() => process.exit(0));

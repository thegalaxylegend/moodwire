
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SYLLABUS_DB, SyllabusTopic } from '../src/lib/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_COUNT = 3;

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function generateFallbackEntry(exam: string, subject: string, topic: string, index: number) {
    const id = `fallback-${slugify(topic)}-${index}`;
    const text = `Practice Question ${index + 1}: Key concepts in ${topic}`;
    const slug = `${slugify(text)}-${id}`;

    // Determine URL prefix
    let prefix = 'jee-mains';
    if (exam === 'NEET') prefix = 'neet';
    else if (exam === 'UPSC') prefix = 'upsc';
    else if (exam === 'School Level') {
        // Simple mapping:
        prefix = 'class-10';
    }

    const url = `/${prefix}/q/${slug}`;

    return {
        url,
        data: {
            id,
            slug,
            text: `${text}?`,
            options: [
                `Fundamental concept of ${subject}`,
                `Advanced application of ${topic}`,
                `Experimental verification`,
                `Theoretical derivation`
            ],
            correctAnswer: 0,
            explanation: `This is a foundational question to test your understanding of ${topic} in ${subject}.`,
            subject,
            topic,
            sourceYear: "2024"
        }
    };
}

async function fillJsonDb() {
    console.log("🚀 Starting JSON DB Population...");

    const dbPath = path.join(__dirname, '../public/question-db.json');
    let db: Record<string, any> = {};

    if (fs.existsSync(dbPath)) {
        db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }

    console.log(`📦 Initial DB Size: ${Object.keys(db).length} questions.`);

    // Index existing topics
    const existingTopics = new Map<string, number>();
    Object.values(db).forEach((q: any) => {
        if (q.topic) {
            existingTopics.set(q.topic, (existingTopics.get(q.topic) || 0) + 1);
        }
    });

    let addedCount = 0;

    for (const [subject, topics] of Object.entries(SYLLABUS_DB) as [string, SyllabusTopic[]][]) {
        for (const topicData of topics) {
            const topicName = topicData.topic;
            const currentCount = existingTopics.get(topicName) || 0;
            const className = topicData.class;

            if (currentCount >= TARGET_COUNT) continue;

            const needed = TARGET_COUNT - currentCount;

            // Determine exam category
            let examCategory = 'JEEMains';
            if (['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].includes(className)) examCategory = 'School Level';
            else if (subject === 'Biology') examCategory = 'NEET';
            else if (['History', 'Geography', 'Polity', 'Economy'].includes(subject)) examCategory = 'UPSC';

            for (let i = 0; i < needed; i++) {
                const { url, data } = generateFallbackEntry(examCategory, subject, topicName, i);
                if (!db[url]) {
                    db[url] = data;
                    addedCount++;
                }
            }
        }
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`🎉 Done! Added ${addedCount} fallback questions.`);
    console.log(`📦 Final DB Size: ${Object.keys(db).length} questions.`);
}

fillJsonDb();

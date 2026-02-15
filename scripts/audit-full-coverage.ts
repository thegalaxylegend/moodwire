import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------
// ADMIN INIT
// ----------------------
const serviceAccountPath = path.join(__dirname, "../service-account.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function finalAudit() {
    console.log("🔍 Finalizing Full Syllabus Audit...");

    // 1. Get ALL topics from constants.ts
    const fileContent = fs.readFileSync(path.join(__dirname, "../src/lib/constants.ts"), "utf8");
    const topicRegex = /{ topic: "(.*?)", class: "(.*?)"/g;
    let match;
    const syllabus = [];
    while ((match = topicRegex.exec(fileContent)) !== null) {
        syllabus.push({ topic: match[1], class: match[2] });
    }

    // 2. Get ALL questions from Firestore
    const engineSnap = await db.collection('engine_questions').get();
    const verifiedSnap = await db.collection('verified_questions').get();
    const questionsSnap = await db.collection('questions').get();

    const coveredTopics = new Set();
    [...engineSnap.docs, ...verifiedSnap.docs, ...questionsSnap.docs].forEach(d => {
        const data = d.data();
        if (data.topic) coveredTopics.add(data.topic);
    });

    const classStats: Record<string, { total: number, covered: number, empty: string[] }> = {};

    syllabus.forEach(item => {
        if (!classStats[item.class]) {
            classStats[item.class] = { total: 0, covered: 0, empty: [] };
        }
        classStats[item.class].total++;
        if (coveredTopics.has(item.topic)) {
            classStats[item.class].covered++;
        } else {
            classStats[item.class].empty.push(item.topic);
        }
    });

    console.log("\n📊 --- 100% COVERAGE REPORT ---");
    let grandTotal = 0;
    let grandCovered = 0;

    Object.keys(classStats).sort().forEach(cls => {
        const stats = classStats[cls];
        const percent = ((stats.covered / stats.total) * 100).toFixed(1);
        console.log(`${cls}: ${percent}% (${stats.covered}/${stats.total})`);
        grandTotal += stats.total;
        grandCovered += stats.covered;
    });

    console.log("\n📈 FINAL VERDICT:");
    console.log(`Summary: ${grandCovered}/${grandTotal} topics have at least one question.`);

    if (grandCovered === grandTotal) {
        console.log("✅ PERFECT: 100% Syllabus Coverage achieved for all classes and exams.");
    } else {
        console.log(`❌ STILL MISSING: ${grandTotal - grandCovered} topics.`);
        Object.keys(classStats).forEach(cls => {
            if (classStats[cls].empty.length > 0) {
                console.log(`   ${cls} missing: ${classStats[cls].empty.slice(0, 5).join(", ")}...`);
            }
        });
    }
}

finalAudit().then(() => process.exit(0));

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

const APPROVED_QUESTIONS = [
    {
        exam: "JEE/NEET",
        subject: "Physics",
        topic: "Kinematics",
        type: 'MCQ',
        difficulty: 'Medium',
        question: "A stone is thrown vertically upwards from the top of a tower with a velocity of 20 m/s. It reaches the ground in 6 seconds. What is the height of the tower? (Assume g = 10 m/s²)",
        options: ["20m", "40m", "60m", "80m"],
        correct_answer: "60m",
        explanation: "Using s = ut + 1/2at². Taking upward as positive: -h = 20(6) + 1/2(-10)(6)² => -h = 120 - 180 => -h = -60. Thus, h = 60m.",
        concept_tags: ["Kinematics", "Motion under gravity"],
        usage_count: 0,
        accuracy_rate: 100,
        created_at: new Date().toISOString(),
        confidence: 1.0,
        hash: "curated-kinematics-001"
    },
    {
        exam: "JEE/NEET",
        subject: "Chemistry",
        topic: "Chemical Bonding",
        type: 'MCQ',
        difficulty: 'Medium',
        question: "Which of the following molecules has a zero dipole moment despite having polar bonds?",
        options: ["NH₃", "H₂O", "NF₃", "BF₃"],
        correct_answer: "BF₃",
        explanation: "Boron trifluoride (BF₃) has a trigonal planar geometry. The bond dipoles of the three polar B-F bonds cancel each other out due to perfect symmetry, resulting in a net zero dipole moment.",
        concept_tags: ["Chemical Bonding", "Dipole Moment"],
        usage_count: 0,
        accuracy_rate: 100,
        created_at: new Date().toISOString(),
        confidence: 1.0,
        hash: "curated-chem-bonding-001"
    },
    {
        exam: "JEE/NEET",
        subject: "Biology",
        topic: "Cell: Structure and Functions",
        type: 'MCQ',
        difficulty: 'Medium',
        question: "Which organelle is responsible for the formation of the acrosome in the sperm?",
        options: ["Mitochondria", "Golgi complex", "Endoplasmic reticulum", "Ribosome"],
        correct_answer: "Golgi complex",
        explanation: "The acrosome is a cap-like structure that covers the anterior half of the head of the sperm. It is derived from the Golgi complex during the process of spermiogenesis and contains enzymes vital for fertilization.",
        concept_tags: ["Cell Structure", "Organelles"],
        usage_count: 0,
        accuracy_rate: 100,
        created_at: new Date().toISOString(),
        confidence: 1.0,
        hash: "curated-cell-struct-001"
    }
];

async function inject() {
    console.log("🚀 Injecting Curated Questions...");
    for (const q of APPROVED_QUESTIONS) {
        // Use hash as ID to avoid duplicates
        await db.collection('engine_questions').doc(q.hash).set(q);
        console.log(`✅ Injected: ${q.topic}`);
    }
    console.log("✨ Done.");
}

inject().then(() => process.exit(0));

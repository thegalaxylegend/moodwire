import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Admin SDK Imports
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- CONSTANTS & CONFIG ---
const constantsPath = path.join(__dirname, '../src/lib/constants.ts');
const manifestPath = path.join(__dirname, '../public/seo-manifest.json');
const registryPath = path.join(__dirname, '../public/slug-registry.json');
const questionDbPath = path.join(__dirname, '../public/question-db.json');
const serviceAccountPath = path.join(__dirname, '../service-account.json');

const firebaseConfig = {
    apiKey: "AIzaSyAj0_vu8OxPWVHvAWSRVN90y9GIStvQASY",
    authDomain: "legendstech001.firebaseapp.com",
    projectId: "legendstech001",
    storageBucket: "legendstech001.firebasestorage.app",
    messagingSenderId: "749589426436",
    appId: "1:749589426436:web:64b0455b7f90a7849c6051",
    measurementId: "G-7MWNJDZ5D0"
};

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

async function getQuestionsFromAdminSDK() {
    console.log('🔑 Checking for Admin Credentials...');
    if (!fs.existsSync(serviceAccountPath)) return null;

    try {
        const admin = require('firebase-admin');
        const serviceAccount = require(serviceAccountPath);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        const db = admin.firestore();
        console.log('🛡️ Authenticated as Admin.');

        // Try 'verified_questions' first, then fallback to 'questions'
        let snap = await db.collection('verified_questions').get();
        if (snap.empty) {
            console.log('⚠️ verified_questions empty, trying "questions" collection...');
            snap = await db.collection('questions').get();
        }

        if (snap.empty) return [];

        return snap.docs.map(doc => {
            const data = doc.data();
            const text = data.text || data.question || 'Practice Question';
            const safeSlug = `${slugify(text.substring(0, 60))}-${doc.id}`;
            return {
                id: doc.id,
                slug: safeSlug,
                text,
                options: data.options || [],
                correctAnswer: data.correctAnswer !== undefined ? data.correctAnswer : (data.correct !== undefined ? data.correct : 0),
                explanation: data.explanation || '',
                subject: data.subject || '',
                topic: data.topic || '',
                sourceYear: data.sourceYear || ''
            };
        });

    } catch (e) {
        console.error('❌ Admin SDK Error:', e.message);
        return null;
    }
}

async function getQuestionsFromClientSDK() {
    console.log('🌍 Using Client SDK...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    try {
        await signInAnonymously(auth);
    } catch (e) { }

    // First try verified, then questions
    let snap = await getDocs(collection(db, 'verified_questions'));
    if (snap.empty) {
        snap = await getDocs(collection(db, 'questions'));
    }

    if (snap.empty) return [];

    const questions = [];
    snap.forEach(doc => {
        const data = doc.data();
        const text = data.text || data.question || 'Practice Question';
        const safeSlug = `${slugify(text.substring(0, 60))}-${doc.id}`;
        questions.push({
            id: doc.id,
            slug: safeSlug,
            text,
            options: data.options || [],
            correctAnswer: data.correctAnswer !== undefined ? data.correctAnswer : (data.correct !== undefined ? data.correct : 0),
            explanation: data.explanation || '',
            subject: data.subject || '',
            topic: data.topic || '',
            sourceYear: data.sourceYear || ''
        });
    });
    return questions;
}

async function generate() {
    console.log('🚀 Starting SEO Manifest Generation...');

    try {
        const questions = (await getQuestionsFromAdminSDK()) || (await getQuestionsFromClientSDK());
        console.log(`✅ Fetched ${questions.length} questions.`);

        const content = fs.readFileSync(constantsPath, 'utf8');
        const mappingMatch = content.match(/export const EXAM_SUBJECT_MAPPING: Record<string, string\[\]> = ({[\s\S]+?});/);
        const mappingStr = mappingMatch[1]
            .replace(/\/\/.*$/gm, '')
            .replace(/(['"])?([a-zA-Z0-9- ]+)(['"])?:/g, '"$2":')
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
        const EXAM_SUBJECT_MAPPING = JSON.parse(mappingStr);

        const SYLLABUS_DATA = {};
        const subjectRegex = /^\s*(?:['"]?)([\w\s]+)(?:['"]?):\s*\[/gm;
        let match;
        const subjects = [];
        while ((match = subjectRegex.exec(content)) !== null) {
            subjects.push({ name: match[1].trim(), start: match.index });
        }
        for (let i = 0; i < subjects.length; i++) {
            const subject = subjects[i];
            const nextStart = subjects[i + 1] ? subjects[i + 1].start : content.length;
            const block = content.substring(subject.start, nextStart);
            const topics = block.match(/topic:\s*["']([^"']+)["']/g)?.map(t => t.match(/["']([^"']+)["']/)[1]) || [];
            SYLLABUS_DATA[subject.name] = topics;
        }

        const manifest = {};
        const questionDb = {};

        Object.entries(EXAM_SUBJECT_MAPPING).forEach(([examSlug, subjects]) => {
            const formattedExam = examSlug.replace(/-/g, ' ').toUpperCase();
            const examUrl = `/${examSlug}`;

            manifest[examUrl] = {
                title: `${formattedExam} Exam Preparation | Mock Tests & PYQs`,
                description: `Best free resource for ${formattedExam} preparation. Practice mock tests, syllabus analysis, and previous year questions.`,
                h1: `Crack ${formattedExam}`,
                type: 'exam',
                priority: 1.0
            };

            subjects.forEach(subjectName => {
                const subjectSlug = slugify(subjectName);
                const subjectUrl = `${examUrl}/${subjectSlug}`;
                manifest[subjectUrl] = {
                    title: `${subjectName} for ${formattedExam} | Syllabus & PYQs`,
                    description: `Complete ${subjectName} preparation for your ${formattedExam} exam. Detailed syllabus, weightage and practice sets.`,
                    h1: `${subjectName} for ${formattedExam}`,
                    type: 'hub',
                    priority: 0.8
                };

                const topics = SYLLABUS_DATA[subjectName] || [];
                topics.forEach(topicName => {
                    const topicSlug = slugify(topicName);
                    const topicUrl = `${subjectUrl}/${topicSlug}`;
                    manifest[topicUrl] = {
                        title: `${topicName} - ${subjectName} Prep for ${formattedExam}`,
                        description: `Study ${topicName} from ${subjectName} for your ${formattedExam} preparation. Practice questions and AI roadmaps.`,
                        h1: topicName,
                        type: 'topic',
                        subject: subjectName,
                        exam: examSlug,
                        priority: 0.7
                    };
                });
            });

            questions.forEach(q => {
                // Modified linking: Case-insensitive match or contains
                const qSub = (q.subject || '').toLowerCase();
                const matchedSubject = subjects.find(s => s.toLowerCase() === qSub || qSub.includes(s.toLowerCase()));

                if (matchedSubject || !q.subject) {
                    const qUrl = `/${examSlug}/q/${q.slug}`;
                    manifest[qUrl] = {
                        title: `Q: ${q.text.substring(0, 50)}... | ${formattedExam} Practice`,
                        description: `Detailed solution for ${q.subject} question: ${q.text.substring(0, 100)}... Prepare for ${formattedExam}.`,
                        h1: q.text,
                        type: 'question',
                        priority: 0.5
                    };
                    questionDb[qUrl] = q;
                }
            });
        });

        const urls = Object.keys(manifest);
        if (urls.length === 0) throw new Error("Manifest empty");

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        fs.writeFileSync(registryPath, JSON.stringify(urls, null, 2));
        fs.writeFileSync(questionDbPath, JSON.stringify(questionDb, null, 2));

        console.log(`✅ Manifest generated with ${urls.length} URLs.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ FATAL:', error);
        process.exit(1);
    }
}

generate();

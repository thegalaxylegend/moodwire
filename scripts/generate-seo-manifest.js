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
const publicDir = path.join(__dirname, '../public');
const distDir = path.join(__dirname, '../dist');
const serviceAccountPath = path.join(__dirname, '../service-account.json');

const MANIFEST_NAME = 'seo-manifest.json';
const REGISTRY_NAME = 'slug-registry.json';
const QUESTION_DB_NAME = 'question-db.json';
const questionDbPathInPublic = path.join(publicDir, QUESTION_DB_NAME);

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

        // Fetch ALL questions from all collections to ensure maximum SEO coverage
        const verifiedSnap = await db.collection('verified_questions').select('topic', 'text', 'sourceYear', 'subject', 'options', 'correctAnswer', 'correct', 'explanation').get();
        const questionsSnap = await db.collection('questions').select('topic', 'text', 'sourceYear', 'subject', 'options', 'correctAnswer', 'correct', 'explanation').get();
        const engineSnap = await db.collection('engine_questions').select('topic', 'text', 'sourceYear', 'subject', 'options', 'correctAnswer', 'correct', 'explanation').get();

        console.log(`📊 Found ${verifiedSnap.size} verified, ${questionsSnap.size} standard, and ${engineSnap.size} engine questions.`);

        const allDocs = new Map();

        // 1. Add verified questions
        verifiedSnap.docs.forEach(doc => allDocs.set(doc.id, doc));

        // 2. Add standard questions
        questionsSnap.docs.forEach(doc => {
            if (!allDocs.has(doc.id)) {
                allDocs.set(doc.id, doc);
            }
        });

        // 3. Add engine questions (Curated/AI generated)
        engineSnap.docs.forEach(doc => {
            if (!allDocs.has(doc.id)) {
                allDocs.set(doc.id, doc);
            }
        });

        const snap = { empty: allDocs.size === 0, docs: Array.from(allDocs.values()) };

        if (snap.empty) {
            console.log('⚠️ Both collections are empty.');
            return [];
        }

        if (snap.empty) return [];

        return snap.docs.map(doc => {
            const data = doc.data();
            const text = data.text || data.question || 'Practice Question';
            const safeSlug = `${slugify(text.substring(0, 60))}-${doc.id}`.toLowerCase();
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

    try {
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
            const safeSlug = `${slugify(text.substring(0, 60))}-${doc.id}`.toLowerCase();
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
    } catch (e) {
        console.error('❌ Client SDK Error:', e.message);
        return null; // Triggers fallback to local question cache
    }
}

async function generate() {
    console.log('🚀 Starting SEO Manifest Generation...');

    try {
        let questions = (await getQuestionsFromAdminSDK()) || (await getQuestionsFromClientSDK());

        // FAIL-SAFE: If Firestore fails or is empty, load from local JSON (filled by fill-json-db.ts)
        if (!questions || questions.length === 0) {
            console.log("⚠️ Firestore connection failed or returned empty. Loading from local 'question-db.json'...");
            if (fs.existsSync(questionDbPathInPublic)) {
                const localDb = JSON.parse(fs.readFileSync(questionDbPathInPublic, 'utf8'));
                questions = Object.values(localDb);
                console.log(`✅ Loaded ${questions.length} questions from local backup.`);
            }
        }

        console.log(`✅ Final Question Count: ${questions ? questions.length : 0}`);

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

        // === INJECT HOME ROUTE ===
        manifest['/'] = {
            title: "Exam Compass | AI-Powered Exam Preparation & Mock Tests",
            description: "The ultimate AI study partner for Class 6-12 board exams, JEE, NEET, and UPSC. Get personalized mock tests, PYQ analytics, and honest roadmaps for Indian aspirants.",
            h1: "AI-Powered Exam Preparation",
            type: "home",
            priority: 1.0
        };

        // === INJECT POLICY PAGES (Required for AdSense) ===
        manifest['/privacy'] = {
            title: "Privacy Policy | Exam Compass",
            description: "Read the Exam Compass Privacy Policy. Learn how we collect, use, and protect your personal data, including information about cookies, analytics, and third-party advertising.",
            h1: "Privacy Policy",
            type: "page",
            priority: 0.3
        };
        manifest['/terms'] = {
            title: "Terms of Service | Exam Compass",
            description: "Read the Exam Compass Terms of Service. Understand the rules and guidelines for using our AI-powered exam preparation platform.",
            h1: "Terms of Service",
            type: "page",
            priority: 0.3
        };
        manifest['/about'] = {
            title: "About Exam Compass | AI-Powered Exam Preparation Platform",
            description: "Learn about Exam Compass — an AI-powered exam preparation platform built by a Class 11 student from KV Darbhanga, Bihar.",
            h1: "About Exam Compass",
            type: "page",
            priority: 0.5
        };
        manifest['/contact'] = {
            title: "Contact Us | Exam Compass",
            description: "Get in touch with the Exam Compass team. Contact us for questions, feedback, bug reports, or partnership inquiries.",
            h1: "Contact Us",
            type: "page",
            priority: 0.3
        };

        // === INJECT BLOG ROUTES ===
        const blogsDir = path.join(__dirname, '../src/content/blogs');
        manifest['/blog'] = {
            title: "Exam Compass Blog | AI Exam Prep Tips & Strategies",
            description: "Expert strategies, syllabus breakdowns, and exam preparation tips for JEE, NEET, UPSC, and CBSE Class 10-12 students.",
            h1: "Exam Compass Blog",
            type: "blog-index",
            priority: 0.9
        };

        if (fs.existsSync(blogsDir)) {
            const blogFiles = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
            blogFiles.forEach(file => {
                const slug = file.replace('.md', '');
                const fileContent = fs.readFileSync(path.join(blogsDir, file), 'utf8');

                // Simple regex to grab frontmatter title and description
                const titleMatch = fileContent.match(/title:\s*["'](.*?)["']/);
                const descMatch = fileContent.match(/description:\s*["'](.*?)["']/);
                const dateMatch = fileContent.match(/date:\s*["'](.*?)["']/);
                const categoryMatch = fileContent.match(/category:\s*["'](.*?)["']/);

                manifest[`/blog/${slug}`] = {
                    title: titleMatch ? titleMatch[1] : `${slug.replace(/-/g, ' ')} | Exam Compass`,
                    description: descMatch ? descMatch[1] : `Read ${slug.replace(/-/g, ' ')} on Exam Compass Blog.`,
                    date: dateMatch ? dateMatch[1] : 'March 4, 2024',
                    category: categoryMatch ? categoryMatch[1] : 'Exam Prep',
                    h1: titleMatch ? titleMatch[1] : slug,
                    type: "blog-post",
                    priority: 0.8
                };
            });
            console.log(`✅ Added ${blogFiles.length} blog routes to manifest.`);
        }

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

                    const cleanTopic = topicName.replace(/\[.*?\]\s*/g, '');
                    const shortTopic = cleanTopic.length > 35 ? `${cleanTopic.substring(0, 32)}...` : cleanTopic;

                    manifest[topicUrl] = {
                        title: `${shortTopic} PYQs | ${formattedExam}`,
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

        console.log(`Debug: Manifest Keys: ${urls.length}`);
        console.log(`Debug: QuestionDB Keys: ${Object.keys(questionDb).length}`);

        // Write to BOTH public and dist
        const outputDirs = [publicDir, distDir];
        outputDirs.forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, MANIFEST_NAME), JSON.stringify(manifest, null, 2));
            fs.writeFileSync(path.join(dir, REGISTRY_NAME), JSON.stringify(urls, null, 2));
            fs.writeFileSync(path.join(dir, QUESTION_DB_NAME), JSON.stringify(questionDb, null, 2));
        });

        console.log(`✅ Manifests and registries written to public/ and dist/.`);

        console.log(`✅ Manifest generated with ${urls.length} URLs.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ FATAL:', error);
        process.exit(1);
    }
}

generate();

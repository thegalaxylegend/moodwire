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

const SUBJECT_GROUPS = {
    'Social Science': ['History', 'Geography', 'Polity', 'Economy', 'Civics', 'Social Studies'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'General Science', 'Environmental Science'],
    'General Studies': ['History', 'Geography', 'Polity', 'Economy', 'Current Affairs', 'General Science']
};

async function getQuestionsFromAdminSDK() {
    console.log('🔑 Checking for Admin Credentials...');
    
    let serviceAccount;
    if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log('📝 Found service account in environment variables.');
        } catch (e) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e.message);
        }
    }

    if (!serviceAccount) return null;

    try {
        const admin = require('firebase-admin');

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
            const topics = [];
            const objBlocks = [...block.matchAll(/{[\s\S]*?}/g)].map(m => m[0]);
            objBlocks.forEach(objStr => {
                const topicNameMatch = objStr.match(/topic:\s*(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')/);
                const classMatch = objStr.match(/class:\s*(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')/);
                if (topicNameMatch) {
                    const topic = (topicNameMatch[1] || topicNameMatch[2] || '').replace(/\\"/g, '"').replace(/\\'/g, "'");
                    const cls = classMatch ? (classMatch[1] || classMatch[2] || '').replace(/Class\s*/i, '').trim() : '';
                    topics.push({ topic, class: cls });
                }
            });
            SYLLABUS_DATA[subject.name] = topics;
        }

        const manifest = {};
        const questionDb = {};
        const questionCanonicalMap = {}; // Tracks which exam "owns" each question for canonical URLs
        const topicQuestionCounts = {}; // Tracks density to spin-up collections

        // === INJECT HOME ROUTE ===
        manifest['/'] = {
            title: "Exam Compass | AI-Powered Prep for JEE Main & Adv, NEET, Boards (8-12)",
            description: "The ultimate AI study partner for Classes 8-12, JEE Main & Advanced, and NEET UG. Get personalized mock tests, PYQ analytics, and honest preparation roadmaps.",
            h1: "AI-Powered Exam Preparation",
            type: "home",
            priority: 1.0,
            robots: "index, follow",
            sitemapGroup: "core"
        };

        // === INJECT POLICY PAGES (Required for AdSense) ===
        manifest['/privacy'] = {
            title: "Privacy Policy | Exam Compass",
            description: "Read the Exam Compass Privacy Policy. Learn how we collect, use, and protect your personal data, including information about cookies and analytics.",
            h1: "Privacy Policy",
            type: "page",
            priority: 0.3,
            robots: "index, follow",
            sitemapGroup: "core"
        };
        manifest['/terms'] = {
            title: "Terms of Service | Exam Compass",
            description: "Read the Exam Compass Terms of Service. Understand the rules and guidelines for using our AI-powered exam preparation platform.",
            h1: "Terms of Service",
            type: "page",
            priority: 0.3,
            robots: "index, follow",
            sitemapGroup: "core"
        };
        manifest['/about'] = {
            title: "About Exam Compass | AI-Powered Exam Preparation Platform",
            description: "Learn about Exam Compass — an AI-powered exam preparation platform built by a Class 12 student from KV Darbhanga, Bihar.",
            h1: "About Exam Compass",
            type: "page",
            priority: 0.5,
            robots: "index, follow",
            sitemapGroup: "core"
        };
        manifest['/founder'] = {
            title: "Ayush Kumar | Founder of ExamCompass",
            description: "Meet Ayush Kumar, the student developer who built ExamCompass — a state-of-the-art AI-powered JEE/NEET diagnostics platform from Darbhanga, Bihar.",
            h1: "Ayush Kumar - Founder of ExamCompass",
            type: "page",
            priority: 0.9,
            robots: "index, follow",
            sitemapGroup: "core"
        };
        manifest['/contact'] = {
            title: "Contact Us | Exam Compass",
            description: "Get in touch with the Exam Compass team. Contact us for questions, feedback, bug reports, or partnership inquiries regarding our AI exam prep platform.",
            h1: "Contact Us",
            type: "page",
            priority: 0.3,
            robots: "index, follow",
            sitemapGroup: "core"
        };

        // === INJECT BLOG ROUTES ===
        const blogsDir = path.join(__dirname, '../src/content/blogs');
        manifest['/blog'] = {
            title: "Exam Compass Blog | AI Exam Prep Tips & Strategies",
            description: "Expert strategies, syllabus breakdowns, and exam preparation tips for JEE Main & Advanced, NEET UG, and CBSE board exams for Classes 8-12.",
            h1: "Exam Compass Blog",
            type: "blog-index",
            priority: 0.9,
            robots: "index, follow",
            sitemapGroup: "blogs"
        };

        if (fs.existsSync(blogsDir)) {
            const blogFiles = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
            blogFiles.forEach(file => {
                const slug = file.replace('.md', '');
                const fileContent = fs.readFileSync(path.join(blogsDir, file), 'utf8');

                // Enhanced metadata extraction for standard and "Rich SEO" formats
                const titleMatch = fileContent.match(/title:\s*["'](.*?)["']/) || fileContent.match(/- \*\*SEO Title:\*\* (.*)/);
                const descMatch = fileContent.match(/description:\s*["'](.*?)["']/) || fileContent.match(/- \*\*Meta Description:\*\* (.*)/);
                const dateMatch = fileContent.match(/date:\s*["'](.*?)["']/) || fileContent.match(/- \*\*Published Date:\*\* (.*)/);
                const categoryMatch = fileContent.match(/category:\s*["'](.*?)["']/) || fileContent.match(/- \*\*Category:\*\* (.*)/);
                const h1Match = fileContent.match(/^# (.*)/m);

                const extractedTitle = titleMatch ? titleMatch[1].trim() : `${slug.replace(/-/g, ' ')} | Exam Compass`;
                const extractedDesc = descMatch ? descMatch[1].trim() : `Read ${slug.replace(/-/g, ' ')} on Exam Compass Blog.`;

                manifest[`/blog/${slug}`] = {
                    title: extractedTitle,
                    description: extractedDesc,
                    date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),

                    category: categoryMatch ? categoryMatch[1].trim() : 'Exam Prep',
                    h1: h1Match ? h1Match[1].trim() : (titleMatch ? titleMatch[1].trim() : slug),
                    type: "blog-post",
                    priority: 0.8,
                    robots: "index, follow",
                    sitemapGroup: "blogs"
                };
            });
            console.log(`✅ Added ${blogFiles.length} blog routes to manifest.`);
        }

        Object.entries(EXAM_SUBJECT_MAPPING).forEach(([examSlug, subjects]) => {
            const formattedExam = examSlug.replace(/-/g, ' ').toUpperCase();
            const examUrl = `/${examSlug}`;
            manifest[`${examUrl}`] = {
                title: `${formattedExam} Exam Preparation | Mock Tests & PYQs`,
                description: `Best free resource for ${formattedExam} preparation. Practice mock tests, syllabus analysis, and previous year questions.`,
                h1: `Crack ${formattedExam}`,
                type: 'exam',
                priority: 1.0,
                robots: "index, follow",
                sitemapGroup: "core"
            };

            subjects.forEach(subjectName => {
                const subjectSlug = slugify(subjectName);
                const subjectUrl = `${examUrl}/${subjectSlug}`;
                manifest[`${subjectUrl}`] = {
                    title: `${subjectName} for ${formattedExam} | Syllabus & PYQs`,
                    description: `Complete ${subjectName} preparation for your ${formattedExam} exam. Detailed syllabus, weightage and practice sets.`,
                    h1: `${subjectName} for ${formattedExam}`,
                    type: 'hub',
                    priority: 0.8,
                    robots: "index, follow",
                    sitemapGroup: "core"
                };

                const topics = SYLLABUS_DATA[subjectName] || [];
                topics.forEach(topicObj => {
                    const topicName = typeof topicObj === 'string' ? topicObj : topicObj.topic;
                    const topicClass = typeof topicObj === 'string' ? '' : topicObj.class;

                    // Filter topic by exam's valid classes to avoid duplicate / wrong class topics
                    if (topicClass) {
                        const examClassNum = examSlug.replace('class-', '');
                        const isJeeNeet = examSlug === 'jee-mains' || examSlug === 'jee-advanced' || examSlug === 'neet';
                        if (isJeeNeet) {
                            if (topicClass !== '11' && topicClass !== '12') return;
                        } else {
                            if (topicClass !== examClassNum) return;
                        }
                    }

                    const topicSlug = slugify(topicName);
                    const topicUrl = `${subjectUrl}/${topicSlug}`;

                    const cleanTopic = topicName.replace(/\[.*?\]\s*/g, '');
                    const shortTopic = cleanTopic.length > 35 ? `${cleanTopic.substring(0, 32)}...` : cleanTopic;

                    manifest[`${topicUrl}`] = {
                        title: `${shortTopic} PYQs | ${formattedExam}`,
                        description: `Study ${topicName} from ${subjectName} for your ${formattedExam} preparation. Practice questions and AI roadmaps.`,
                        h1: topicName,
                        type: 'topic',
                        subject: subjectName,
                        exam: examSlug,
                        priority: 0.7,
                        robots: "index, follow",
                        sitemapGroup: "topics"
                    };
                });
            });

            questions.forEach(q => {
                const qSub = (q.subject || '').toLowerCase();
                
                // Enhanced matching logic
                const isMatch = subjects.some(s => {
                    const examSub = s.toLowerCase();
                    // Direct match
                    if (examSub === qSub || (qSub.includes(examSub) && !(examSub === 'science' && qSub.includes('social science')))) return true;
                    // Group match (e.g., if exam has "Social Science" and question is "History")
                    const group = SUBJECT_GROUPS[s];
                    if (group && group.some(sub => sub.toLowerCase() === qSub)) return true;
                    return false;
                });

                if (isMatch || !q.subject) {
                    const qUrl = `/${examSlug}/q/${q.slug}`;
                    
                    // CANONICAL FIX: Track which exam first "owns" this question
                    // First exam to claim a slug gets canonical ownership
                    if (!questionCanonicalMap[q.slug]) {
                        questionCanonicalMap[q.slug] = examSlug;
                    }
                    
                    
                    // PHASE 2 - Strategic Indexing for Free Domain (.pages.dev)
                    // Google gives low crawl budget to free subdomains.
                    // Strategy: Index questions with REAL content (explanation >= 10 words)
                    // This gives Google quality pages, not thin content.
                    const isCanonical = questionCanonicalMap[q.slug] === examSlug;
                    const expWords = q.explanation ? q.explanation.split(/\s+/).length : 0;
                    
                    let robotsRule = "noindex, nofollow"; // Default for all questions
                    
                    const isPlaceholder = q.text === "Practice Question" || 
                                          (q.explanation && q.explanation.toLowerCase().includes("placeholder"));

                    // INDEX if: canonical + has a meaningful explanation (10+ words) + is NOT a placeholder
                    if (isCanonical && expWords >= 10 && !isPlaceholder) {
                        robotsRule = "index, follow";
                    }

                    const qUrlNoSlash = qUrl.replace(/\/$/, '');
                    manifest[qUrlNoSlash] = {
                        title: `Q: ${q.text.substring(0, 30)}... | ${formattedExam} Practice`,
                        description: `Detailed solution for ${q.subject} question: ${q.text.substring(0, 100)}... Prepare for ${formattedExam}.`,
                        h1: q.text,
                        type: 'question',
                        priority: 0.5,
                        canonicalExam: questionCanonicalMap[q.slug],
                        canonical: `/${questionCanonicalMap[q.slug]}/q/${q.slug}`,
                        robots: robotsRule,
                        sitemapGroup: robotsRule === "index, follow" ? "questions" : "questions-noindex"
                    };
                    questionDb[qUrlNoSlash] = { ...q, canonicalExam: questionCanonicalMap[q.slug] };
                    
                    // Track Topic Density for Phase 3 Programmatic Collection Creation
                    const matchedSubject = subjects.find(s => {
                        const examSub = s.toLowerCase();
                        if (examSub === qSub || (qSub.includes(examSub) && !(examSub === 'science' && qSub.includes('social science')))) return true;
                        const group = SUBJECT_GROUPS[s];
                        if (group && group.some(sub => sub.toLowerCase() === qSub)) return true;
                        return false;
                    }) || subjects[0];

                    const topicList = SYLLABUS_DATA[matchedSubject] || [];
                    const matchedSyllabusTopic = q.topic ? topicList.find(t => {
                          const tName = typeof t === 'string' ? t : t.topic;
                          const qTopicClean = (q.topic || '').toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                          const sTopicClean = tName.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                          return qTopicClean === sTopicClean;
                      }) : null;

                     if (q.subject && matchedSyllabusTopic) {
                         const topicName = typeof matchedSyllabusTopic === 'string' ? matchedSyllabusTopic : matchedSyllabusTopic.topic;
                         const topicClass = typeof matchedSyllabusTopic === 'string' ? '' : matchedSyllabusTopic.class;

                         // Filter match by class context to avoid wrong class collections
                         if (topicClass) {
                             const examClassNum = examSlug.replace('class-', '');
                             const isJeeNeet = examSlug === 'jee-mains' || examSlug === 'jee-advanced' || examSlug === 'neet';
                             if (isJeeNeet) {
                                 if (topicClass !== '11' && topicClass !== '12') return;
                             } else {
                                 if (topicClass !== examClassNum) return;
                             }
                         }

                         const targetUrl = `/${examSlug}/${slugify(matchedSubject)}/${slugify(topicName)}`;
                         if (!topicQuestionCounts[targetUrl]) {
                             topicQuestionCounts[targetUrl] = {
                                 topicName: topicName,
                                 examSlug: examSlug,
                                 formattedExam: formattedExam,
                                 count: 0
                             };
                         }
                         topicQuestionCounts[targetUrl].count++;
                    }
                }
            });
        });

        // ============================================
        // PHASE 3: DYNAMIC PYQ COLLECTION GENERATION
        // ============================================
        let collectionsCreated = 0;
        Object.entries(topicQuestionCounts).forEach(([topicUrl, data]) => {
            if (data.count >= 1) {
                // Fix: Detect doubled slugs (e.g. /physics/physics) and collapse them
                const urlParts = topicUrl.split('/').filter(Boolean);
                let normalizedUrl = topicUrl;

                if (urlParts.length >= 3 && urlParts[1].toLowerCase() === urlParts[2].toLowerCase()) {
                    console.warn(`🧹 Normalizing doubled slug for PYQ collection: ${topicUrl}`);
                    // Collapse /subject/subject/topic to /subject/topic
                    normalizedUrl = "/" + [urlParts[0], urlParts[1], ...urlParts.slice(3)].join("/");
                    // Special case: if it was exam/subject/subject, it becomes exam/subject
                }

                const pyqUrl = `${normalizedUrl}/top-50-pyqs`.replace(/\/+/g, '/');
                
                manifest[pyqUrl] = {
                   title: `Top 50 Most Repeated ${data.topicName} PYQs | ${data.formattedExam}`,
                   description: `A curated collection of the most important questions from ${data.topicName}, fully solved with step-by-step concepts to prepare for ${data.formattedExam}.`,
                   h1: `Top 50 PYQs: ${data.topicName}`,
                   type: 'collection',
                   priority: 0.8,
                   robots: "index, follow",
                   sitemapGroup: "core"
                };
                collectionsCreated++;
            }
        });
        console.log(`✅ Phase 3: Generated ${collectionsCreated} Programmatic PYQ Collections.`);

        // Normalize all meta descriptions to be strictly between 120 and 160 characters
        const formatDescription = (desc) => {
            if (!desc) desc = "";
            desc = desc.trim();
            if (desc.length < 120) {
                const suffix = " Access free chapter-wise revision notes, NTA PYQs, and calibrated AI mock tests on Exam Compass.";
                desc = (desc + suffix).substring(0, 157);
                if (desc.length < 120) {
                    desc = desc.padEnd(120, '.');
                }
            } else if (desc.length > 160) {
                desc = desc.substring(0, 157) + "...";
            }
            return desc;
        };

        Object.keys(manifest).forEach(url => {
            if (manifest[url]) {
                if (manifest[url].title) {
                    manifest[url].title = manifest[url].title.replace(/"/g, "'");
                }
                if (manifest[url].description) {
                    manifest[url].description = formatDescription(manifest[url].description).replace(/"/g, "'");
                }
                if (manifest[url].h1) {
                    manifest[url].h1 = manifest[url].h1.replace(/"/g, "'");
                }
            }
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

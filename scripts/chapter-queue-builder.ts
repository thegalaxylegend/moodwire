import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { SYLLABUS_DB } from '../src/lib/constants.js';

// Flatten the SYLLABUS_DB into a list that covers all topics
// We'll organize it based on the user's requested order: 11, 12, 10, 9, 8.
const CLASS_ORDER = ["Class 11", "Class 12", "Class 10", "Class 9", "Class 8"];

function getFullSyllabus() {
    const list: any[] = [];
    
    const PCMB_CS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'];
    
    // First, add topics from the specified class order
    for (const cls of CLASS_ORDER) {
        for (const [subject, topics] of Object.entries(SYLLABUS_DB)) {
            const isSenior = ["Class 11", "Class 12"].includes(cls);
            
            // Filter: Class 11/12 only gets PCMB + Computer Science
            if (isSenior && !PCMB_CS.includes(subject)) {
                continue;
            }

            const filtered = topics.filter(t => t.class === cls);
            filtered.forEach(t => list.push({ ...t, subject }));
        }
    }

    // Then, add everything else (competitive exams or topics not in those classes)
    for (const [subject, topics] of Object.entries(SYLLABUS_DB)) {
        const others = topics.filter(t => !CLASS_ORDER.includes(t.class));
        others.forEach(t => list.push({ ...t, subject }));
    }

    // Remove duplicates if any (just in case)
    const unique = new Map();
    list.forEach(item => {
        const key = `${item.topic}-${item.class}`;
        if (!unique.has(key)) unique.set(key, item);
    });

    return Array.from(unique.values());
}

const SYLLABUS_FULL_LIST = getFullSyllabus();

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const QUEUE_FILE = path.join(__dirname, '../queue.json');
const SEARCH_INTEL_FILE = path.join(REPORTS_DIR, 'search-intelligence.json');

function slugify(text: string) {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

/**
 * 🕵️ Scout Mode: Reads GSC intelligence to find "Rising Stars"
 * (Keywords with high impressions but no dedicated high-ranking page)
 */
function getScoutBoosts(): Record<string, number> {
    if (!fs.existsSync(SEARCH_INTEL_FILE)) return {};
    try {
        const intel = JSON.parse(fs.readFileSync(SEARCH_INTEL_FILE, 'utf-8'));
        const boosts: Record<string, number> = {};
        
        // 1. Boost from Global Top Keywords
        (intel.globalTopKeywords || []).forEach((k: any) => {
            const query = k.query.toLowerCase();
            boosts[query] = (boosts[query] || 0) + Math.min(20, k.impressions / 100);
        });

        // 2. Boost from Page-level opportunities (topics getting impressions but low CTR)
        Object.values(intel.pages || {}).forEach((p: any) => {
            if (p.impressions > 50) {
                p.topQueries.slice(0, 3).forEach((q: any) => {
                    const query = q.query.toLowerCase();
                    boosts[query] = (boosts[query] || 0) + 10;
                });
            }
        });

        return boosts;
    } catch { return {}; }
}

async function buildQueue() {
    console.log("🔍 Jules Scout: Scanning for high-yield missing blogs...");

    if (!fs.existsSync(BLOG_DIR)) {
        console.error("❌ Blog directory not found:", BLOG_DIR);
        process.exit(1);
    }

    const existingBlogs = fs.readdirSync(BLOG_DIR).map(f => (f as string).replace('.md', ''));
    const missingTopics: any[] = [];
    const scoutBoosts = getScoutBoosts();
    const currentMonth = new Date().getMonth(); // 0-11 (April is 3)

    const getCoreIdentity = (text: string) => {
        return text.toLowerCase()
            .replace(/revision|notes|class|physics|chemistry|biology|maths|mathematics|notes|recall|concepts|principles/g, ' ')
            .replace(/[^a-z0-9\s]+/g, ' ') 
            .split(/\s+/)
            .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'some', 'from', 'this', 'that', 'our'].includes(w))
            .sort()
            .join(' ')
            .trim();
    };

    for (const item of SYLLABUS_FULL_LIST) {
        const itemIdentity = getCoreIdentity(item.topic);
        const classNum = item.class.replace('Class ', '');
        const slug1 = slugify(`${item.topic}-class-${classNum}-notes`);
        
        const isDuplicate = existingBlogs.some((blogName: string) => {
            const blogIdentity = getCoreIdentity(blogName);
            return (itemIdentity.length > 0 && (blogIdentity.includes(itemIdentity) || itemIdentity.includes(blogIdentity))) || 
                   blogName.includes(slugify(item.topic)) || 
                   blogName === slug1;
        });

        if (!isDuplicate && itemIdentity.length > 0) {
            // --- SCORING ENGINE ---
            let priorityScore = 0;

            // 1. Base Class Priority (11/12 are higher)
            if (item.class === "Class 12") priorityScore += 50;
            else if (item.class === "Class 11") priorityScore += 40;
            else if (item.class === "Class 10") priorityScore += 30;

            // 2. Subject Priority (Science > Humanities for JEE/NEET focusing months)
            const isScience = ['Physics', 'Chemistry', 'Biology', 'Mathematics'].includes(item.subject);
            if (isScience) priorityScore += 20;

            // 3. Scout Boost (GSC Data Integration)
            const topicWords = item.topic.toLowerCase().split(/\s+/);
            for (const [query, boost] of Object.entries(scoutBoosts)) {
                if (topicWords.some((w: string) => query.includes(w))) {
                    priorityScore += boost;
                }
            }

            // 4. Exam Season Awareness (April/May = Heavy Science/Competitive focus)
            if ((currentMonth === 3 || currentMonth === 4) && isScience) {
                priorityScore += 15;
            }

            missingTopics.push({
                subject: item.subject,
                topic: item.topic,
                class: item.class,
                targetSlug: slug1,
                priorityScore: Math.round(priorityScore)
            });
        }
    }

    // Sort by priorityScore (highest first)
    missingTopics.sort((a, b) => b.priorityScore - a.priorityScore);

    console.log(`📊 Identified ${missingTopics.length} potential topics.`);
    
    // Select top 3
    const queue = missingTopics.slice(0, 3);

    if (queue.length === 0) {
        console.log("✅ All chapters are covered! No new blogs needed.");
        return;
    }

    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
    console.log(`🚀 Jules: Scout Queue created at ${QUEUE_FILE}`);
    console.table(queue.map(q => ({ topic: q.topic, score: q.priorityScore, class: q.class })));
}

buildQueue().catch(console.error);

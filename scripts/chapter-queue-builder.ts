import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { SYLLABUS_DB } from '../src/lib/constants';

// Flatten the SYLLABUS_DB into a list that covers all topics
// We'll organize it based on the user's requested order: 11, 12, 10, 9, 8, 7, 6, then others.
const CLASS_ORDER = ["Class 11", "Class 12", "Class 10", "Class 9", "Class 8", "Class 7", "Class 6"];

function getFullSyllabus() {
    const list: any[] = [];
    
    // First, add topics from the specified class order
    for (const cls of CLASS_ORDER) {
        for (const [subject, topics] of Object.entries(SYLLABUS_DB)) {
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
const QUEUE_FILE = path.join(__dirname, '../queue.json');

function slugify(text: string) {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

async function buildQueue() {
    console.log("🔍 Jules: Scanning for missing blogs...");

    // 1. Get existing blogs
    if (!fs.existsSync(BLOG_DIR)) {
        console.error("❌ Blog directory not found:", BLOG_DIR);
        process.exit(1);
    }

    const existingBlogs = fs.readdirSync(BLOG_DIR).map(f => (f as string).replace('.md', ''));
    const missingTopics: any[] = [];

    // Helper: Create a "Core Identity" for 100% accurate comparison
    // Removes fluff like 'of', 'the', 'class' and focuses ONLY on the subject keywords
    const getCoreIdentity = (text: string) => {
        return text.toLowerCase()
            .replace(/revision|notes|class|physics|chemistry|biology|maths|mathematics|notes|recall|concepts|principles/g, ' ')
            .replace(/[^a-z0-9\s]+/g, ' ') // Keep numbers for chapters
            .split(/\s+/)
            .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'some', 'from', 'this', 'that', 'our'].includes(w))
            .sort()
            .join(' ')
            .trim();
    };

    // 2. Identify missing topics
    for (const item of SYLLABUS_FULL_LIST) {
        const itemIdentity = getCoreIdentity(item.topic);
        const slug1 = slugify(item.topic + "-class-" + item.class.replace('Class ', '') + "-notes");
        
        // Smarter check: Compare core content keywords
        const isDuplicate = existingBlogs.some((blogName: string) => {
            const blogIdentity = getCoreIdentity(blogName);
            
            // Match if core keywords are identical, or if filenames are very similar
            return (itemIdentity.length > 0 && blogIdentity.includes(itemIdentity)) || 
                   (blogIdentity.length > 0 && itemIdentity.includes(blogIdentity)) ||
                   blogName.includes(slugify(item.topic)) || 
                   blogName === slug1 ||
                   blogName.replace(/-revision-notes$/, '-notes') === slug1 ||
                   slug1.replace(/-notes$/, '-revision-notes') === blogName ||
                   blogName.replace(/-class-\d+-notes$/, '-notes') === slug1.replace(/-class-\d+-notes$/, '-notes');
        });

        if (!isDuplicate && itemIdentity.length > 0) {
            missingTopics.push({
                subject: item.subject,
                topic: item.topic,
                class: item.class,
                targetSlug: slug1
            });
        }
    }

    console.log(`📊 Found ${missingTopics.length} missing topics.`);

    // 3. Select 6 topics (respecting priority order)
    const queue = missingTopics.slice(0, 6);

    if (queue.length === 0) {
        console.log("✅ All chapters are covered! No new blogs needed.");
        return;
    }

    // 4. Save to queue.json
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
    console.log(`🚀 Jules: Queue created with ${queue.length} topics at ${QUEUE_FILE}`);
    console.table(queue);
}

buildQueue().catch(err => {
    console.error("❌ Jules Error:", err);
    process.exit(1);
});


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { standardizeMarkdown } from './utils/jules-quality.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

const PRACTICE_LINK_MAP: Record<string, string> = {
    "Social Science": "/class-11/social-science",
    "Geography": "/class-11/geography",
    "History": "/class-11/history",
    "Physics": "/class-11/physics",
    "Chemistry": "/class-11/chemistry",
    "Biology": "/class-11/biology",
    "Mathematics": "/class-11/mathematics",
    "Economics": "/class-11/economics",
    "Science": "/class-10/science",
};

async function fixAllBlogs() {
    console.log("🛠️ Jules: Starting Bulk Metadata Fix...");
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    let fixedCount = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const slug = file.replace('.md', '');

        // Extract current metadata
        const titleMatch = content.match(/title:\s*"(.*?)"/);
        const heroMatch = content.match(/heroImage:\s*"(.*?)"/);
        const dateMatch = content.match(/date:\s*"(.*?)"/);
        const subjectMatch = content.match(/category:\s*"(.*?)"/) || content.match(/subject:\s*"(.*?)"/);
        
        const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');
        const heroImage = heroMatch ? heroMatch[1] : `/blog-images/${slug}.webp`;
        const lastUpdated = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
        const subject = subjectMatch ? subjectMatch[1] : "General";

        // Determine class from slug
        let numericClass = "11";
        if (slug.includes("class-10")) numericClass = "10";
        else if (slug.includes("class-12")) numericClass = "12";

        // Build practice link
        const practiceBase = PRACTICE_LINK_MAP[subject] ?? `/class-${numericClass}`;
        const practiceLink = `${practiceBase}/${slug}`;

        // Strip existing frontmatter (if any) to prevent duplication
        const bodyOnly = content.replace(/^---[\s\S]*?---\n*/, '');

        const standardized = standardizeMarkdown(bodyOnly, {
            title,
            heroImage,
            lastUpdated,
            practiceLink,
            recall: [] // We don't have this for old blogs easily, but empty is fine
        });

        fs.writeFileSync(filePath, standardized);
        fixedCount++;
        if (fixedCount % 20 === 0) console.log(`  ✅ Fixed ${fixedCount}/${files.length} blogs...`);
    }

    console.log(`✨ DONE: ${fixedCount} blogs reformatted and standardized.`);
}

fixAllBlogs().catch(console.error);

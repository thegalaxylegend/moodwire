
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    "Political Science": "/class-11/political-science",
    "Civics": "/class-11/civics",
    "Computer Science": "/class-11/computer-science",
    "Science": "/class-10/science",
    "English": "/class-10/english",
};

async function migrate() {
    console.log("🚀 Starting Metadata Migration for 175 blogs...");

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    let updated = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const slug = file.replace('.md', '');

        // Extract current metadata
        const titleMatch = content.match(/title:\s*"(.*?)"/) || content.match(/^# (.*)$/m);
        const subjectMatch = content.match(/subject:\s*"(.*?)"/) || content.match(/category:\s*"(.*?)"/);
        const classMatch = content.match(/exam_class:\s*(\d+)/) || content.match(/class-(\d+)/);
        const heroMatch = content.match(/heroImage:\s*"(.*?)"/);
        const dateMatch = content.match(/date:\s*"(.*?)"/);

        const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');
        const subject = subjectMatch ? subjectMatch[1] : "General";
        const numericClass = classMatch ? parseInt(classMatch[1]) : 11;
        const heroImage = heroMatch ? heroMatch[1] : `/blog-images/${slug}.webp`;
        const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        // Calculate Practice Link
        const practiceBase = PRACTICE_LINK_MAP[subject] ?? `/class-${numericClass}/${subject.toLowerCase().replace(/ /g, '-')}`;
        const practiceLink = `${practiceBase}/${slug}`.replace(/\/+/g, '/');

        // Check if practice_link already exists
        if (content.includes('practice_link:')) {
            // Check if it's empty or invalid
            const existingLink = content.match(/practice_link:\s*"(.*?)"/);
            if (existingLink && existingLink[1].length > 5) {
                continue; // Skip if valid link exists
            }
        }

        // Reconstruct Frontmatter
        const newFrontmatter = `---
heroImage: "${heroImage}"
title: "${title}"
description: "${title} Revision Notes. Optimized for ${subject} ${numericClass}."
category: "Revision"
date: "${date}"
practice_link: "${practiceLink}"
---`;

        // Strip old frontmatter
        const bodyContent = content.replace(/^---[\s\S]*?---\n*/, '').trim();
        const newContent = `${newFrontmatter}\n\n${bodyContent}`;

        fs.writeFileSync(filePath, newContent);
        updated++;
    }

    console.log(`✅ Migration complete. Updated ${updated} blogs.`);
}

migrate().catch(console.error);

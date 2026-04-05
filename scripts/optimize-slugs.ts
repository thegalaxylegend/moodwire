/**
 * Slug Optimization Script
 * Standardizes and optimizes all blog filenames (URLs) for SEO.
 * Since blogs are not yet indexed, we can safely perform this re-branding.
 * 
 * Run: npx tsx scripts/optimize-slugs.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

const SUBJECT_EXAM_TAG = {
    'Physics': 'jee-neet',
    'Chemistry': 'jee-neet',
    'Mathematics': 'jee',
    'Biology': 'neet',
    'Computer Science': 'gate-boards',
    'Science': 'cbse',
    'Social Science': 'cbse',
    'English': 'cbse',
};

function extractClassAndTopic(filename: string) {
    const classMatch = filename.match(/class-(\d+)/i);
    const classNum = classMatch ? parseInt(classMatch[1]) : 11;
    
    const topic = filename
        .replace(/\.md$/, '')
        .replace(/class-\d+-notes/i, '')
        .replace(/revision-notes/i, '')
        .replace(/quick-revision-notes/i, '')
        .replace(/-notes$/i, '')
        .replace(/-+$/, '')
        .replace(/^-+/, '');
        
    return { classNum, topic };
}

function getSubjectFromContent(content: string) {
    const match = content.match(/category:\s*"(.+?)"/);
    return match ? match[1] : 'Science';
}

async function start() {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`🚀 Optimizing slugs for ${files.length} blogs...`);

    let renamedCount = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const { classNum, topic } = extractClassAndTopic(file);
        const subject = getSubjectFromContent(content);
        const examTag = SUBJECT_EXAM_TAG[subject] || 'cbse';

        // Standardized New Slug
        let newSlug = `${topic}-class-${classNum}-revision-notes-${examTag}`;
        
        // Clean up double dashes or weirdness
        newSlug = newSlug.replace(/--+/g, '-').toLowerCase();
        
        const newFile = `${newSlug}.md`;
        const newPath = path.join(BLOG_DIR, newFile);

        if (file !== newFile) {
            console.log(`🔄 Renaming: ${file} -> ${newFile}`);
            if (fs.existsSync(newPath)) {
                console.log(`⚠️ Destination ${newFile} already exists. Skipping or merging? (Skipping for now)`);
            } else {
                fs.renameSync(filePath, newPath);
                renamedCount++;
            }
        }
    }

    console.log(`\n🎉 Slug Optimization Complete!`);
    console.log(`✨ Renamed: ${renamedCount}`);
}

start();

/**
 * SEO Fix Script — Bulk update all existing blog titles, descriptions, and keywords
 * Based on competitive gap analysis findings.
 * 
 * Run: node scripts/seo-fix-blogs.js
 * Dry run: node scripts/seo-fix-blogs.js --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const isDryRun = process.argv.includes('--dry-run');

// Dynamic target year (switches on August 1st)
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();
const TARGET_YEAR = currentMonth >= 7 ? currentYear + 1 : currentYear;

// Subject → Exam mapping for SEO
const SUBJECT_EXAM_MAP = {
    'Physics': 'JEE & NEET',
    'Chemistry': 'JEE & NEET',
    'Mathematics': 'JEE',
    'Biology': 'NEET',
    'Computer Science': 'GATE & Boards',
    'Science': 'CBSE Boards',
    'Social Science': 'CBSE Boards',
    'English': 'CBSE Boards',
    'History': 'CBSE Boards',
    'Geography': 'CBSE Boards',
};

// Subject → short exam tags for keywords
const SUBJECT_KEYWORD_EXAMS = {
    'Physics': ['JEE', 'NEET'],
    'Chemistry': ['JEE', 'NEET'],
    'Mathematics': ['JEE'],
    'Biology': ['NEET'],
    'Computer Science': ['GATE'],
    'Science': ['CBSE'],
    'Social Science': ['CBSE'],
    'English': ['CBSE'],
    'History': ['CBSE'],
    'Geography': ['CBSE'],
};

function extractClassNumber(text) {
    const match = text.match(/class[- ]?(\d+)/i);
    return match ? parseInt(match[1]) : null;
}

function extractTopicFromSlug(slug) {
    return slug
        .replace(/-class-\d+.*$/, '') // Remove everything from -class- onwards
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function generateSEOTitle(topic, classNum, subject) {
    const exam = SUBJECT_EXAM_MAP[subject] || 'CBSE';
    const isSenior = classNum >= 11;

    if (isSenior && ['Physics', 'Chemistry', 'Mathematics', 'Biology'].includes(subject)) {
        return `${topic} Class ${classNum} ${subject} Revision — ${exam} ${TARGET_YEAR} Grandmaster Guide`;
    } else {
        return `${topic} Class ${classNum} ${subject} Recap — CBSE ${TARGET_YEAR} Quick Guide`;
    }
}

function generateSEODescription(topic, classNum, subject) {
    const exam = SUBJECT_EXAM_MAP[subject] || 'CBSE';
    const isSenior = classNum >= 11;

    if (isSenior && ['Physics', 'Chemistry', 'Mathematics', 'Biology'].includes(subject)) {
        return `Comprehensive ${topic} revision guide for ${exam} ${TARGET_YEAR}. Includes Ayush's personal study hacks, trap questions, and high-yield MCQs for final revision.`;
    } else {
        return `Learn ${topic} for Class ${classNum} CBSE ${TARGET_YEAR}. Master key concepts with our rapid recap guide, formulas, and NCERT-aligned practice questions.`;
    }
}

function generateSEOKeywords(topic, classNum, subject) {
    const exams = SUBJECT_KEYWORD_EXAMS[subject] || ['CBSE'];
    const keywords = [
        `${topic} class ${classNum} notes`,
        `${topic} quick revision`,
        `${topic} ${TARGET_YEAR}`,
    ];

    for (const exam of exams) {
        keywords.push(`${topic} ${exam} ${TARGET_YEAR}`);
        keywords.push(`${topic} notes for ${exam}`);
    }

    keywords.push(`class ${classNum} ${subject} revision`);
    keywords.push(`${topic} formula sheet`);
    keywords.push(`${topic} MCQs`);

    return keywords.join(', ');
}

function fixBlog(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const slug = path.basename(filePath, '.md');

    // Parse frontmatter (handle both \n and \r\n)
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) {
        console.log(`⚠️ Skipping ${slug}: No frontmatter found`);
        return null;
    }

    const frontmatter = fmMatch[1];
    const body = content.slice(fmMatch[0].length);

    // Extract current values
    const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
    const descMatch = frontmatter.match(/description:\s*["'](.+?)["']/);
    const categoryMatch = frontmatter.match(/category:\s*["'](.+?)["']/);
    const keywordsMatch = frontmatter.match(/keywords:\s*["'](.+?)["']/);
    const dateMatch = frontmatter.match(/date:\s*["'](.+?)["']/);
    const practiceMatch = frontmatter.match(/practice_link:\s*["'](.+?)["']/);
    const heroMatch = frontmatter.match(/hero_image:\s*["'](.+?)["']/);

    const oldTitle = titleMatch ? titleMatch[1] : slug;
    const oldCategory = categoryMatch ? categoryMatch[1].trim() : 'Science';
    const oldDesc = descMatch ? descMatch[1] : '';
    const oldKeywords = keywordsMatch ? keywordsMatch[1] : '';
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    const practiceLink = practiceMatch ? practiceMatch[1] : `/blog/${slug}`;
    
    // Improved Categorization Logic
    let category = oldCategory;
    const lowerSlug = slug.toLowerCase();
    if (lowerSlug.includes('3d-geometry')) category = 'Mathematics';
    else if (lowerSlug.includes('agriculture')) category = 'Biology';
    else if (lowerSlug.includes('ai-exam') || lowerSlug.includes('ai-study') || lowerSlug.includes('pomodoro') || lowerSlug.includes('study-hack')) category = 'Computer Science';
    else if (lowerSlug.includes('local-government')) category = 'Social Science';
    else if (lowerSlug.includes('fundamental-rights')) category = 'Social Science';
    else if (lowerSlug.includes('biogeography')) category = 'Biology';
    else if (lowerSlug.includes('climatology')) category = 'Geography';
    else if (lowerSlug.includes('computer-science')) category = 'Computer Science';
    else if (lowerSlug.includes('history') || lowerSlug.includes('medieval') || lowerSlug.includes('ancient')) category = 'History';

    // Set of used images to prevent duplicates
    if (!global.usedImages) global.usedImages = new Set();
    const imgFiles = fs.readdirSync(path.join(__dirname, '../public/blog-images')).filter(f => !f.includes('fallback'));

    // --- ENHANCED UNIQUE IMAGE MATCHING ---
    const topic = extractTopicFromSlug(slug);
    const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
    
    let finalHeroImg = '';
    
    // 1. Try topic-match that hasn't been used
    const topicMatch = imgFiles.find(f => f.toLowerCase().startsWith(topicSlug) && !global.usedImages.has(f));
    if (topicMatch) {
        finalHeroImg = `/blog-images/${topicMatch}`;
        global.usedImages.add(topicMatch);
    }

    // 2. Try partial match
    if (!finalHeroImg) {
        const partialMatch = imgFiles.find(f => (f.toLowerCase().includes(topicSlug) || slug.includes(f.split('.')[0])) && !global.usedImages.has(f));
        if (partialMatch) {
            finalHeroImg = `/blog-images/${partialMatch}`;
            global.usedImages.add(partialMatch);
        }
    }

    // 3. Fallback to any unused high-quality image from the pool
    if (!finalHeroImg) {
        const anyUnused = imgFiles.find(f => !global.usedImages.has(f) && f.endsWith('.webp'));
        if (anyUnused) {
            finalHeroImg = `/blog-images/${anyUnused}`;
            global.usedImages.add(anyUnused);
        }
    }

    // 4. Ultimate Fallback (if pool exhausted)
    if (!finalHeroImg) {
        const FALLBACK_MAP = {
            'Mathematics': '/blog-images/fallbacks/maths-equations.webp',
            'Physics': '/blog-images/fallbacks/physics-waves.webp',
            'Biology': '/blog-images/fallbacks/biology-cell.webp',
            'Chemistry': '/blog-images/fallbacks/chemistry-molecule.webp',
            'General': '/blog-images/active-vs-passive-study.jpg'
        };
        finalHeroImg = FALLBACK_MAP[category] || FALLBACK_MAP['General'];
    }

    // Detect class and topic
    const classNum = extractClassNumber(slug) || extractClassNumber(oldTitle) || 11;

    // --- RANDOMIZED SEO DESCRIPTION TEMPLATE ---
    const templates = [
        `Master ${topic} for ${category} ${TARGET_YEAR}. This Grandmaster Guide includes Ayush's personal revision notes, formula sheets, and top-tier MCQs for final prep.`,
        `Deep dive into ${topic} Class ${classNum}. Quick revision notes featuring trap questions, peer-mentor tips from Ayush, and NCERT-aligned practice sets.`,
        `The ultimate ${topic} revision resource for ${category} students. Focused on ${TARGET_YEAR} exam patterns with pyq analysis and quick recall tables.`,
        `Accelerate your ${category} revision with our ${topic} guide. Includes my secret study hacks, conceptual maps, and high-yield MCQs for last-minute success.`,
        `Learn ${topic} like a pro. Detailed revision notes, solved examples, and "Trap Questions" that most students miss. Updated for the ${TARGET_YEAR} syllabus.`
    ];
    // Use hash of slug to pick stable but varied template
    const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const newDesc = templates[hash % templates.length];
    
    // Generate SEO Title and Keywords
    const newTitle = generateSEOTitle(topic, classNum, category);
    const newKeywords = generateSEOKeywords(topic, classNum, category);


    // Build new frontmatter
    const newFrontmatter = `---
title: "${newTitle}"
description: "${newDesc}"
category: "${category}"
keywords: "${newKeywords}"
date: "${date}"
practice_link: "${practiceLink}"
hero_image: "${finalHeroImg}"
---`;

    const newContent = newFrontmatter + body;

    return {
        slug,
        oldTitle,
        newTitle,
        oldDesc: oldDesc.substring(0, 60) + '...',
        newDesc: newDesc.substring(0, 60) + '...',
        newContent
    };
}

// Main
console.log(`\n🔧 SEO Blog Fix Script — Target Year: ${TARGET_YEAR}`);
console.log(`📂 Blog directory: ${BLOG_DIR}`);
if (isDryRun) console.log('🧪 DRY RUN MODE — no files will be modified\n');

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
let fixed = 0;
let skipped = 0;
const changes = [];

for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const result = fixBlog(filePath);

    if (!result) {
        skipped++;
        continue;
    }

    changes.push({ slug: result.slug, oldTitle: result.oldTitle, newTitle: result.newTitle });

    if (!isDryRun) {
        fs.writeFileSync(filePath, result.newContent);
    }
    fixed++;
}

console.log(`\n📊 Results: ${fixed} fixed, ${skipped} skipped (already up-to-date or no frontmatter)`);

if (changes.length > 0) {
    console.log('\n📝 Title Changes:');
    console.table(changes.map(c => ({
        Slug: c.slug.substring(0, 40),
        'Old Title': c.oldTitle.substring(0, 45),
        'New Title': c.newTitle.substring(0, 55)
    })));
}

if (isDryRun) {
    console.log('\n🧪 DRY RUN complete. Run without --dry-run to apply changes.');
}

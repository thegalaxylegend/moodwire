/**
 * 📋 JSON-LD Schema Markup Generator (Feature 3.5)
 * 
 * Generates structured data for every blog post:
 * - Article schema (for Google Search)
 * - FAQPage schema (from MCQs → rich snippets)
 * - BreadcrumbList schema (for navigation)
 * - EducationalOccupationalProgram schema (for exam context)
 * 
 * Outputs: public/schema-data.json (consumed by prerender-all.js)
 * Run: npx tsx scripts/generate-schema.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const PUBLIC_DIR = path.join(__dirname, '../public');
const DIST_DIR = path.join(__dirname, '../dist');
const OUTPUT_FILE = 'schema-data.json';

const BASE_URL = 'https://examcompass.pages.dev';
const SITE_NAME = 'Exam Compass';
const LOGO_URL = `${BASE_URL}/logo.png`;

interface BlogMeta {
    slug: string;
    title: string;
    description: string;
    category: string;
    date: string;
    heroImage: string;
    keywords: string;
    practiceLink: string;
}

interface MCQ {
    question: string;
    options: string[];
    answer: string;
    answerText: string;
}

function parseFrontmatter(content: string): BlogMeta {
    const fm: Record<string, string> = {};
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fmMatch) {
        fmMatch[1].split('\n').forEach(line => {
            const match = line.match(/^(\w+):\s*["']?(.*?)["']?\s*$/);
            if (match) fm[match[1]] = match[2];
        });
    }
    return {
        slug: '',
        title: fm.title || '',
        description: fm.description || '',
        category: fm.category || 'Education',
        date: fm.date || new Date().toISOString().split('T')[0],
        heroImage: fm.heroImage || '',
        keywords: fm.keywords || '',
        practiceLink: fm.practice_link || fm.practiceLink || ''
    };
}

function extractMCQs(content: string): MCQ[] {
    const mcqs: MCQ[] = [];
    // Match MCQ pattern: **1. Question**
    const mcqBlocks = content.split(/\*\*\d+\.\s+/);
    
    for (let i = 1; i < mcqBlocks.length && mcqs.length < 5; i++) {
        const block = mcqBlocks[i];
        
        // Extract question (up to first newline with options)
        const questionMatch = block.match(/^(.+?)\*\*/);
        if (!questionMatch) continue;
        
        const question = questionMatch[1]
            .replace(/\$\$?/g, '') // Strip LaTeX delimiters for schema
            .replace(/\\/g, '')
            .trim();
        
        // Extract options
        const options: string[] = [];
        const optionMatches = block.matchAll(/- ([A-D])\)\s*(.+)/g);
        for (const match of optionMatches) {
            options.push(`${match[1]}) ${match[2].replace(/\$\$?/g, '').replace(/\\/g, '').trim()}`);
        }
        
        // Extract answer
        const answerMatch = block.match(/\*\*Answer:\*\*\s*([A-D])\)?\s*(.*)/);
        const answer = answerMatch ? answerMatch[1] : '';
        const answerText = answerMatch ? answerMatch[2].replace(/\$\$?/g, '').replace(/\\/g, '').trim() : '';
        
        if (question.length > 10 && options.length >= 2) {
            mcqs.push({ question, options, answer, answerText });
        }
    }
    
    return mcqs;
}

function extractH2Headings(content: string): string[] {
    const headings: string[] = [];
    const h2Regex = /^## (?:<a[^>]*><\/a>)?(.+)$/gm;
    let match;
    while ((match = h2Regex.exec(content)) !== null) {
        const heading = match[1].trim()
            .replace(/<[^>]+>/g, '')  // Strip HTML
            .replace(/📋|📝|🚀|⚡|🪤|✏️|🧠|👁️|🔁/g, '') // Strip emoji
            .trim();
        if (heading && !heading.toLowerCase().includes('table of contents')) {
            headings.push(heading);
        }
    }
    return headings;
}

function generateArticleSchema(meta: BlogMeta, wordCount: number): object {
    const publishDate = new Date(meta.date);
    if (isNaN(publishDate.getTime())) {
        publishDate.setTime(Date.now());
    }
    
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": meta.title.substring(0, 110),
        "description": meta.description.substring(0, 200),
        "image": meta.heroImage.startsWith('http') ? meta.heroImage : `${BASE_URL}${meta.heroImage}`,
        "author": {
            "@type": "Person",
            "name": "Ayush Kumar",
            "url": `${BASE_URL}/founder`
        },
        "publisher": {
            "@type": "Organization",
            "name": SITE_NAME,
            "logo": {
                "@type": "ImageObject",
                "url": LOGO_URL
            }
        },
        "datePublished": publishDate.toISOString(),
        "dateModified": new Date().toISOString(),
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${BASE_URL}/blog/${meta.slug}`
        },
        "articleSection": meta.category,
        "wordCount": wordCount,
        "keywords": meta.keywords
    };
}

function generateFAQSchema(mcqs: MCQ[]): object | null {
    if (mcqs.length < 2) return null;
    
    // Convert MCQs to FAQ format (Google loves this for rich snippets)
    const faqs = mcqs.slice(0, 5).map(mcq => ({
        "@type": "Question",
        "name": mcq.question,
        "acceptedAnswer": {
            "@type": "Answer",
            "text": `The correct answer is ${mcq.answer}. ${mcq.answerText}`
        }
    }));
    
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs
    };
}

// NEXUS v2: Quiz schema (schema.org/Quiz) — richer snippets for practice problems
function generateQuizSchema(mcqs: MCQ[], meta: BlogMeta): object | null {
    if (mcqs.length < 2) return null;
    
    const quizQuestions = mcqs.slice(0, 5).map((mcq, index) => ({
        "@type": "Question",
        "eduQuestionType": "Multiple choice",
        "learningResourceType": "Practice problem",
        "text": mcq.question,
        "comment": {
            "@type": "Comment",
            "text": `Correct Answer: ${mcq.answer}) ${mcq.answerText}`
        },
        "suggestedAnswer": mcq.options
            .filter(opt => !opt.startsWith(mcq.answer + ')'))
            .map(opt => ({
                "@type": "Answer",
                "text": opt
            })),
        "acceptedAnswer": {
            "@type": "Answer",
            "text": `${mcq.answer}) ${mcq.answerText}`
        },
        "position": index + 1
    }));
    
    return {
        "@context": "https://schema.org",
        "@type": "Quiz",
        "name": `${meta.title} — Practice MCQs`,
        "about": {
            "@type": "Thing",
            "name": meta.category
        },
        "educationalLevel": meta.title.match(/class[- ]?(\d+)/i)?.[1] 
            ? `Class ${meta.title.match(/class[- ]?(\d+)/i)?.[1]}` 
            : "Competitive Exam",
        "hasPart": quizQuestions
    };
}

function generateBreadcrumbSchema(meta: BlogMeta): object {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": BASE_URL
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": `${BASE_URL}/blog`
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": meta.category,
                "item": `${BASE_URL}/blog?category=${encodeURIComponent(meta.category)}`
            },
            {
                "@type": "ListItem",
                "position": 4,
                "name": meta.title.substring(0, 60),
                "item": `${BASE_URL}/blog/${meta.slug}`
            }
        ]
    };
}

function generateEducationSchema(meta: BlogMeta, headings: string[]): object {
    // Extract class number from slug or title
    const classMatch = meta.slug.match(/class-(\d+)/);
    const classNum = classMatch ? parseInt(classMatch[1]) : null;
    
    const schema: any = {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        "name": meta.title,
        "description": meta.description,
        "educationalLevel": classNum ? `Class ${classNum}` : "Secondary Education",
        "learningResourceType": "Revision Notes",
        "author": {
            "@type": "Person",
            "name": "Ayush Kumar",
            "url": `${BASE_URL}/founder`
        },
        "provider": {
            "@type": "Organization",
            "name": SITE_NAME
        },
        "inLanguage": "en",
        "isAccessibleForFree": true
    };

    // Add subject area
    if (meta.category) {
        schema.about = {
            "@type": "Thing",
            "name": meta.category
        };
    }

    // Add table of contents as hasPart
    if (headings.length > 0) {
        schema.hasPart = headings.map((h, i) => ({
            "@type": "LearningResource",
            "name": h,
            "position": i + 1
        }));
    }

    return schema;
}

async function main() {
    console.log('\n📋 Schema Markup Generator v1.0');
    console.log('Generating JSON-LD structured data for all blogs...\n');

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Processing ${files.length} blog files...\n`);

    const schemaData: Record<string, object[]> = {};
    let faqCount = 0;
    let quizCount = 0;
    let articleCount = 0;

    for (const file of files) {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        const meta = parseFrontmatter(content);
        meta.slug = slug;

        const body = content.replace(/^---[\s\S]*?---\n*/m, '');
        const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
        const mcqs = extractMCQs(content);
        const headings = extractH2Headings(content);

        const schemas: object[] = [];

        // 1. Article Schema (always)
        schemas.push(generateArticleSchema(meta, wordCount));
        articleCount++;

        // 2. FAQ Schema (if MCQs found)
        const faqSchema = generateFAQSchema(mcqs);
        if (faqSchema) {
            schemas.push(faqSchema);
            faqCount++;
        }

        // 2.5 NEXUS v2: Quiz Schema (richer snippets for MCQs)
        const quizSchema = generateQuizSchema(mcqs, meta);
        if (quizSchema) {
            schemas.push(quizSchema);
            quizCount++;
        }

        // 3. Breadcrumb Schema (always)
        schemas.push(generateBreadcrumbSchema(meta));

        // 4. Education Schema (always for blog posts)
        schemas.push(generateEducationSchema(meta, headings));

        schemaData[`/blog/${slug}`] = schemas;
    }

    // Write schema data
    const outputDirs = [PUBLIC_DIR, DIST_DIR];
    for (const dir of outputDirs) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, OUTPUT_FILE), JSON.stringify(schemaData, null, 2));
    }

    console.log('═'.repeat(60));
    console.log('📊 SCHEMA GENERATION REPORT');
    console.log('═'.repeat(60));
    console.log(`  📄 Article schemas:    ${articleCount}`);
    console.log(`  ❓ FAQ schemas:        ${faqCount}`);
    console.log(`  🧩 Quiz schemas:       ${quizCount}`);
    console.log(`  🧭 Breadcrumb schemas: ${articleCount}`);
    console.log(`  📚 Education schemas:  ${articleCount}`);
    console.log(`  📊 Total schemas:      ${articleCount * 3 + faqCount + quizCount}`);
    console.log(`  📁 Output: ${OUTPUT_FILE}`);
    console.log('═'.repeat(60));
    console.log('\n✨ Schema generation complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

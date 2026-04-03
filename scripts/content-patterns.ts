/**
 * 📊 Content Pattern Learner (Feature 4.3)
 * 
 * Analyzes all existing blogs to learn what makes content successful:
 * 1. Word count distribution per category
 * 2. Heading density (H2/H3/H4 ratio)
 * 3. Formula density per subject
 * 4. MCQ count patterns
 * 5. Bullet vs paragraph ratio
 * 6. Internal link density
 * 7. Outputs "ideal blog template" per subject
 * 
 * Run: npx tsx scripts/content-patterns.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const OUTPUT_FILE = path.join(REPORTS_DIR, 'content-patterns.json');

interface BlogMetrics {
    slug: string;
    category: string;
    classNum: number;
    wordCount: number;
    h2Count: number;
    h3Count: number;
    h4Count: number;
    formulaCount: number;
    mcqCount: number;
    bulletCount: number;
    paragraphCount: number;
    internalLinkCount: number;
    externalLinkCount: number;
    imageCount: number;
    tableCount: number;
    codeBlockCount: number;
    avgSectionLength: number;
    hasTraps: boolean;
    hasLast5Min: boolean;
    hasRelated: boolean;
    fileSize: number;
}

interface SubjectPattern {
    subject: string;
    sampleSize: number;
    avgWordCount: number;
    medianWordCount: number;
    avgH2: number;
    avgH3: number;
    avgFormulas: number;
    avgMCQs: number;
    avgBullets: number;
    bulletToParagraphRatio: number;
    avgInternalLinks: number;
    idealTemplate: {
        wordCountRange: [number, number];
        headingCount: [number, number];
        formulaDensity: string;
        mcqCount: [number, number];
        bulletRatio: string;
    };
}

function analyzeBlog(filePath: string): BlogMetrics {
    const slug = path.basename(filePath, '.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileSize = fs.statSync(filePath).size;
    
    // Extract category and class
    const categoryMatch = content.match(/category:\s*["']?(.+?)["']?\s*$/m);
    const category = categoryMatch ? categoryMatch[1].trim() : 'Unknown';
    const classMatch = slug.match(/class-(\d+)/);
    const classNum = classMatch ? parseInt(classMatch[1]) : 0;
    
    const body = content.replace(/^---[\s\S]*?---\n*/m, '');
    
    // Word count
    const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
    
    // Heading counts
    const h2Count = (body.match(/^## /gm) || []).length;
    const h3Count = (body.match(/^### /gm) || []).length;
    const h4Count = (body.match(/^#### /gm) || []).length;
    
    // Formula count (both inline and block)
    const blockFormulas = (body.match(/\$\$.+?\$\$/gs) || []).length;
    const inlineFormulas = (body.match(/\$[^$\n]+\$/g) || []).length;
    const formulaCount = blockFormulas + inlineFormulas;
    
    // MCQ count
    const mcqCount = (body.match(/\*\*\d+\.\s+/g) || []).length;
    
    // Bullet points
    const bulletCount = (body.match(/^[-*+]\s+/gm) || []).length;
    
    // Paragraphs (blocks of text > 50 chars without bullet prefix)
    const paragraphs = body.split(/\n\n+/).filter(p => 
        p.trim().length > 50 && !p.trim().startsWith('#') && !p.trim().startsWith('-') && !p.trim().startsWith('|')
    );
    const paragraphCount = paragraphs.length;
    
    // Links
    const internalLinkCount = (body.match(/\]\(\/[^)]*\)/g) || []).length;
    const externalLinkCount = (body.match(/\]\(https?:\/\/[^)]*\)/g) || []).length;
    
    // Images
    const imageCount = (body.match(/!\[/g) || []).length;
    
    // Tables
    const tableCount = (body.match(/\|.+\|.+\|/g) || []).length > 0 ? 1 : 0;
    
    // Code blocks
    const codeBlockCount = (body.match(/```/g) || []).length / 2;
    
    // Average section length
    const sections = body.split(/^## /gm).filter(s => s.trim().length > 0);
    const avgSectionLength = sections.length > 0 
        ? Math.round(sections.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sections.length)
        : 0;
    
    // Special sections
    const bodyLower = body.toLowerCase();
    const hasTraps = /trap|common mistake/i.test(bodyLower);
    const hasLast5Min = /last\s*5\s*min/i.test(bodyLower);
    const hasRelated = /related\s*topics?/i.test(bodyLower);
    
    return {
        slug, category, classNum, wordCount, h2Count, h3Count, h4Count,
        formulaCount, mcqCount, bulletCount, paragraphCount,
        internalLinkCount, externalLinkCount, imageCount, tableCount,
        codeBlockCount, avgSectionLength, hasTraps, hasLast5Min, hasRelated,
        fileSize
    };
}

function computePatterns(metrics: BlogMetrics[]): SubjectPattern[] {
    const bySubject = new Map<string, BlogMetrics[]>();
    
    for (const m of metrics) {
        const key = m.category || 'Unknown';
        if (!bySubject.has(key)) bySubject.set(key, []);
        bySubject.get(key)!.push(m);
    }
    
    const patterns: SubjectPattern[] = [];
    
    for (const [subject, blogs] of bySubject) {
        if (blogs.length < 2) continue;
        
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const median = (arr: number[]) => {
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        };
        
        const wordCounts = blogs.map(b => b.wordCount);
        const avgWC = Math.round(avg(wordCounts));
        const medWC = Math.round(median(wordCounts));
        const avgH2 = Math.round(avg(blogs.map(b => b.h2Count)) * 10) / 10;
        const avgH3 = Math.round(avg(blogs.map(b => b.h3Count)) * 10) / 10;
        const avgFormulas = Math.round(avg(blogs.map(b => b.formulaCount)) * 10) / 10;
        const avgMCQs = Math.round(avg(blogs.map(b => b.mcqCount)) * 10) / 10;
        const avgBullets = Math.round(avg(blogs.map(b => b.bulletCount)) * 10) / 10;
        const avgParagraphs = avg(blogs.map(b => b.paragraphCount));
        const bulletRatio = avgParagraphs > 0 ? avgBullets / avgParagraphs : 0;
        const avgLinks = Math.round(avg(blogs.map(b => b.internalLinkCount)) * 10) / 10;
        
        // Compute ideal ranges (p25 to p75)
        const p25 = (arr: number[]) => {
            const sorted = [...arr].sort((a, b) => a - b);
            return sorted[Math.floor(sorted.length * 0.25)];
        };
        const p75 = (arr: number[]) => {
            const sorted = [...arr].sort((a, b) => a - b);
            return sorted[Math.floor(sorted.length * 0.75)];
        };
        
        patterns.push({
            subject,
            sampleSize: blogs.length,
            avgWordCount: avgWC,
            medianWordCount: medWC,
            avgH2: avgH2,
            avgH3: avgH3,
            avgFormulas: avgFormulas,
            avgMCQs: avgMCQs,
            avgBullets: avgBullets,
            bulletToParagraphRatio: Math.round(bulletRatio * 100) / 100,
            avgInternalLinks: avgLinks,
            idealTemplate: {
                wordCountRange: [p25(wordCounts), p75(wordCounts)],
                headingCount: [Math.round(p25(blogs.map(b => b.h2Count))), Math.round(p75(blogs.map(b => b.h2Count)))],
                formulaDensity: avgFormulas > 10 ? 'high' : avgFormulas > 3 ? 'medium' : 'low',
                mcqCount: [Math.max(3, Math.round(p25(blogs.map(b => b.mcqCount)))), Math.round(p75(blogs.map(b => b.mcqCount)))],
                bulletRatio: bulletRatio > 3 ? 'bullet-heavy' : bulletRatio > 1 ? 'balanced' : 'paragraph-heavy'
            }
        });
    }
    
    return patterns.sort((a, b) => b.sampleSize - a.sampleSize);
}

async function main() {
    console.log('\n📊 Content Pattern Learner v1.0');
    console.log('Analyzing content structure patterns across all blogs...\n');
    
    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }
    
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Analyzing ${files.length} blog files...\n`);
    
    // Analyze all blogs
    const metrics: BlogMetrics[] = [];
    for (const file of files) {
        metrics.push(analyzeBlog(path.join(BLOG_DIR, file)));
    }
    
    // Compute patterns
    const patterns = computePatterns(metrics);
    
    // Global stats
    const allWordCounts = metrics.map(m => m.wordCount);
    const totalWords = allWordCounts.reduce((a, b) => a + b, 0);
    const avgWords = Math.round(totalWords / metrics.length);
    const shortBlogs = metrics.filter(m => m.wordCount < 1000);
    const longBlogs = metrics.filter(m => m.wordCount > 5000);
    
    // Report
    console.log('═'.repeat(60));
    console.log('📊 CONTENT PATTERN ANALYSIS');
    console.log('═'.repeat(60));
    console.log(`  📄 Total blogs: ${metrics.length}`);
    console.log(`  📝 Total words: ${totalWords.toLocaleString()}`);
    console.log(`  📊 Avg word count: ${avgWords}`);
    console.log(`  📉 Short blogs (<1000 words): ${shortBlogs.length}`);
    console.log(`  📈 Long blogs (>5000 words): ${longBlogs.length}`);
    console.log(`  🪤 Has Trap Questions: ${metrics.filter(m => m.hasTraps).length}`);
    console.log(`  ⏰ Has Last 5 Min Box: ${metrics.filter(m => m.hasLast5Min).length}`);
    console.log(`  🔗 Has Related Topics: ${metrics.filter(m => m.hasRelated).length}`);
    
    console.log('\n  📋 Per-Subject Patterns:');
    console.log('  ┌─────────────────┬────────┬──────────┬───────┬──────────┬──────┬──────────┐');
    console.log('  │ Subject         │ Blogs  │ Avg Words│ Avg H2│ Formulas │ MCQs │ Bullets  │');
    console.log('  ├─────────────────┼────────┼──────────┼───────┼──────────┼──────┼──────────┤');
    
    for (const p of patterns) {
        console.log(`  │ ${p.subject.padEnd(15)} │ ${String(p.sampleSize).padStart(6)} │ ${String(p.avgWordCount).padStart(8)} │ ${String(p.avgH2).padStart(5)} │ ${String(p.avgFormulas).padStart(8)} │ ${String(p.avgMCQs).padStart(4)} │ ${String(p.avgBullets).padStart(8)} │`);
    }
    console.log('  └─────────────────┴────────┴──────────┴───────┴──────────┴──────┴──────────┘');
    
    console.log('\n  🎯 Ideal Templates per Subject:');
    for (const p of patterns) {
        console.log(`\n  📚 ${p.subject} (${p.sampleSize} samples):`);
        console.log(`     Word count: ${p.idealTemplate.wordCountRange[0]}-${p.idealTemplate.wordCountRange[1]}`);
        console.log(`     Headings: ${p.idealTemplate.headingCount[0]}-${p.idealTemplate.headingCount[1]} H2s`);
        console.log(`     Formulas: ${p.idealTemplate.formulaDensity} density (avg ${p.avgFormulas})`);
        console.log(`     MCQs: ${p.idealTemplate.mcqCount[0]}-${p.idealTemplate.mcqCount[1]}`);
        console.log(`     Style: ${p.idealTemplate.bulletRatio}`);
    }
    
    // Save
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const output = {
        generatedAt: new Date().toISOString(),
        totalBlogs: metrics.length,
        totalWords,
        avgWordCount: avgWords,
        patterns,
        allMetrics: metrics,
        shortBlogs: shortBlogs.map(m => m.slug),
        recommendations: [
            shortBlogs.length > 10 ? `⚠️ ${shortBlogs.length} blogs are under 1000 words — consider regenerating them.` : null,
            metrics.filter(m => !m.hasTraps).length > 20 ? `⚠️ ${metrics.filter(m => !m.hasTraps).length} blogs missing Trap Questions section.` : null,
            metrics.filter(m => !m.hasLast5Min).length > 20 ? `⚠️ ${metrics.filter(m => !m.hasLast5Min).length} blogs missing Last 5 Min Box.` : null,
            metrics.filter(m => m.internalLinkCount === 0).length > 10 ? `⚠️ ${metrics.filter(m => m.internalLinkCount === 0).length} blogs have zero internal links.` : null,
        ].filter(Boolean)
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n📄 Patterns saved: ${OUTPUT_FILE}`);
    console.log('✨ Pattern analysis complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

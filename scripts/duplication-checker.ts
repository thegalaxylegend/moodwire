/**
 * 🔍 Plagiarism / Duplication Checker (Feature 2.4)
 * 
 * Compares all blogs against each other to detect:
 * 1. High content overlap (>30% shared sentences)
 * 2. Duplicate headings across different blogs
 * 3. Near-identical paragraphs (AI repeating itself)
 * 4. Copy-paste from one blog to another
 * 
 * Run: npx tsx scripts/duplication-checker.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const TODAY = new Date().toISOString().split('T')[0];

const OVERLAP_THRESHOLD = 0.30; // 30% overlap = flagged
const MIN_SENTENCE_LENGTH = 30; // Ignore very short sentences

interface DuplicateReport {
    blog1: string;
    blog2: string;
    overlapPercentage: number;
    sharedSentences: number;
    totalSentences: number;
    examples: string[];
}

function extractSentences(content: string): string[] {
    // Strip frontmatter
    const body = content.replace(/^---[\s\S]*?---\n*/m, '');
    
    // Strip markdown formatting
    const cleaned = body
        .replace(/#{1,6}\s+.*/g, '')         // Headers
        .replace(/\$\$[\s\S]*?\$\$/g, '')     // Block LaTeX
        .replace(/\$[^$\n]+\$/g, '')          // Inline LaTeX
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/!\[.*?\]\(.*?\)/g, '')      // Images
        .replace(/\|[^|\n]+\|/g, '')          // Tables
        .replace(/```[\s\S]*?```/g, '')       // Code blocks
        .replace(/[*_~`]/g, '')               // Bold/italic/strike
        .replace(/<[^>]+>/g, '')              // HTML tags
        .replace(/^\s*[-*+]\s+/gm, '')        // Bullet points prefix
        .replace(/^\s*\d+\.\s+/gm, '');       // Numbered lists prefix
    
    // Split into sentences
    const sentences = cleaned
        .split(/[.!?\n]+/)
        .map(s => s.trim().toLowerCase().replace(/\s+/g, ' '))
        .filter(s => s.length >= MIN_SENTENCE_LENGTH);
    
    return sentences;
}

function computeOverlap(sentences1: string[], sentences2: string[]): { sharedCount: number; examples: string[] } {
    const set2 = new Set(sentences2);
    const shared: string[] = [];
    
    for (const s of sentences1) {
        if (set2.has(s)) {
            shared.push(s);
        } else {
            // Fuzzy match: check if >80% of words match
            for (const s2 of sentences2) {
                const words1 = s.split(' ');
                const words2 = s2.split(' ');
                const commonWords = words1.filter(w => words2.includes(w)).length;
                const similarity = commonWords / Math.max(words1.length, words2.length);
                
                if (similarity > 0.8 && words1.length > 5) {
                    shared.push(s);
                    break;
                }
            }
        }
    }
    
    return {
        sharedCount: shared.length,
        examples: shared.slice(0, 3) // Keep top 3 examples
    };
}

async function main() {
    console.log('\n🔍 Plagiarism / Duplication Checker v1.0');
    console.log('Scanning all blogs for content overlap...\n');
    
    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }
    
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Processing ${files.length} blog files...\n`);
    
    // Step 1: Extract sentences from all blogs
    const blogSentences = new Map<string, string[]>();
    
    for (const file of files) {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        const sentences = extractSentences(content);
        blogSentences.set(slug, sentences);
    }
    
    // Step 2: Compare all pairs
    const duplicates: DuplicateReport[] = [];
    const slugs = Array.from(blogSentences.keys());
    let comparisons = 0;
    
    console.log(`🔄 Running ${(slugs.length * (slugs.length - 1)) / 2} comparisons...\n`);
    
    for (let i = 0; i < slugs.length; i++) {
        for (let j = i + 1; j < slugs.length; j++) {
            comparisons++;
            const s1 = blogSentences.get(slugs[i])!;
            const s2 = blogSentences.get(slugs[j])!;
            
            if (s1.length < 5 || s2.length < 5) continue; // Skip very short blogs
            
            const { sharedCount, examples } = computeOverlap(s1, s2);
            const minSentences = Math.min(s1.length, s2.length);
            const overlapPct = minSentences > 0 ? sharedCount / minSentences : 0;
            
            if (overlapPct >= OVERLAP_THRESHOLD) {
                duplicates.push({
                    blog1: slugs[i],
                    blog2: slugs[j],
                    overlapPercentage: Math.round(overlapPct * 100),
                    sharedSentences: sharedCount,
                    totalSentences: minSentences,
                    examples
                });
            }
        }
    }
    
    // Sort by overlap percentage
    duplicates.sort((a, b) => b.overlapPercentage - a.overlapPercentage);
    
    // Step 3: Find duplicate heading patterns
    const headingCounts = new Map<string, string[]>();
    for (const file of files) {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        const h2s = content.match(/^## .+$/gm) || [];
        h2s.forEach(h => {
            const normalized = h.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            if (normalized.length > 10) {
                if (!headingCounts.has(normalized)) headingCounts.set(normalized, []);
                headingCounts.get(normalized)!.push(slug);
            }
        });
    }
    
    const duplicateHeadings = Array.from(headingCounts.entries())
        .filter(([_, slugs]) => slugs.length > 3)
        .sort((a, b) => b[1].length - a[1].length);
    
    // ═══════════════════════════════════════════
    // Step 4: TAKE ACTION on severe duplicates
    // ═══════════════════════════════════════════
    const SEVERE_THRESHOLD = 60; // 60%+ overlap = needs action
    const severeDuplicates = duplicates.filter(d => d.overlapPercentage >= SEVERE_THRESHOLD);
    let flaggedCount = 0;
    const redirectCandidates: { from: string; to: string; overlap: number; reason: string }[] = [];
    const alreadyFlagged = new Set<string>();
    
    for (const dup of severeDuplicates) {
        // Determine which blog is "weaker" (shorter content = less unique value)
        const path1 = path.join(BLOG_DIR, `${dup.blog1}.md`);
        const path2 = path.join(BLOG_DIR, `${dup.blog2}.md`);
        
        if (!fs.existsSync(path1) || !fs.existsSync(path2)) continue;
        
        const content1 = fs.readFileSync(path1, 'utf-8');
        const content2 = fs.readFileSync(path2, 'utf-8');
        
        // Weaker = shorter body content
        const body1Len = content1.replace(/^---[\s\S]*?---\n*/m, '').length;
        const body2Len = content2.replace(/^---[\s\S]*?---\n*/m, '').length;
        const weakerSlug = body1Len < body2Len ? dup.blog1 : dup.blog2;
        const strongerSlug = body1Len < body2Len ? dup.blog2 : dup.blog1;
        const weakerPath = body1Len < body2Len ? path1 : path2;
        const weakerContent = body1Len < body2Len ? content1 : content2;
        
        // Flag the weaker blog for manual review (inject frontmatter tag)
        if (!alreadyFlagged.has(weakerSlug)) {
            // Only flag if not already flagged
            if (!weakerContent.includes('needs_manual_review:')) {
                const updatedContent = weakerContent.replace(
                    /^(---\s*\n)/m,
                    `---\nneeds_manual_review: true\ndup_overlap_with: "${strongerSlug}"\ndup_overlap_pct: ${dup.overlapPercentage}\n`
                );
                
                // Safety: make sure we didn't corrupt the file
                if (updatedContent.includes('needs_manual_review: true') && updatedContent.length > 200) {
                    fs.writeFileSync(weakerPath, updatedContent);
                    flaggedCount++;
                    console.log(`  🏷️ Flagged: ${weakerSlug} (${dup.overlapPercentage}% overlap with ${strongerSlug})`);
                }
            }
            alreadyFlagged.add(weakerSlug);
        }
        
        // Add to redirect candidates
        redirectCandidates.push({
            from: weakerSlug,
            to: strongerSlug,
            overlap: dup.overlapPercentage,
            reason: `${dup.overlapPercentage}% content overlap — ${weakerSlug} is shorter (${Math.min(body1Len, body2Len)} vs ${Math.max(body1Len, body2Len)} chars)`
        });
    }
    
    // Report
    console.log('═'.repeat(60));
    console.log('📊 DUPLICATION REPORT');
    console.log('═'.repeat(60));
    console.log(`  🔄 Comparisons made: ${comparisons}`);
    console.log(`  🚨 High overlap pairs (>${OVERLAP_THRESHOLD*100}%): ${duplicates.length}`);
    console.log(`  🔴 Severe pairs (>${SEVERE_THRESHOLD}%): ${severeDuplicates.length}`);
    console.log(`  🏷️ Blogs flagged for review: ${flaggedCount}`);
    console.log(`  📋 Overused headings: ${duplicateHeadings.length}`);
    
    if (duplicates.length > 0) {
        console.log('\n  🚨 Content Overlap Detected:');
        duplicates.slice(0, 15).forEach(d => {
            const severity = d.overlapPercentage >= SEVERE_THRESHOLD ? '🔴' : '🟡';
            console.log(`\n  ${severity} ${d.overlapPercentage}% overlap:`);
            console.log(`     📄 ${d.blog1}`);
            console.log(`     📄 ${d.blog2}`);
            console.log(`     (${d.sharedSentences}/${d.totalSentences} sentences shared)`);
            if (d.examples[0]) console.log(`     Example: "${d.examples[0].substring(0, 80)}..."`);
        });
    } else {
        console.log('\n  ✅ No significant content overlap detected!');
    }
    
    if (duplicateHeadings.length > 0) {
        console.log('\n  📋 Most Overused Headings (appearing in 4+ blogs):');
        duplicateHeadings.slice(0, 10).forEach(([heading, blogs]) => {
            console.log(`     "${heading}" → ${blogs.length} blogs`);
        });
    }
    
    if (flaggedCount > 0) {
        console.log(`\n  ✅ ACTION TAKEN: ${flaggedCount} blogs flagged with 'needs_manual_review: true'`);
        console.log(`  📄 Redirect candidates saved for SEO consolidation.`);
    }
    
    // Save report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const report = {
        date: TODAY,
        summary: {
            comparisons,
            highOverlapPairs: duplicates.length,
            severeOverlapPairs: severeDuplicates.length,
            blogsFlagged: flaggedCount,
            overusedHeadings: duplicateHeadings.length
        },
        duplicates: duplicates.slice(0, 30),
        redirectCandidates: redirectCandidates.slice(0, 50),
        overusedHeadings: duplicateHeadings.slice(0, 20).map(([h, slugs]) => ({ heading: h, count: slugs.length, blogs: slugs }))
    };
    fs.writeFileSync(path.join(REPORTS_DIR, `duplication-${TODAY}.json`), JSON.stringify(report, null, 2));
    
    // Save redirect candidates separately for easy consumption
    if (redirectCandidates.length > 0) {
        fs.writeFileSync(
            path.join(REPORTS_DIR, 'redirect-candidates.json'),
            JSON.stringify(redirectCandidates, null, 2)
        );
    }
    
    console.log(`\n📄 Report saved: jules-reports/duplication-${TODAY}.json`);
    console.log('✨ Duplication check complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

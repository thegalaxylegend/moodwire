/**
 * 🔗 Internal Linking Optimizer (Feature 3.4)
 * 
 * Scans all blogs and automatically:
 * 1. Builds a concept graph (topic → keywords mapping)
 * 2. Finds orphan pages (no incoming links from other blogs)
 * 3. Injects contextual internal links between related posts
 * 4. Adds "Related Posts" section at the bottom of each blog
 * 
 * Run: npx tsx scripts/internal-linker.ts
 * Dry run: npx tsx scripts/internal-linker.ts --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const TODAY = new Date().toISOString().split('T')[0];

interface BlogInfo {
    slug: string;
    title: string;
    category: string;
    keywords: string[];
    incomingLinks: number;
    outgoingLinks: number;
    bodyLower: string;
}

function extractKeywords(slug: string, title: string, body: string): string[] {
    const keywords = new Set<string>();
    
    // From slug
    const slugParts = slug.split('-').filter(w => 
        w.length > 3 && 
        !['class', 'revision', 'notes', 'neet', 'cbse', 'gate', 'boards', 'quick'].includes(w)
    );
    slugParts.forEach(w => keywords.add(w));
    
    // From title
    const titleWords = title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['class', 'revision', 'notes', 'guide', 'quick', 'recap', 'the', 'and', 'for', 'from'].includes(w));
    titleWords.forEach(w => keywords.add(w));
    
    // From H2 headings
    const h2s = body.match(/^## .+$/gm) || [];
    h2s.forEach(h => {
        const words = h.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
            .filter(w => w.length > 4);
        words.forEach(w => keywords.add(w));
    });
    
    return Array.from(keywords);
}

// Global Inverted Index for O(N) lookup
const keywordIndex: Map<string, string[]> = new Map();
const categoryIndex: Map<string, string[]> = new Map();

function buildInvertedIndex(allBlogs: BlogInfo[]) {
    keywordIndex.clear();
    categoryIndex.clear();
    for (const blog of allBlogs) {
        // Index by category
        if (!categoryIndex.has(blog.category)) categoryIndex.set(blog.category, []);
        categoryIndex.get(blog.category)!.push(blog.slug);
        
        // Index by keywords
        for (const kw of blog.keywords) {
            if (!keywordIndex.has(kw)) keywordIndex.set(kw, []);
            keywordIndex.get(kw)!.push(blog.slug);
        }
    }
}

function findRelatedBlogs(blog: BlogInfo, allBlogs: BlogInfo[]): Array<{ slug: string; title: string; relevance: number }> {
    const candidateScores: Map<string, number> = new Map();
    const blogClass = blog.slug.match(/class-(\d+)/)?.[1];
    const blogTopicWords = blog.slug.split('-').filter(w => w.length > 3);

    // 1. Same category candidates
    const sameCat = categoryIndex.get(blog.category) || [];
    for (const slug of sameCat) {
        if (slug === blog.slug) continue;
        candidateScores.set(slug, (candidateScores.get(slug) || 0) + 2);
    }

    // 2. Keyword overlap candidates (The O(1) lookup part)
    for (const kw of blog.keywords) {
        const matchingSlugs = keywordIndex.get(kw) || [];
        for (const slug of matchingSlugs) {
            if (slug === blog.slug) continue;
            candidateScores.set(slug, (candidateScores.get(slug) || 0) + 3);
        }
    }

    // 3. Final scoring and mapping
    const related: Array<{ slug: string; title: string; relevance: number }> = [];
    const blogLookup = new Map(allBlogs.map(b => [b.slug, b]));

    for (const [slug, score] of candidateScores.entries()) {
        const other = blogLookup.get(slug);
        if (!other) continue;

        let relevance = score;
        const otherClass = other.slug.match(/class-(\d+)/)?.[1];
        if (blogClass && otherClass && blogClass === otherClass) relevance += 1;

        const otherTopicWords = other.slug.split('-').filter(w => w.length > 3);
        const slugOverlap = blogTopicWords.filter(w => otherTopicWords.includes(w)).length;
        relevance += slugOverlap * 2;

        if (relevance >= 4) {
            related.push({ slug: other.slug, title: other.title, relevance });
        }
    }
    
    return related.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

function injectContextualLinks(body: string, blog: BlogInfo, related: Array<{ slug: string; title: string }>): { newBody: string; linksAdded: number } {
    let newBody = body;
    let linksAdded = 0;
    const MAX_INLINE_LINKS = 3;
    
    for (const rel of related.slice(0, MAX_INLINE_LINKS)) {
        // Find a natural place to inject (after a paragraph that mentions a related keyword)
        const relKeywords = rel.slug.split('-').filter(w => w.length > 4);
        
        for (const keyword of relKeywords) {
            // Look for the keyword in a paragraph (not in a heading or link already)
            const paragraphRegex = new RegExp(
                `^([^#\\[\\n].{20,})(\\b${keyword}\\b)([^\\]\\)].{0,50})$`,
                'im'
            );
            
            const match = newBody.match(paragraphRegex);
            if (match && !match[0].includes(`/blog/${rel.slug}`) && !match[0].includes('](/')) {
                // Don't inject if this paragraph already has links
                if ((match[0].match(/\]\(/g) || []).length < 2) {
                    const replacement = match[0].replace(
                        keyword,
                        `[${keyword}](/blog/${rel.slug})`
                    );
                    newBody = newBody.replace(match[0], replacement);
                    linksAdded++;
                    break; // One link per related blog
                }
            }
        }
    }
    
    return { newBody, linksAdded };
}

function generateRelatedSection(related: Array<{ slug: string; title: string; relevance: number }>): string {
    if (related.length === 0) return '';
    
    let section = '\n\n---\n\n## 📚 Related Topics\n\n';
    section += 'Continue your revision with these related guides:\n\n';
    
    related.slice(0, 4).forEach(r => {
        const cleanTitle = r.title
            .replace(/\s*\|\s*Exam Compass.*$/i, '')
            .replace(/Class \d+ Revision Notes.*/i, '')
            .trim() || r.slug.replace(/-/g, ' ');
        section += `- 📖 [${cleanTitle}](/blog/${r.slug})\n`;
    });
    
    return section;
}

async function main() {
    console.log('\n🔗 Internal Linking Optimizer v1.0');
    console.log('Building knowledge graph and optimizing internal links...\n');
    
    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) console.log('🧪 DRY RUN MODE — No files will be modified.\n');
    
    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }
    
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Loading ${files.length} blog files...\n`);
    
    // Step 1: Build index of all blogs
    const blogs: BlogInfo[] = [];
    
    for (const file of files) {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        
        const titleMatch = content.match(/title:\s*["'](.+?)["']/);
        const categoryMatch = content.match(/category:\s*["']?(.+?)["']?\s*$/m);
        const body = content.replace(/^---[\s\S]*?---\n*/m, '');
        
        const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');
        const category = categoryMatch ? categoryMatch[1].trim() : 'Education';
        const keywords = extractKeywords(slug, title, body);
        
        // Count existing internal links
        const outgoing = (body.match(/\]\(\/blog\/[^)]+\)/g) || []).length;
        const incoming = 0; // Will be computed in pass 2
        
        blogs.push({
            slug, title, category, keywords,
            incomingLinks: incoming,
            outgoingLinks: outgoing,
            bodyLower: body.toLowerCase()
        });
    }
    
    // Step 2: Build Inverted Index and count incoming links
    buildInvertedIndex(blogs);
    
    // Fast incoming link scan: pre-calculate all link sets
    const linkMap: Map<string, string[]> = new Map();
    for (const b of blogs) {
        const foundLinks = b.bodyLower.match(/\/blog\/([a-z0-9-]+)/g) || [];
        linkMap.set(b.slug, foundLinks.map(l => l.replace('/blog/', '')));
    }

    const blogMap = new Map(blogs.map(b => [b.slug, b]));
    for (const [sourceSlug, links] of linkMap.entries()) {
        for (const targetSlug of links) {
            const targetBlog = blogMap.get(targetSlug);
            if (targetBlog) targetBlog.incomingLinks++;
        }
    }
    
    // Step 3: Process each blog
    let totalLinksAdded = 0;
    let relatedSectionsAdded = 0;
    const orphans = blogs.filter(b => b.incomingLinks === 0);
    
    console.log(`📊 Orphan pages (zero incoming links): ${orphans.length}/${blogs.length}`);
    console.log('');
    
    for (const blog of blogs) {
        const related = findRelatedBlogs(blog, blogs);
        if (related.length === 0) continue;
        
        const filePath = path.join(BLOG_DIR, `${blog.slug}.md`);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Separate frontmatter and body
        const fmMatch = content.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
        const frontmatter = fmMatch ? fmMatch[1] : '';
        let body = fmMatch ? fmMatch[2] : content;
        
        let changes = false;
        
        // Inject contextual links
        const { newBody, linksAdded } = injectContextualLinks(body, blog, related);
        if (linksAdded > 0) {
            body = newBody;
            totalLinksAdded += linksAdded;
            changes = true;
        }
        
        // Add Related Posts section if missing
        if (!body.includes('## 📚 Related Topics') && !body.includes('## Related Topics')) {
            const relatedSection = generateRelatedSection(related);
            if (relatedSection) {
                body += relatedSection;
                relatedSectionsAdded++;
                changes = true;
            }
        }
        
        if (changes) {
            if (!isDryRun) {
                fs.writeFileSync(filePath, frontmatter + body, 'utf-8');
            }
            console.log(`🔗 ${blog.slug} → +${linksAdded} inline links, ${body.includes('Related Topics') ? '+related section' : ''}`);
        }
    }
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 INTERNAL LINKING REPORT');
    console.log('═'.repeat(60));
    console.log(`  🔗 Inline links added:       ${totalLinksAdded}`);
    console.log(`  📚 Related sections added:   ${relatedSectionsAdded}`);
    console.log(`  🏝️  Orphan pages remaining:  ${orphans.length}`);
    console.log(`  📊 Total blogs processed:    ${blogs.length}`);
    
    if (orphans.length > 0 && orphans.length <= 20) {
        console.log('\n  🏝️  Orphan pages (no incoming links):');
        orphans.forEach(o => console.log(`     - ${o.slug}`));
    }
    
    // Save report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const report = {
        date: TODAY,
        summary: { totalLinksAdded, relatedSectionsAdded, orphanPages: orphans.length, totalBlogs: blogs.length },
        orphans: orphans.map(o => o.slug),
        knowledgeGraph: blogs.map(b => ({
            slug: b.slug, category: b.category, keywords: b.keywords.slice(0, 10),
            incomingLinks: b.incomingLinks, outgoingLinks: b.outgoingLinks
        }))
    };
    fs.writeFileSync(path.join(REPORTS_DIR, `linking-${TODAY}.json`), JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Report saved: jules-reports/linking-${TODAY}.json`);
    console.log('✨ Internal linking complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

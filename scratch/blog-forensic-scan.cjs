const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/content/blogs');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'undefined.md');

const stats = {
    total: 0,
    suggestionLimit: 0,
    fRAC: 0,
    jsonSquash: 0,
    nakedLatex: 0,
    wrongClass: 0,
    truncatedSections: 0,
    objectObject: 0,
    wrongSubjectFormulas: 0,
    solvedYes: 0,
    emptyLatex: 0,
    literalNewlines: 0,
    missingFromRegistry: 0,
    manualReviewTrue: 0,
    thinContent: 0,
};

const examples = {};
function addExample(key, slug, detail) {
    if (!examples[key]) examples[key] = [];
    if (examples[key].length < 8) examples[key].push({ slug, detail });
}

// Load registry to check missing entries
let registeredSlugs = new Set();
try {
    const blogsTsRaw = fs.readFileSync(path.join(__dirname, '../src/data/blogs.ts'), 'utf8');
    const idMatches = blogsTsRaw.matchAll(/"id":\s*"([^"]+)"/g);
    for (const m of idMatches) registeredSlugs.add(m[1]);
} catch (e) { console.error('Could not read blogs.ts'); }

for (const f of files) {
    stats.total++;
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    const slug = f.replace('.md', '');

    // 1. (suggestion limit reached)
    const slrCount = (c.match(/\(suggestion limit reached\)/g) || []).length;
    if (slrCount > 0) {
        stats.suggestionLimit++;
        addExample('suggestionLimit', slug, `${slrCount} occurrences`);
    }

    // 2. Case-mangled LaTeX
    const fracMatches = (c.match(/\\fRAC/g) || []).length;
    const ftextMatches = (c.match(/\\tEXT/gi) || []).length;
    if (fracMatches > 0 || ftextMatches > 0) {
        stats.fRAC++;
        addExample('fRAC', slug, `\\fRAC: ${fracMatches}, \\tEXT: ${ftextMatches}`);
    }

    // 3. JSON squashing
    if (/\{"heading"\s*:\s*"/.test(c)) {
        stats.jsonSquash++;
        addExample('jsonSquash', slug, 'has {"heading":..., "body":...} in markdown');
    }

    // 4. Naked LaTeX (no $ delimiters)
    const nakedFrac = (c.match(/(?<!\$)\\frac\{/g) || []).length;
    const nakedText = (c.match(/(?<!\$)\\text\{/g) || []).length;
    const nakedTotal = nakedFrac + nakedText;
    if (nakedTotal > 3) {
        stats.nakedLatex++;
        addExample('nakedLatex', slug, `${nakedTotal} naked LaTeX commands (frac: ${nakedFrac}, text: ${nakedText})`);
    }

    // 5. Wrong class label in title
    const titleMatch = c.match(/title:\s*["'](.+?)["']/);
    const slugClassMatch = slug.match(/class-(\d+)/);
    if (titleMatch && slugClassMatch) {
        const title = titleMatch[1];
        const expected = slugClassMatch[1];
        const titleClassMatch = title.match(/Class (\d+)/i);
        if (titleClassMatch && titleClassMatch[1] !== expected) {
            stats.wrongClass++;
            addExample('wrongClass', slug, `Title says "Class ${titleClassMatch[1]}" but slug says class-${expected}`);
        }
    }

    // 6. "Solved Yes" instead of "Solved PYQs"
    if (c.includes('Solved Yes') || c.includes('3 Solved Yes')) {
        stats.solvedYes++;
        addExample('solvedYes', slug, 'Says "Solved Yes" instead of "Solved PYQs"');
    }

    // 7. [object Object]
    if (c.includes('[object Object]')) {
        stats.objectObject++;
        addExample('objectObject', slug, 'Contains [object Object]');
    }

    // 8. Empty LaTeX blocks
    if (/\$\$\s*\$\$/.test(c)) {
        stats.emptyLatex++;
    }

    // 9. Literal \\n
    if (c.includes('\\\\n') && !c.includes('```')) {
        stats.literalNewlines++;
    }

    // 10. Missing from registry
    if (!registeredSlugs.has(slug)) {
        stats.missingFromRegistry++;
        addExample('missingFromRegistry', slug, 'Markdown exists but not in blogs.ts');
    }

    // 11. manualReview: true
    if (c.includes('manualReview: true')) {
        stats.manualReviewTrue++;
        addExample('manualReviewTrue', slug, 'Flagged for manual review');
    }

    // 12. Thin content (< 800 words total body)
    const bodyMatch = c.match(/^---[\s\S]*?---\r?\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : c;
    const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 500) {
        stats.thinContent++;
        addExample('thinContent', slug, `Only ${wordCount} words`);
    }

    // 13. Wrong subject formulas (physics in polisci, etc)
    const isPolSci = /politic|government|constitution|civics|polity/i.test(slug);
    const isHistory = /history|revolution|nationalism|industrial/i.test(slug);
    const hasPhysicsFormula = /buoyant|velocity|acceleration|kinetic energy|F\s*=\s*m\s*a|P\s*=\s*M\/V/i.test(c);
    if ((isPolSci || isHistory) && hasPhysicsFormula) {
        stats.wrongSubjectFormulas++;
        addExample('wrongSubjectFormulas', slug, 'Has physics formulas in a non-science blog');
    }

    // 14. Truncated sections (body cuts off mid-sentence at section boundary)
    const sectionBodies = c.split(/^## /gm).slice(1);
    for (const sec of sectionBodies) {
        const trimmed = sec.trim();
        const lastLine = trimmed.split('\n').pop().trim();
        if (lastLine && lastLine.length > 10 && !lastLine.endsWith('.') && !lastLine.endsWith('!') && !lastLine.endsWith('?') && !lastLine.endsWith('|') && !lastLine.endsWith(')') && !lastLine.endsWith('*') && !lastLine.endsWith(']') && !lastLine.endsWith(':') && !lastLine.endsWith('`') && !lastLine.endsWith('#')) {
            // Check if section ends mid-word or mid-sentence
            const endsWithArticle = /\b(the|a|an|and|or|is|was|in|of|to|for|that|with|this|from|by|as|at|on|it|not)\s*$/i.test(lastLine);
            if (endsWithArticle) {
                stats.truncatedSections++;
                addExample('truncatedSections', slug, `Section ends with: "...${lastLine.slice(-60)}"`);
                break;
            }
        }
    }
}

console.log('\n' + '='.repeat(70));
console.log('  JULES BLOG FORENSIC AUDIT — FULL SCOPE');
console.log('='.repeat(70));
console.log(`\n  Total blogs scanned: ${stats.total}`);
console.log(`  Registered in blogs.ts: ${registeredSlugs.size}`);
console.log('');

const issues = [
    ['🔴 (suggestion limit reached) spam', stats.suggestionLimit, 'suggestionLimit'],
    ['🔴 Case-mangled LaTeX (\\fRAC)', stats.fRAC, 'fRAC'],
    ['🔴 JSON squashing in body', stats.jsonSquash, 'jsonSquash'],
    ['🔴 Naked LaTeX (no $ delimiters)', stats.nakedLatex, 'nakedLatex'],
    ['🟡 Wrong class in title', stats.wrongClass, 'wrongClass'],
    ['🟡 "Solved Yes" not "Solved PYQs"', stats.solvedYes, 'solvedYes'],
    ['🟡 [object Object] artifacts', stats.objectObject, 'objectObject'],
    ['🟡 Truncated sections', stats.truncatedSections, 'truncatedSections'],
    ['🟡 Wrong subject formulas', stats.wrongSubjectFormulas, 'wrongSubjectFormulas'],
    ['🟡 manualReview: true', stats.manualReviewTrue, 'manualReviewTrue'],
    ['🟠 Missing from registry', stats.missingFromRegistry, 'missingFromRegistry'],
    ['🟠 Thin content (<500 words)', stats.thinContent, 'thinContent'],
    ['⚪ Empty LaTeX $$$$', stats.emptyLatex, 'emptyLatex'],
    ['⚪ Literal \\\\n', stats.literalNewlines, 'literalNewlines'],
];

for (const [label, count, key] of issues) {
    if (count === 0) {
        console.log(`  ${label}: ${count} ✅`);
    } else {
        console.log(`  ${label}: ${count}`);
        if (examples[key]) {
            for (const ex of examples[key]) {
                console.log(`      → ${ex.slug}: ${ex.detail}`);
            }
        }
    }
}

// Summary
const criticalCount = stats.suggestionLimit + stats.fRAC + stats.jsonSquash + stats.nakedLatex;
const warningCount = stats.wrongClass + stats.solvedYes + stats.objectObject + stats.truncatedSections + stats.wrongSubjectFormulas;
console.log('\n' + '='.repeat(70));
console.log(`  CRITICAL issues (content garbled): ${criticalCount} blogs affected`);
console.log(`  WARNING issues (quality degraded): ${warningCount} blogs affected`);
console.log(`  ORPHANED (not in registry): ${stats.missingFromRegistry} blogs`);
console.log('='.repeat(70));

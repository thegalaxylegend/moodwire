import fs from 'fs';
import path from 'path';

export interface MCQ {
    question: string;
    options: string[];
    answer: string;
    answer_text: string;
}

export interface Section {
    heading: string;
    body: string;
    needsReview?: boolean;
    table?: {
        headers: string[];
        rows: string[][];
    };
}

export interface BlogPostJSON {
    title: string;
    slug: string;
    subject: string;
    chapter_name: string;
    exam_class: number;
    last_updated: string;
    practice_link_path: string;
    hero_image: string;
    manual_review?: boolean;
    content: {
        intro: string;
        sections: Section[];
        mcqs: MCQ[];
        quick_recall: string[];
    };
}

export interface QualityReport {
    passed: boolean;
    score: number;
    critical_failures: string[];
    warnings: string[];
    auto_fixed: Array<{ field: string; old: any; new: any }>;
    patch_missing_sections: string[]; // List of specific section headers to generate and inject
    regenerate_all: boolean; // True if word count is too low or structure is completely broken
}

const SUBJECT_TO_PATH: Record<string, string> = {
    "Political Science": "/class-11/political-science/",
    "Geography": "/class-11/geography/",
    "History": "/class-10/history/",
    "Social Science": "/class-10/social-science/",
    "Economics": "/class-10/economics/",
    "Civics": "/class-10/civics/",
    "Physics": "/class-11/physics/",
    "Chemistry": "/class-11/chemistry/",
    "Biology": "/class-11/biology/",
    "Mathematics": "/class-11/mathematics/",
    "Science": "/class-10/science/",
    "English": "/class-10/english/"
};

// Structural Section Regexes
export const hasAyushNoteRegex = /ayush'?s? note/i;
export const hasMistakesRegex = /mistakes? that cost marks|trap questions?/i;
export const hasPyqsRegex = /solved pyqs?/i;
export const hasFormulaBankRegex = /formula bank|key formulas/i;

const CHAPTER_TO_SUBJECT: Record<string, string> = {
    "Constitutional Framework": "Social Science",
    "Fundamental Rights": "Social Science",
    "DPSP": "Social Science",
    "Federalism": "Social Science",
    "Election": "Social Science",
    "Parliament": "Social Science",
    "Judiciary": "Social Science",
    "Local Government": "Social Science",
    "Polity": "Social Science",
    "Civics": "Social Science",
    "Art & Culture": "History",
    "French Revolution": "History",
    "Nationalism": "History",
    "Industrialisation": "History",
    "Agriculture": "Geography",
    "Physical Geography": "Geography",
    "Climate": "Geography",
    "Drainage": "Geography",
    "Geomorphology": "Geography",
    "India: Physical Environment": "Geography",
    "Indian Geography": "Geography",
    "Sectors of Indian Economy": "Economics",
    "Money and Credit": "Economics",
    "Computer Organization": "Computer Science",
    "Digital Logic": "Computer Science",
    "Data Structures": "Computer Science",
    "Algorithms": "Computer Science",
    "Electrostatics": "Physics",
    "Current Electricity": "Physics",
    "Magnetism": "Physics",
    "Optics": "Physics",
    "Atoms": "Physics",
    "Nuclei": "Physics",
    "Thermodynamics": "Physics",
    "Kinematics": "Physics",
    "Rotational Motion": "Physics",
    "Solid State": "Chemistry",
    "Solutions": "Chemistry",
    "Electrochemistry": "Chemistry",
    "Chemical Kinetics": "Chemistry",
    "Surface Chemistry": "Chemistry",
    "Metallurgy": "Chemistry",
    "p-Block": "Chemistry",
    "d-Block": "Chemistry",
    "f-Block": "Chemistry",
    "Coordination Compounds": "Chemistry",
    "Haloalkanes": "Chemistry",
    "Phenols": "Chemistry",
    "Aldehydes": "Chemistry",
    "Amines": "Chemistry",
    "Biomolecules": "Chemistry",
    "Polymers": "Chemistry",
    "Sets": "Mathematics",
    "Relations and Functions": "Mathematics",
    "Trigonometry": "Mathematics",
    "Induction": "Mathematics",
    "Complex Numbers": "Mathematics",
    "Inequalities": "Mathematics",
    "Permutations": "Mathematics",
    "Binomial": "Mathematics",
    "Sequences": "Mathematics",
    "Straight Lines": "Mathematics",
    "Conic Sections": "Mathematics",
    "Limits": "Mathematics",
    "Derivatives": "Mathematics",
    "Statistics": "Mathematics",
    "Probability": "Mathematics",
    "Matrices": "Mathematics",
    "Determinants": "Mathematics",
    "Calculus": "Mathematics",
    "Integrals": "Mathematics",
    "Differential Equations": "Mathematics",
    "Vectors": "Mathematics"
};

export function checkBlogQuality(post: BlogPostJSON): QualityReport {
    // ═══════════════════════════════════════════════════════════════════
    // PRE-SCORING REPAIR PASS: Fix known-fixable issues BEFORE scoring
    // This prevents the "score 0 for fixable LaTeX" death spiral.
    // Without this, blogs with naked LaTeX (\frac without $) score 0
    // even though checkFormattingIntegrity() can fix them automatically.
    // ═══════════════════════════════════════════════════════════════════
    let preRepairCount = 0;
    for (const sec of (post.content?.sections || [])) {
        if (sec && typeof sec.body === 'string') {
            const original = sec.body;
            sec.body = checkFormattingIntegrity(sec.body);
            if (sec.body !== original) preRepairCount++;
        }
    }
    if (post.content?.intro && typeof post.content.intro === 'string') {
        post.content.intro = checkFormattingIntegrity(post.content.intro);
    }
    // Also repair MCQ content
    for (const mcq of (post.content?.mcqs || [])) {
        if (mcq) {
            if (typeof mcq.question === 'string') mcq.question = checkFormattingIntegrity(mcq.question);
            if (typeof mcq.answer_text === 'string') mcq.answer_text = checkFormattingIntegrity(mcq.answer_text);
            if (Array.isArray(mcq.options)) {
                mcq.options = mcq.options.map(o => typeof o === 'string' ? checkFormattingIntegrity(o) : o);
            }
        }
    }
    if (preRepairCount > 0) {
        console.log(`🔧 Pre-scoring repair: Fixed formatting in ${preRepairCount} section(s) before quality check.`);
    }

    let score = 100;
    const report: QualityReport = {
        passed: false,
        score: 100,
        critical_failures: [],
        warnings: [],
        auto_fixed: [],
        patch_missing_sections: [],
        regenerate_all: false
    };
    if (preRepairCount > 0) {
        report.auto_fixed.push({ field: 'pre_scoring_latex_repair', old: `${preRepairCount} sections`, new: 'Auto-repaired before scoring' });
    }

    // 1. Date — NO LONGER AUTO-CHANGED (preserve original publish dates)
    // Dates are only set at blog creation time, never mutated by quality checks.

    // 2. Word Count Check
    const totalWords = (post.content?.sections || []).reduce((acc, sec) => acc + (sec.body ? String(sec.body).split(/\s+/).length : 0), 0);
    
    if (totalWords < 800) {
        score -= 40;
        report.critical_failures.push(`Critically low word count: ${totalWords} (Min 800 for Patching)`);
        report.regenerate_all = true;
    } else if (totalWords < 1200) {
        score -= 10;
        report.warnings.push(`Moderate word count: ${totalWords} (Aim for 1200+)`);
    } else if (totalWords < 1500) {
        score -= 3;
        report.warnings.push(`Word count acceptable but could be deeper: ${totalWords}`);
    }

    // 3. Granular Section Check
    const sections = post.content?.sections || [];
    const sectionHeadings = sections.map(s => s.heading.toLowerCase());
    const bodyContent = JSON.stringify(post.content).toLowerCase();

    // Required Sections Map
    const required = [
        { name: "⚡ Formula Bank", regex: hasFormulaBankRegex, weight: 15 },
        { name: "🪤 Trap Questions", regex: hasMistakesRegex, weight: 20 },
        { name: "🧠 Ayush's Note", regex: hasAyushNoteRegex, weight: 20 },
        { name: "✏️ 3 Solved PYQs", regex: hasPyqsRegex, weight: 20 }
    ];

    for (const req of required) {
        const found = sectionHeadings.some(h => req.regex.test(h)) || req.regex.test(bodyContent);
        if (!found) {
            score -= req.weight;
            report.critical_failures.push(`Missing Required Section: ${req.name}`);
            report.patch_missing_sections.push(req.name);
        }
    }

    // 4. MCQ Check
    if (!post.content?.mcqs || post.content.mcqs.length < 3) {
        score -= 15;
        report.critical_failures.push("Insufficient MCQs (Need at least 3)");
        report.patch_missing_sections.push("Practice MCQs");
    } else {
        // Check MCQ quality — do all MCQs have valid options and answers?
        const invalidMcqs = (post.content.mcqs || []).filter(m =>
            !m.question || m.question.length < 10 ||
            !m.options || m.options.length < 4 ||
            !m.answer || !m.answer_text
        );
        if (invalidMcqs.length > 0) {
            score -= 5;
            report.warnings.push(`${invalidMcqs.length} MCQ(s) have incomplete data`);
        }
    }

    // 5. Individual Section Quality Check (NEW)
    let thinSectionCount = 0;
    for (const sec of sections) {
        const bodyLen = (sec.body || '').length;
        const wordCount = (sec.body || '').split(/\s+/).filter(w => w.length > 0).length;
        
        if (wordCount < 30 && !sec.needsReview) {
            thinSectionCount++;
        }
    }
    if (thinSectionCount > 0) {
        score -= Math.min(15, thinSectionCount * 5);
        report.warnings.push(`${thinSectionCount} section(s) have very thin content (<30 words)`);
    }

    // 6. Kill-List Phrase Detection (NEW)
    const killListPhrases = [
        'delve into', 'embark on', 'comprehensive guide', 'in conclusion',
        'without further ado', 'game-changer', 'cutting-edge', 'groundbreaking',
        'unlock the secrets', 'dive deep', 'explore the world', 'journey through',
        'let\'s explore', 'in the realm of', 'it\'s important to note',
        'in today\'s world', 'as we navigate', ' n '
    ];
    const contentStr = JSON.stringify(post.content).toLowerCase();
    const foundKillPhrases = killListPhrases.filter(phrase => contentStr.includes(phrase));
    if (foundKillPhrases.length > 0) {
        score -= Math.min(10, foundKillPhrases.length * 2);
        report.warnings.push(`AI filler phrases detected: ${foundKillPhrases.join(', ')}`);
    }

    // 7. Empty LaTeX Block Detection (NEW)
    const emptyLatex = (contentStr.match(/\$\$\s*\$\$/g) || []).length;
    if (emptyLatex > 0) {
        score -= emptyLatex * 3;
        report.warnings.push(`${emptyLatex} empty LaTeX block(s) ($$$$) found`);
    }

    // 8. Quick Recall Quality (NEW)
    if (!post.content?.quick_recall || post.content.quick_recall.length < 3) {
        score -= 5;
        report.warnings.push("Quick recall section missing or has fewer than 3 items");
    }

    // 9. Duplicate Heading Detection (NEW)
    const headingSet = new Set<string>();
    let dupHeadingCount = 0;
    for (const h of sectionHeadings) {
        if (headingSet.has(h)) {
            dupHeadingCount++;
        }
        headingSet.add(h);
    }
    if (dupHeadingCount > 0) {
        score -= dupHeadingCount * 5;
        report.warnings.push(`${dupHeadingCount} duplicate section heading(s)`);
    }

    // 10. NeedsReview Sections (NEW - penalize sections marked for review)
    const reviewSections = sections.filter(s => s.needsReview);
    if (reviewSections.length > 0) {
        score -= reviewSections.length * 3;
        report.warnings.push(`${reviewSections.length} section(s) marked as needing review`);
    }

    // ========= 11. CORRUPTION DETECTION (CRITICAL — prevents all 6 root causes) =========

    // 11a. LLM Truncation Marker: "(suggestion limit reached)"
    // Root Cause #1: LLM hit output token limit and emitted this as a truncation marker.
    const truncationCount = (contentStr.match(/\(suggestion limit reached\)/g) || []).length;
    if (truncationCount > 0) {
        score -= 50; // Critical failure — content is garbled
        report.critical_failures.push(`LLM truncation detected: ${truncationCount}× "(suggestion limit reached)" — content is garbled`);
        report.regenerate_all = true;
    }

    // 11e. Heading Hallucination: "Solved Yes" instead of "Solved PYQs"
    if (contentStr.includes('solved yes')) {
        score -= 3;
        report.warnings.push('Heading hallucination: "Solved Yes" should be "Solved PYQs"');
    }

    // ========= MATH RENDERING CHECKS (DISABLED) =========
    // LaTeX validation is no longer needed since we use Unicode math natively.

    report.score = Math.max(0, score);
    report.passed = report.score >= 80; // Quality Gate Threshold
    return report;
}

export function reconstructBullets(text: string): string {
    if (!text) return "";
    
    // Detect flattened list markers like ".,-", ",-", or even just " - " after a sentence
    let processed = text
        .replace(/([\.!\?])\s*[,\-]\s*/g, '$1\n- ') // Fix "Statement. - Next" -> "Statement.\n- Next"
        .replace(/([\.!\?])\s*([A-Z][^.!?]*:)\s*/g, '$1\n- **$2** ') // Fix "Pattern. Hidden Pattern: Insight"
        .replace(/,\s*- /g, '\n- ') // Fix ",- " -> "\n- "
        .replace(/[:]\s*,\s*-/g, ':\n-'); // Fix ": ,-"

    // Clean up double bullets "- - " -> "- "
    processed = processed.replace(/^- - /gm, '- ');
    processed = processed.replace(/\n- - /g, '\n- ');

    // Ensure there's a newline before every "- " that isn't already preceded by one
    // But ONLY if it's not inside a table (roughly checked by pipe characters)
    const lines = processed.split('\n');
    const filteredLines = lines.map(line => {
        if (line.trim().startsWith('|')) return line; // Skip tables
        return line.replace(/([^\n])\n*(- )/g, '$1\n$2');
    });

    return filteredLines.join('\n').trim();
}

export function jsonToMarkdown(post: BlogPostJSON): string {
    const now = new Date();
    const currentYear = Number(now.getFullYear());
    const currentMonth = now.getMonth();
    const targetYear = currentMonth >= 7 ? currentYear + 1 : currentYear;

    const SUBJECT_EXAM_DESC: Record<string, string> = {
        'Physics': 'JEE & NEET', 'Chemistry': 'JEE & NEET',
        'Mathematics': 'JEE', 'Biology': 'NEET',
        'Computer Science': 'GATE & Boards',
        'Science': 'CBSE Boards', 'Social Science': 'CBSE Boards'
    };
    const examTag = post.exam_class >= 11 ? (SUBJECT_EXAM_DESC[post.subject] || 'CBSE') : 'CBSE';
    const seoTitle = `${post.chapter_name || post.title} Class ${post.exam_class} ${post.subject} Revision — ${examTag} ${targetYear}`;

    const templates = [
        `Master ${post.chapter_name} for ${post.subject}. Grandmaster Guide with secret formulas and MCQ revision set.`,
        `The ultimate ${post.chapter_name} revision guide. Peers-approved notes by Ayush and solved PYQs.`
    ];
    // Safety hash
    function normalizeLaTeX(text: any): string {
        if (text === null || text === undefined) return '';
        if (typeof text !== 'string') {
            if (Array.isArray(text)) return text.map(normalizeLaTeX).join('\n');
            try { return JSON.stringify(text); } catch { return String(text); }
        }
        return text.trim();
    }

    function isValidTable(table: any): boolean {
        return !!(table && Array.isArray(table.headers) && table.headers.length > 0 && Array.isArray(table.rows) && table.rows.length > 0);
    }


    const sectionsHtml = (post.content?.sections || []).map(sec => {
        const heading = sec.heading || '';
        let body = normalizeLaTeX(sec.body || '');
        
        // --- NEW: Restore missing line changes for Academic Notes ---
        if (heading.includes("Note") || heading.includes("Box") || heading.includes("Mistakes") || heading.includes("Thing")) {
            body = reconstructBullets(body);
        }

        body = body.replace(/([^\n])\n([*-] )/g, '$1\n\n$2');
        let tableStr = '';
        if (isValidTable(sec.table)) {
            const h = sec.table!.headers.map(normalizeLaTeX);
            const r = sec.table!.rows.map(row => row.map(normalizeLaTeX));
            tableStr = `\n| ${h.join(' | ')} |\n| ${h.map(() => '---').join(' | ')} |\n${r.map(row => `| ${row.join(' | ')} |`).join('\n')}\n`;
        }
        return `\n## ${heading}\n\n${body}\n${tableStr}\n`;
    }).join('\n');

    // Helper to clean option prefixes
    function cleanOption(opt: string): string {
        if (!opt) return "";
        // Remove "A)", "A.", "1)", "1.", "Option A:", etc.
        return opt.replace(/^[A-Z0-9][\.\)\:]\s*/i, '').replace(/^[A-Z][0-9][\.\)\:]\s*/i, '').trim();
    }

    const mcqsHtml = (post.content?.mcqs || []).map((mcq, i) => {
        const opts = (mcq.options || []).map((o, idx) => {
            const letter = String.fromCharCode(65 + idx);
            const bodyContent = normalizeLaTeX(cleanOption(o));
            return `**${letter})** ${bodyContent}  `; // Two spaces for hard break
        }).join('\n');
        
        return `\n**${i + 1}. ${normalizeLaTeX(mcq.question)}**\n\n${opts}\n\n**Answer:** ${mcq.answer}) ${normalizeLaTeX(mcq.answer_text)}\n`;
    }).join('\n---\n');

    return `
${sectionsHtml}

## 📝 Practice MCQs

${mcqsHtml}
`;
}

export function standardizeMarkdown(markdown: string, meta: { title: string, heroImage: string, lastUpdated: string, practiceLink: string, manualReview?: boolean, recall?: string[] }): string {
    let body = markdown;
    let frontmatter = '';
    // Aggressively strip legacy metadata patterns
    body = markdown.replace(/^---[\s\S]*?---\n*/, '').trim(); 
    body = body.replace(/category:\s*"(.*?)"/g, '');
    body = body.replace(/keywords:\s*"(.*?)"/g, '');
    body = body.replace(/slug:\s*"(.*?)"/g, '');
    body = body.replace(/subject:\s*"(.*?)"/g, '');
    body = body.replace(/exam_class:\s*"(.*?)"/g, '');
    body = body.replace(/chapter_name:\s*"(.*?)"/g, '');


    body = body.replace(/<div class="quick-summary">[\s\S]*?<\/div>/gi, '');
    body = body.replace(/## (📋 )?Table of Contents\n*/gi, '');
    body = body.replace(/!\[.*?\]\(.*?\)/g, '');
    body = body.replace(/\*Last Updated:.*?\*/gi, '');
    body = body.replace(/<a id=".*?"><\/a>/gi, '');
    body = body.replace(/^[*-] \[[^\]]+\]\(#[^\)]+\)\s*$/gm, '');
    body = body.trim();

    const tocItems: Array<{ title: string, id: string, level: number }> = [];
    function slugify(text: string): string {
        const cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        return cleanText.toLowerCase().replace(/&/g, 'and').replace(/[^\w ]+/g, '').replace(/ +/g, '-').trim();
    }

    body = body.replace(/^(##|###) (.*)$/gm, (match, level, title) => {
        const rawTitle = title.trim();
        if (rawTitle.toLowerCase().includes('table of contents') || rawTitle.toLowerCase().includes('quick recall') || rawTitle.toLowerCase().includes('introduction')) return ""; 
        const id = slugify(rawTitle);
        const displayTitle = rawTitle.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
        tocItems.push({ title: displayTitle, id, level: level.length });
        return `${level} <a id="${id}"></a>${rawTitle}`;
    });

    // Clean Title: Prevent double-suffixes and cross-topic mangling
    let cleanTitle = meta.title || "Untitled Note";
    // Remove redundant "Revision Recap", "Quick Guide", etc if doubled
    cleanTitle = cleanTitle.split(/ — | - /)[0].trim(); // Get core topic
    const finalTitle = `${cleanTitle} — Grandmaster Guide`;

    const tocMarkdown = tocItems.length > 0
        ? `\n## 📋 Table of Contents\n\n${tocItems.map(item => `${'  '.repeat(item.level - 2)}- [${item.title}](#${item.id})`).join('\n')}\n`
        : '';

    const footer = `\n---\n\n### 🚀 Ready to Ace Your Exam?\nPut your knowledge to the test! Take the free [**Practice Mock Test**](${meta.practiceLink}) now and track your progress against thousands of students.\n\n---\n*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*`;

    let assembledBody = `---
heroImage: "${meta.heroImage}"
title: "${finalTitle}"
description: "${meta.title} Revision Notes. Last Updated: ${meta.lastUpdated}."
category: "Exam Notes"
date: "${meta.lastUpdated}"
practice_link: "${meta.practiceLink}"
manualReview: ${meta.manualReview || false}
---

${tocMarkdown}

${body}

${footer}`;

    // Fix P2.3: Final Formatting Integrity Guard (Math, Bold, Code)
    assembledBody = checkFormattingIntegrity(assembledBody);

    // Fix P2.2: Global MCQ repair (Fuzzy)
    assembledBody = normalizeMarkdownMCQs(assembledBody);

    return assembledBody;
}

/**
 * Aggressively purges AI-filler phrases like "Certainly! Here is..."
 */
export function sanitizeAiText(text: string): string {
    // Type guard: prevent 'cleaned.replace is not a function' crash
    if (text === null || text === undefined) return '';
    if (typeof text !== 'string') {
        try { return String(text); } catch { return ''; }
    }
    const aiFiller = [
        /^Certainly!.*?\n/gi,
        /^Here is.*?\n/gi,
        /^Please note.*?\n/gi,
        /^In this section.*?\n/gi,
        /^I hope this helps.*?\n/gi,
        /^Let me know if you need anything else.*?\n/gi,
        /^(Certainly|Absolutely|Sure)!/gi,
        /As an AI language model,/gi,
        /I am unable to generate/gi,
        /I apologize, but/gi
    ];
    let cleaned = text;
    for (const pattern of aiFiller) {
        cleaned = cleaned.replace(pattern, '').trim();
    }
    return cleaned;
}

/**
 * Compatibility Wrapper for legacy scripts.
 * Maps old checkLatexIntegrity calls to the new multi-gate checkFormattingIntegrity.
 */
export function checkLatexIntegrity(text: string): string {
    return checkFormattingIntegrity(text);
}

export function checkFormattingIntegrity(text: string): string {
    if (!text) return "";

    let repaired = text;

    // ========= NEW: Remove truncation markers =========
    repaired = repaired.replace(/\(suggestion limit reached\)/g, '');

    // ========= NEW: Fix "Solved Yes" → "Solved PYQs" =========
    repaired = repaired.replace(/Solved Yes/g, 'Solved PYQs');

    // ========= NEW: Fix mangled "-n-" internal links =========
    // Prevents the 430 broken links issue from recurring
    repaired = repaired.replace(/(\]\(\/blog\/[a-z0-9-]+)-n-([a-z0-9-]+\))/gi, '$1-and-$2');
    
    // Fix "n" as shorthand for "and" in prose
    repaired = repaired.replace(/\b n \b/g, ' and ');
    repaired = repaired.replace(/\b N \b/g, ' And ');

    // 2. Bold and Italics (** and *)
    const boldCount = (repaired.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) repaired += '**';
    
    // 3. Code Tags (`)
    const codeCount = (repaired.match(/(?<!`)`(?!`)/g) || []).length;
    if (codeCount % 2 !== 0) repaired += '`';

    return repaired;
}

/**
 * REPAIR Logic: Normalizes MCQs in a full markdown body.
 * Ensures options A, B, C, D are on new lines with proper spacing.
 * Fix P2.2: Added fuzzy matching for 'Answer:' variations.
 */
export function normalizeMarkdownMCQs(body: string): string {
    if (!body) return "";

    // Find MCQ blocks across multiple lines (Fuzzy Support)
    const mcqBlockRegex = /(\*\*?\d+[\.\)][\s\S]*?)(\s*\*?\*?[A-D][\)\.][\s\S]*?)(\**?(?:Answer|Correct|Solution|Options?):?[\s\S]*?)(?=\n\n|\n\*\*?\d+[\.\)]|$)/gi;

    return body.replace(mcqBlockRegex, (match, head, optionsBody, answer) => {
        const optionStarterRegex = /(\n?\s*\*?\*?[A-D][\)\.]\s*\*?\*?)/g;
        
        let repairedOptions = optionsBody.trim()
            .replace(optionStarterRegex, (m: string) => `\n${m.trim()} `)
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0)
            .join('\n');

        return `${head.trim()}\n${repairedOptions}\n\n${answer.trim()}\n\n`;
    });
}


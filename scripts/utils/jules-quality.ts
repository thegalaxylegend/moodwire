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
    regenerate_sections: string[];
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

const CHAPTER_TO_SUBJECT: Record<string, string> = {
    "Constitutional Framework": "Social Science",
    "Fundamental Rights": "Social Science",
    "DPSP": "Social Science",
    "DPSP & Duties": "Social Science",
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
    let score = 100;
    const report: QualityReport = {
        passed: false,
        score: 100,
        critical_failures: [],
        warnings: [],
        auto_fixed: [],
        regenerate_sections: []
    };

    const today = new Date().toISOString().split('T')[0];

    // ========= AUTO-FIXES (Zero score penalty — silently corrected) =========

    // Auto-fix: Date
    if (post.last_updated !== today) {
        report.auto_fixed.push({ field: 'last_updated', old: post.last_updated, new: today });
        post.last_updated = today;
    }

    // Auto-fix: Subject correction
    let matchedSubject = "";
    for (const [key, sub] of Object.entries(CHAPTER_TO_SUBJECT)) {
        if (post.chapter_name.toLowerCase().includes(key.toLowerCase()) || post.title.toLowerCase().includes(key.toLowerCase())) {
            matchedSubject = sub;
            break;
        }
    }
    if (matchedSubject && post.subject !== matchedSubject) {
        // If it's Social Science but Class 11, it's actually Political Science
        if (matchedSubject === "Social Science" && post.exam_class >= 11) {
            matchedSubject = "Political Science";
        }
        report.auto_fixed.push({ field: 'subject', old: post.subject, new: matchedSubject });
        post.subject = matchedSubject;
    }

    // Auto-fix: Practice link path
    const expectedPrefix = SUBJECT_TO_PATH[post.subject || 'default'] || "/class-11/physics/";
    if (post.practice_link_path && !post.practice_link_path.startsWith(expectedPrefix)) {
        const newPath = `${expectedPrefix}${post.slug}`;
        report.auto_fixed.push({ field: 'practice_link_path', old: post.practice_link_path, new: newPath });
        post.practice_link_path = newPath;
    } else if (!post.practice_link_path) {
        post.practice_link_path = `${expectedPrefix}${post.slug}`;
    }

    // Auto-fix: Kill list phrases (strip silently — no score deduction)
    const killList = [
        "in conclusion", "delve into", "it is important to note",
        "world-best", "comprehensive", "ultimate guide",
        "embark on your journey", "needless to say", "master this today",
        "everything you need", "complete guide", "mastering this",
        "in today's competitive world", "vibrant", "robust", "unveiling",
        "embark on a journey", "one of the most important topics",
        "written with 10+ years experience", "master [topic] today",
        "comprehensive guide"
    ];
    for (const phrase of killList) {
        const regex = new RegExp(phrase, 'gi');
        if (regex.test(post.content.intro)) {
            post.content.intro = post.content.intro.replace(regex, '').replace(/  +/g, ' ').trim();
            report.auto_fixed.push({ field: 'intro_phrase', old: phrase, new: '[removed]' });
        }
        for (const sec of post.content.sections) {
            if (typeof sec.body === 'string' && regex.test(sec.body)) {
                sec.body = sec.body.replace(regex, '').replace(/  +/g, ' ').trim();
                report.auto_fixed.push({ field: `section_phrase:${sec.heading}`, old: phrase, new: '[removed]' });
            }
        }
    }

    // Auto-fix: SEO target year
    const nowDate = new Date();
    const curYear = Number(nowDate.getFullYear());
    const curMonth = nowDate.getMonth();
    const targetYear = String(curMonth >= 7 ? curYear + 1 : curYear);
    if (!post.title.includes(targetYear)) {
        const oldTitle = post.title;
        post.title = post.title.replace(/\d{4}/g, targetYear);
        if (!post.title.includes(targetYear)) post.title = `${post.title} ${targetYear}`;
        report.auto_fixed.push({ field: 'title_year', old: oldTitle, new: post.title });
    }

    // Auto-fix: Title kill-list phrases
    const titleKillPhrases = ["ultimate guide", "comprehensive", "everything you need", "complete guide", "master today"];
    for (const phrase of titleKillPhrases) {
        if (post.title.toLowerCase().includes(phrase)) {
            const old = post.title;
            post.title = post.title.replace(new RegExp(phrase, 'gi'), '').replace(/  +/g, ' ').trim();
            report.auto_fixed.push({ field: 'title_killphrase', old, new: post.title });
        }
    }

    // ========= CRITICAL STRUCTURAL CHECKS (Deduct from 100) =========

    const bodyContent = JSON.stringify(post.content).toLowerCase();

    const PCMB_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Maths'];

    // 1. Word Count (Dynamic threshold)
    // The "Last-Night Revision Format" removes fluff, but we still strictly enforce 1000 words min.
    const minWordCount = 1000;
    
    const wordCount = (typeof post.content?.intro === 'string' ? post.content.intro.split(/\s+/).length : 0) +
        (post.content?.quick_recall || []).reduce((acc, r) => acc + r.split(/\s+/).length, 0) +
        (post.content?.sections || []).reduce((acc, s) => acc + (typeof s.body === 'string' ? s.body.split(/\s+/).length : 0), 0);
        
    if (wordCount < minWordCount) {
        score -= 30;
        report.critical_failures.push(`Low word count: ${wordCount} (Min ${minWordCount} for Revision Format)`);
        report.regenerate_sections.push("all");
    }

    // 2. Mandatory Sections (Robust keywords for new format)
    const hasAyushNote = /ayush'?s? note/i.test(bodyContent);
    const hasMistakes = /mistakes? that cost marks|trap questions?/i.test(bodyContent);
    const hasPyqs = /solved pyqs?/i.test(bodyContent);
    const mcqCount = (post.content?.mcqs || []).length;

    if (!hasAyushNote) {
        score -= 20;
        report.critical_failures.push("Missing 'Ayush's Note' section");
        report.regenerate_sections.push("sections");
    }
    if (!hasMistakes) {
        score -= 20;
        report.critical_failures.push("Missing 'Mistakes' section");
        report.regenerate_sections.push("sections");
    }
    if (mcqCount < 5) {
        score -= 15;
        report.critical_failures.push(`Insufficient MCQs: ${mcqCount}/5`);
        report.regenerate_sections.push("mcqs");
    }

    // 3. Section Depth
    if ((post.content?.sections || []).length < 4) {
        score -= 20;
        report.critical_failures.push("Insufficient sections (Min 4)");
        report.regenerate_sections.push("sections");
    }

    // 4. LaTeX Formatting
    if (bodyContent.includes('\\frac') || bodyContent.includes('\\sqrt')) {
        if (!bodyContent.includes('$')) {
            score -= 10;
            report.critical_failures.push("LaTeX error (Missing $ delimiters)");
            report.regenerate_sections.push("sections");
        }
    }

    // 5. MCQ Completeness
    post.content.mcqs.forEach((mcq, i) => {
        if (!mcq.answer) {
            score -= 5;
            report.critical_failures.push(`MCQ #${i+1} missing answer`);
            report.regenerate_sections.push("mcqs");
        }
        if (!mcq.answer_text) {
            score -= 5;
            report.critical_failures.push(`MCQ #${i+1} missing explanation`);
            report.regenerate_sections.push("mcqs");
        }
    });

    // 6. Table Leak Detection
    post.content.sections.forEach(sec => {
        if (sec.table) {
            const tableStr = JSON.stringify(sec.table).toLowerCase();
            const leaks = ["ayush's tips", "my personal note", "as i recall", "i always"];
            if (leaks.some(l => tableStr.includes(l))) {
                score -= 10;
                report.critical_failures.push(`Table leak in: ${sec.heading}`);
                report.regenerate_sections.push(`section: ${sec.heading}`);
            }
        }
    });

    // 7. Factual Accuracy (Geography) - PRECISE REGEX
    const fullText = JSON.stringify(post).toLowerCase();
    if (post.subject === "Geography") {
        if (/(mount everest is the highest peak in india|everest is india'?s highest peak)/i.test(fullText)) {
            score -= 30;
            report.critical_failures.push("Everest ≠ India's highest peak (K2/Kangchenjunga)");
            report.regenerate_sections.push("all");
        }
        if (/(indus is the longest river in india|indus is india'?s longest river)/i.test(fullText)) {
            score -= 30;
            report.critical_failures.push("Indus ≠ India's longest river (Ganga)");
            report.regenerate_sections.push("all");
        }
    }

    // ========= INFORMATIONAL WARNINGS (No score deduction) =========
    if (wordCount >= 1200 && wordCount < 2000) report.warnings.push(`Word count ${wordCount} below 2000 target.`);
    if ((post.content?.mcqs || []).length < 3) report.warnings.push("Fewer than 3 MCQs.");
    const genericImages = ["generic-study.webp", "geography-terrain.webp"];
    if (genericImages.some(img => post.hero_image.includes(img))) report.warnings.push("Generic fallback image used.");
    const fillerPhrases = ["as i navigate through", "i find it fascinating to explore the nuances", "as i delve deeper into", "i hope this journey helps you"];
    if (fillerPhrases.some(f => fullText.includes(f))) report.warnings.push("AI filler phrases detected.");
    post.content.sections.forEach(sec => {
        if (!sec.heading.trim().endsWith("?")) report.warnings.push(`H2 not a question: "${sec.heading}"`);
    });
    if (post.title.length > 70) report.warnings.push(`Title too long (${post.title.length} chars).`);
    else if (post.title.length < 30) report.warnings.push(`Title too short (${post.title.length} chars).`);
    if (post.exam_class >= 11 && PCMB_SUBJECTS.includes(post.subject)) {
        const hasExam = post.title.toLowerCase().includes('jee') || post.title.toLowerCase().includes('neet') || post.title.toLowerCase().includes('gate');
        if (!hasExam) report.warnings.push("Title missing exam name (JEE/NEET).");
    }

    // ========= FINAL SCORING: 100/100 required to publish =========
    report.score = Math.max(0, score);

    // SAFETY FLOOR: If the blog has > 500 words, it shouldn't score 0.
    // This prevents a single missing marker from killing a high-quality long blog.
    if (wordCount > 500 && report.score < 50) {
        report.score = 50; 
        report.warnings.push("Score floor applied (Content exists but structural markers missing).");
    }

    report.passed = report.score === 100 && report.critical_failures.length === 0;

    return report;
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
        'Science': 'CBSE Boards', 'Social Science': 'CBSE Boards',
        'English': 'CBSE Boards'
    };
    const examTag = post.exam_class >= 11
        ? (SUBJECT_EXAM_DESC[post.subject] || 'CBSE')
        : 'CBSE';

    const seoTitle = post.exam_class >= 11
        ? `${post.chapter_name} Class ${post.exam_class} ${post.subject} Revision — ${examTag} ${targetYear} Grandmaster Guide`
        : `${post.chapter_name} Class ${post.exam_class} ${post.subject} Recap — CBSE ${targetYear} Quick Guide`;

    const templates = [
        `Master ${post.chapter_name} for ${post.subject} ${targetYear}. This Grandmaster Guide includes Ayush's personal revision notes, formula sheets, and top-tier MCQs for final prep.`,
        `Deep dive into ${post.chapter_name} Class ${post.exam_class}. Quick revision notes featuring trap questions, peer-mentor tips from Ayush, and NCERT-aligned practice sets.`,
        `The ultimate ${post.chapter_name} revision resource for ${post.subject} students. Focused on ${targetYear} exam patterns with pyq analysis and quick recall tables.`,
        `Accelerate your ${post.subject} revision with our ${post.chapter_name} guide. Includes my secret study hacks, conceptual maps, and high-yield MCQs for last-minute success.`,
        `Learn ${post.chapter_name} like a pro. Detailed revision notes, solved examples, and "Trap Questions" that most students miss. Updated for the ${targetYear} syllabus.`
    ];
    const hash = post.chapter_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seoDesc = templates[hash % templates.length];
    post.title = seoTitle;

    function normalizeLaTeX(text: any): string {
        if (text === null || text === undefined) return '';
        
        // If it's an array, join its parts (sometimes LLMs return lists for single fields)
        if (Array.isArray(text)) return text.map(normalizeLaTeX).join(' ');
        
        // If it's an object, stringify it to avoid crashes
        if (typeof text !== 'string') {
            try {
                return JSON.stringify(text);
            } catch {
                return String(text);
            }
        }

        let result = text.replace(/\\\\\\\\([a-zA-Z])/g, '\\\\$1');
        result = result.replace(/\\n/g, '\n');
        return result;
    }

    function isValidTable(table: any): boolean {
        if (!table) return false;
        if (!Array.isArray(table.headers) || table.headers.length === 0) return false;
        if (!Array.isArray(table.rows) || table.rows.length === 0) return false;
        return table.rows.some((row: any) => Array.isArray(row) && row.some((cell: string) => cell && cell.trim() !== ''));
    }

    function slugify(text: string): string {
        return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    }

    // 1. Generate TOC
    const tocItems = [
        ...(post.content?.sections || []).map(s => ({ title: s.heading, id: slugify(s.heading) })),
        { title: "📝 Practice MCQs", id: "practice-mcqs" }
    ];
    const tocMarkdown = `\n## 📋 Table of Contents\n\n${tocItems.map(item => `- [${item.title}](#${item.id})`).join('\n')}\n`;

    // 2. Quick Recall (Summary Box)
    const recallBox = post.content.quick_recall && post.content.quick_recall.length > 0 
        ? `\n<div class="quick-summary">\n\n### 🚀 Quick Recall — Last Night Summary\n\n${post.content.quick_recall.map(point => `- ${normalizeLaTeX(point)}`).join('\n')}\n\n</div>\n`
        : '';

    const sectionsHtml = (post.content?.sections || []).map(sec => {
        const heading = sec.heading || '';
        const id = slugify(heading);
        let body = normalizeLaTeX(sec.body || '');
        body = body.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
        let tableStr = '';
        if (isValidTable(sec.table)) {
            const headers = (sec.table!.headers || []).map((h: string) => normalizeLaTeX(h));
            const rows = (sec.table!.rows || []).map((row: any) => row.map((cell: string) => normalizeLaTeX(cell || '')));
            tableStr = `\n| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map((row: string[]) => `| ${row.join(' | ')} |`).join('\n')}\n`;
        }
        return `\n## <a id="${id}"></a>${heading}\n\n${body}\n${tableStr}\n`;
    }).join('\n');

    const mcqsHtml = (post.content?.mcqs || []).map((mcq, i) => {
        const optionsArr = Array.isArray(mcq.options) ? mcq.options : [];
        const formattedOptions = optionsArr.map((opt: string, idx: number) => {
            const letter = String.fromCharCode(65 + idx);
            return `- ${letter}) ${normalizeLaTeX(opt.replace(/^[A-D]\)\s*/, ''))}`;
        }).join('\n');
        return `\n**${i + 1}. ${normalizeLaTeX(mcq.question)}**\n\n${formattedOptions}\n\n**Answer:** ${mcq.answer}) ${normalizeLaTeX(mcq.answer_text)}\n`;
    }).join('\n---\n');

    const ctaHtml = `\n---\n\n### 🚀 Ready to Ace Your Exam?\nPut your knowledge to the test! Take the free [**${post.chapter_name} Full Mock Test**](${post.practice_link_path}) now and track your progress against thousands of students.\n`;

    const kwParts = [
        `${post.chapter_name} class ${post.exam_class} notes`,
        `${post.chapter_name} quick revision`,
        `${post.chapter_name} ${targetYear}`,
        `class ${post.exam_class} ${post.subject} revision`
    ];

    return `---
heroImage: "${post.hero_image}"
title: "${post.title}"
description: "${seoDesc}"
category: "${post.subject}"
keywords: "${kwParts.join(', ')}"
date: "${post.last_updated}"
practice_link: "${post.practice_link_path}"
---

![${post.chapter_name} revision guide](${post.hero_image})

*Last Updated: ${post.last_updated}*

${recallBox}

${tocMarkdown}

${sectionsHtml}

## <a id="practice-mcqs"></a>📝 Practice MCQs

${mcqsHtml}
`;
}

/**
 * Robustly ensures a markdown string follows the Grandmaster structure:
 * 1. Image
 * 2. Last Updated
 * 3. Quick Summary Box (Recall)
 * 4. Table of Contents
 * 5. Content with Anchors
 * 6. CTA / Footer
 */
export function standardizeMarkdown(markdown: string, meta: { title: string, heroImage: string, lastUpdated: string, practiceLink: string }): string {
    // 1. Separate Frontmatter if present
    let body = markdown;
    let frontmatter = '';
    const fmMatch = markdown.match(/^---[\s\S]*?---\n*/);
    if (fmMatch) {
        frontmatter = fmMatch[0];
        body = markdown.replace(frontmatter, '');
    }

    // 2. NUCLEAR CLEAN: Strip ALL existing structural elements that might cause duplication
    body = body.replace(/<div class="quick-summary">[\s\S]*?<\/div>/gi, '');
    body = body.replace(/## 📋 Table of Contents\n*/gi, '');
    body = body.replace(/!\[.*?\]\(.*?\)/g, '');
    body = body.replace(/\*Last Updated:.*?\*/gi, '');
    body = body.replace(/<a id=".*?"><\/a>/gi, '');
    body = body.replace(/---[\s\S]*?curated by Jules[\s\S]*?\*/gi, '');

    // CLEAN DUPLICATE LINKS: Specifically strip any bulleted links at the start of the body
    body = body.replace(/^[*-] \[[^\]]+\]\(#[^\)]+\)\s*$/gm, '');
    
    body = body.trim();

    // 3. Normalizing LaTeX
    body = body.replace(/\\\\([a-zA-Z])/g, '\\$1');

    // 4. Build TOC and Inject Anchors (Supports H2 and H3 for depth)
    const tocItems: Array<{ title: string, id: string, level: number }> = [];
    function slugify(text: string): string {
        return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
    }

    // Replace all H2s and H3s that aren't already anchored
    body = body.replace(/^(##|###) (.*)$/gm, (match, level, title) => {
        const cleanTitle = title.trim();
        if (cleanTitle.toLowerCase().includes('table of contents')) return ""; 
        const id = slugify(cleanTitle);
        tocItems.push({ title: cleanTitle, id, level: level.length });
        return `${level} <a id="${id}"></a>${cleanTitle}`;
    });

    // 5. Final Cleaning
    body = body.replace(/^\|.*\|\s*\n^\|[\s-]*\|\s*$(?:\n\s*$)?/gm, '');

    // 6. Assemble
    const tocMarkdown = tocItems.length > 0
        ? `\n## 📋 Table of Contents\n\n${tocItems.map(item => `${'  '.repeat(item.level - 2)}- [${item.title}](#${item.id})`).join('\n')}\n`
        : '';

    const footer = `\n---\n\n### 🚀 Ready to Ace Your Exam?\nPut your knowledge to the test! Take the free [**Practice Mock Test**](${meta.practiceLink}) now and track your progress against thousands of students.\n\n---\n*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*`;

    const assembledBody = `![${meta.title}](${meta.heroImage})

*Last Updated: ${meta.lastUpdated}*

${tocMarkdown}

${body}

${footer}`;

    return frontmatter ? `${frontmatter}\n${assembledBody}` : assembledBody;
}

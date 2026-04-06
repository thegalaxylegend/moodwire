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

    // Auto-fix: Date
    if (post.last_updated !== today) {
        report.auto_fixed.push({ field: 'last_updated', old: post.last_updated, new: today });
        post.last_updated = today;
    }

    // Auto-fix: Subject correction
    let matchedSubject = "";
    for (const [key, sub] of Object.entries(CHAPTER_TO_SUBJECT)) {
        if ((post.chapter_name || "").toLowerCase().includes(key.toLowerCase()) || 
            (post.title || "").toLowerCase().includes(key.toLowerCase())) {
            matchedSubject = sub;
            break;
        }
    }
    if (matchedSubject && post.subject !== matchedSubject) {
        if (matchedSubject === "Social Science" && post.exam_class >= 11) matchedSubject = "Political Science";
        report.auto_fixed.push({ field: 'subject', old: post.subject, new: matchedSubject });
        post.subject = matchedSubject;
    }

    // Auto-fix: Practice link
    const expectedPrefix = SUBJECT_TO_PATH[post.subject || 'default'] || "/class-11/physics/";
    if (!post.practice_link_path || !post.practice_link_path.startsWith(expectedPrefix)) {
        post.practice_link_path = `${expectedPrefix}${post.slug}`;
    }

    // Word Count Check
    const totalWords = (post.content?.sections || []).reduce((acc, sec) => acc + (sec.body ? String(sec.body).split(/\s+/).length : 0), 0) +
                       (post.content?.quick_recall || []).reduce((acc, r) => acc + (r ? String(r).split(/\s+/).length : 0), 0);
    
    if (totalWords < 1000) {
        score -= 30;
        report.critical_failures.push(`Low word count: ${totalWords} (Min 1000 for Quality)`);
        report.regenerate_sections.push("all");
    }

    const bodyContent = JSON.stringify(post.content).toLowerCase();
    if (!hasAyushNoteRegex.test(bodyContent)) {
        score -= 20;
        report.critical_failures.push("Missing 'Ayush's Note'");
    }
    if (!hasMistakesRegex.test(bodyContent)) {
        score -= 20;
        report.critical_failures.push("Missing 'Mistakes' section");
    }

    report.score = Math.max(0, score);
    report.passed = report.score === 100;
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
            return JSON.stringify(text);
        }
        let result = text.replace(/\\\\+([a-zA-Z])/g, '\\$1');
        const commonMath = ['frac', 'times', 'text', 'Delta', 'theta', 'phi', 'alpha', 'beta', 'gamma', 'sum', 'int', 'neq', 'approx', 'pm', 'mp', 'le', 'ge'];
        commonMath.forEach(cmd => {
            const regex = new RegExp(`(^|[^\\\\])${cmd}(?=[^a-zA-Z])`, 'g');
            result = result.replace(regex, `$1\\${cmd}`);
        });
        return result;
    }

    function isValidTable(table: any): boolean {
        return !!(table && Array.isArray(table.headers) && table.headers.length > 0 && Array.isArray(table.rows) && table.rows.length > 0);
    }

    const sectionsHtml = (post.content?.sections || []).map(sec => {
        const heading = sec.heading || '';
        let body = normalizeLaTeX(sec.body || '');
        body = body.replace(/([^\n])\n([*-] )/g, '$1\n\n$2');
        let tableStr = '';
        if (isValidTable(sec.table)) {
            const h = sec.table!.headers.map(normalizeLaTeX);
            const r = sec.table!.rows.map(row => row.map(normalizeLaTeX));
            tableStr = `\n| ${h.join(' | ')} |\n| ${h.map(() => '---').join(' | ')} |\n${r.map(row => `| ${row.join(' | ')} |`).join('\n')}\n`;
        }
        return `\n## ${heading}\n\n${body}\n${tableStr}\n`;
    }).join('\n');

    const mcqsHtml = (post.content?.mcqs || []).map((mcq, i) => {
        const opts = (mcq.options || []).map((o, idx) => `${String.fromCharCode(65 + idx)}) ${normalizeLaTeX(o)}`).join('\n');
        return `\n**${i + 1}. ${normalizeLaTeX(mcq.question)}**\n\n${opts}\n\n**Answer:** ${mcq.answer}) ${normalizeLaTeX(mcq.answer_text)}\n`;
    }).join('\n---\n');

    return `
${sectionsHtml}

## 📝 Practice MCQs

${mcqsHtml}
`;
}

export function standardizeMarkdown(markdown: string, meta: { title: string, heroImage: string, lastUpdated: string, practiceLink: string, recall?: string[] }): string {
    let body = markdown;
    let frontmatter = '';
    const fmMatch = markdown.match(/^---[\s\S]*?---\n*/);
    if (fmMatch) {
        frontmatter = fmMatch[0];
        body = markdown.replace(frontmatter, '').trim();
    }

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
        if (rawTitle.toLowerCase().includes('table of contents') || rawTitle.toLowerCase().includes('quick recall')) return ""; 
        const id = slugify(rawTitle);
        const displayTitle = rawTitle.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
        tocItems.push({ title: displayTitle, id, level: level.length });
        return `${level} <a id="${id}"></a>${rawTitle}`;
    });

    const recallMarkdown = (meta.recall && meta.recall.length > 0)
        ? `\n<div class="quick-summary">\n\n### 🚀 Quick Recall — Last Night Summary\n\n${meta.recall.map(point => `- ${point}`).join('\n')}\n\n</div>\n`
        : '';

    const tocMarkdown = tocItems.length > 0
        ? `\n## 📋 Table of Contents\n\n${tocItems.map(item => `${'  '.repeat(item.level - 2)}- [${item.title}](#${item.id})`).join('\n')}\n`
        : '';

    const footer = `\n---\n\n### 🚀 Ready to Ace Your Exam?\nPut your knowledge to the test! Take the free [**Practice Mock Test**](${meta.practiceLink}) now and track your progress against thousands of students.\n\n---\n*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*`;

    const assembledBody = `---
heroImage: "${meta.heroImage}"
title: "${meta.title}"
description: "${meta.title} Revision Notes for Class 12 ${meta.lastUpdated}."
category: "Revision"
date: "${meta.lastUpdated}"
practice_link: "${meta.practiceLink}"
---

![${meta.title}](${meta.heroImage})

*Last Updated: ${meta.lastUpdated}*

${recallMarkdown}

${tocMarkdown}

${body}

${footer}`;

    return assembledBody;
}

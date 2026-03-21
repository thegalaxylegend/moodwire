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
    "Physics": "/class-11/physics/",
    "Chemistry": "/class-11/chemistry/",
    "Biology": "/class-11/biology/",
    "Mathematics": "/class-11/mathematics/"
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
    "Physical Geography": "Geography",
    "Climate": "Geography",
    "Drainage": "Geography",
    "Geomorphology": "Geography"
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

    // --- AUTO-FIXES ---
    // Area 6c: Auto-correct date
    if (post.last_updated !== today) {
        report.auto_fixed.push({ field: 'last_updated', old: post.last_updated, new: today });
        post.last_updated = today;
    }

    // Area 5: Subject correction (strictly Social Science for Polity)
    let matchedSubject = "";
    for (const [key, sub] of Object.entries(CHAPTER_TO_SUBJECT)) {
        if (post.chapter_name.includes(key) || post.title.includes(key)) {
            matchedSubject = sub;
            break;
        }
    }
    if (matchedSubject && post.subject !== matchedSubject) {
        report.auto_fixed.push({ field: 'subject', old: post.subject, new: matchedSubject });
        post.subject = matchedSubject;
    }

    // Practice link path correction
    const expectedPrefix = SUBJECT_TO_PATH[post.subject] || "/class-11/physics/";
    if (!post.practice_link_path.startsWith(expectedPrefix)) {
        const newPath = `${expectedPrefix}${post.slug}`;
        report.auto_fixed.push({ field: 'practice_link_path', old: post.practice_link_path, new: newPath });
        post.practice_link_path = newPath;
    }

    // --- CRITICAL FAILURES ---
    
    // MCQ Completeness
    post.content.mcqs.forEach((mcq, i) => {
        if (!mcq.answer || !mcq.answer_text) {
            report.critical_failures.push(`MCQ #${i+1} is missing answer or explanation.`);
            report.regenerate_sections.push("mcqs");
        }
    });

    if (post.content.mcqs.length < 2) {
        report.critical_failures.push("Post has fewer than 2 MCQs.");
        report.regenerate_sections.push("mcqs");
    }

    // Table Leak Detection
    post.content.sections.forEach(sec => {
        if (sec.table) {
            const tableStr = JSON.stringify(sec.table).toLowerCase();
            const leaks = ["ayush's tips", "my personal note", "as i recall", "i always"];
            if (leaks.some(l => tableStr.includes(l))) {
                report.critical_failures.push(`Personal note leakage detected in table: ${sec.heading}`);
                report.regenerate_sections.push(`section: ${sec.heading}`);
            }
        }
    });

    // Area 2: Question-Format H2 Headers
    post.content.sections.forEach(sec => {
        if (!sec.heading.trim().endsWith("?")) {
            report.warnings.push(`H2 heading is not a question: "${sec.heading}"`);
            if (!report.regenerate_sections.includes("sections")) {
                report.regenerate_sections.push("sections");
            }
        }
    });

    // Area 5 & 6: Factual Accuracy (Geography)
    const fullText = JSON.stringify(post).toLowerCase();
    if (post.subject === "Geography") {
        if (fullText.includes("mount everest") && (fullText.includes("india") || fullText.includes("highest peak"))) {
            report.critical_failures.push("Geography Error: Mount Everest incorrectly linked to India's highest peak.");
            report.regenerate_sections.push("all");
        }
        if (fullText.includes("indus") && (fullText.includes("longest river") || fullText.includes("india's longest"))) {
            report.critical_failures.push("Geography Error: Indus incorrectly linked to India's longest river.");
            report.regenerate_sections.push("all");
        }
    }

    // --- WARNINGS ---
    if (post.content.mcqs.length < 3) {
        report.warnings.push("Fewer than 3 MCQs (below recommendation).");
    }

    const wordCount = fullText.split(' ').length;
    if (wordCount < 500) {
        report.warnings.push(`Low word count: ${wordCount} words.`);
    }

    const genericImages = ["generic-study.webp", "geography-terrain.webp"];
    if (genericImages.some(img => post.hero_image.includes(img))) {
        report.warnings.push(`Using generic fallback image: ${post.hero_image}`);
    }

    const fillerPhrases = ["as i navigate through", "i find it fascinating to explore the nuances", "as i delve deeper into", "i hope this journey helps you"];
    if (fillerPhrases.some(f => fullText.includes(f))) {
        report.warnings.push("AI filler phrases detected.");
    }

    // --- SCORING & FINAL PASS ---
    score -= (report.critical_failures.length * 20);
    score -= (report.warnings.length * 5);
    report.score = Math.max(0, score);
    report.passed = report.score >= 60 && report.critical_failures.length === 0;

    return report;
}

export function jsonToMarkdown(post: BlogPostJSON): string {
    const yaml = `---
title: "${post.title}"
description: "${post.content.intro.substring(0, 155)}"
category: "${post.subject}"
keywords: "${post.chapter_name} quick recap, ${post.chapter_name} notes, class ${post.exam_class} ${post.subject} MCQs"
date: "${post.last_updated}"
practice_link: "${post.practice_link_path}"
---

![${post.chapter_name} recap](${post.hero_image})

*Last Updated: ${post.last_updated}*

## What is ${post.chapter_name}?

${post.content.intro}

${post.content.sections.map(sec => `
## ${sec.heading}

${sec.body}

${sec.table ? `
| ${sec.table.headers.join(' | ')} |
| ${sec.table.headers.map(() => '---').join(' | ')} |
${sec.table.rows.map(row => `| ${row.join(' | ')} |`).join('\n')}` : ''}
`).join('\n')}

## Quick Recall Box

${post.content.quick_recall.map(point => `- ${point}`).join('\n')}

## MCQs

${post.content.mcqs.map((mcq, i) => `
**${i + 1}. ${mcq.question}**
${mcq.options.join('\n')}

**Answer:** ${mcq.answer}) ${mcq.answer_text}
`).join('\n')}
`;
    return yaml;
}

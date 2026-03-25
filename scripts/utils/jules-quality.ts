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
    const expectedPrefix = SUBJECT_TO_PATH[post.subject || 'default'] || "/class-11/physics/";
    if (post.practice_link_path && !post.practice_link_path.startsWith(expectedPrefix)) {
        const newPath = `${expectedPrefix}${post.slug}`;
        report.auto_fixed.push({ field: 'practice_link_path', old: post.practice_link_path, new: newPath });
        post.practice_link_path = newPath;
    } else if (!post.practice_link_path) {
        post.practice_link_path = `${expectedPrefix}${post.slug}`;
    }

    // 2. Word Count (Rules V3.1: 2000-3500, but we'll gate at 1200 for now)
    const wordCount = (post.content?.intro?.split(' ').length || 0) + (post.content?.sections || []).reduce((acc, s) => acc + (s.body?.split(' ').length || 0), 0);
    if (wordCount < 1200) {
        report.score -= 20;
        report.critical_failures.push(`Low word count: ${wordCount} (Min 1200 expected)`);
        report.regenerate_sections.push("all");
    } else if (wordCount < 2000) {
        report.warnings.push(`Word count (${wordCount}) is below the 2000-3500 target range.`);
    }

    // 3. Mandatory Sections check
    const bodyContent = JSON.stringify(post.content).toLowerCase();
    const hasAyushNote = bodyContent.includes("ayush's note") || bodyContent.includes("ayush note") || bodyContent.includes("mistake i made");
    const hasTrapQuestions = bodyContent.includes("trap questions") || bodyContent.includes("common mistakes") || bodyContent.includes("exceptions");
    const hasRecall = (post.content?.quick_recall || []).length >= 3;
    const mcqCount = (post.content?.mcqs || []).length;

    if (!hasAyushNote) {
        report.score -= 15;
        report.critical_failures.push("Missing 'Ayush's Note' (Experience Hook)");
        report.regenerate_sections.push("sections");
    }
    if (!hasTrapQuestions) {
        report.score -= 15;
        report.critical_failures.push("Missing 'Trap Questions / Exceptions' section");
        report.regenerate_sections.push("sections");
    }
    if (mcqCount < 5) {
        report.score -= 10;
        report.critical_failures.push(`Insufficient MCQs: ${mcqCount} (Min 5 required)`);
        report.regenerate_sections.push("mcqs");
    }

    // 4. Kill List Scan (Forbidden Phrases)
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
        if (bodyContent.includes(phrase)) {
            report.score -= 5;
            report.critical_failures.push(`Forbidden phrase found: "${phrase}"`);
            report.regenerate_sections.push("phrases");
        }
    }

    // 5. Section Depth
    if ((post.content?.sections || []).length < 4) {
        report.score -= 15;
        report.critical_failures.push("Insufficient section count (Min 4 H2 topics)");
        report.regenerate_sections.push("sections");
    }

    // 6. LaTeX Check
    if (bodyContent.includes('\\frac') || bodyContent.includes('\\sqrt')) {
        if (!bodyContent.includes('$')) {
            report.score -= 10;
            report.critical_failures.push("Potential LaTeX formatting error (Missing delimiters)");
            report.regenerate_sections.push("sections");
        }
    }

    // --- CRITICAL FAILURES ---
    
    // MCQ Completeness
    post.content.mcqs.forEach((mcq, i) => {
        if (!mcq.answer) {
            report.critical_failures.push(`MCQ #${i+1} is missing a core answer (A/B/C/D).`);
            report.regenerate_sections.push("mcqs");
        }
        if (!mcq.answer_text) {
            report.critical_failures.push(`MCQ #${i+1} is missing an explanation (answer_text).`);
            report.regenerate_sections.push("mcqs");
        }
    });

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

    if (wordCount < 1500) {
        report.score -= 20;
        report.critical_failures.push(`Extremely low word count: ${wordCount} words. Minimum 1500+ required for Grandmaster status.`);
        report.regenerate_sections.push("all");
    } else if (wordCount < 2000) {
        report.warnings.push(`Word count (${wordCount}) is below the 2000-3500 target range.`);
    }

    const genericImages = ["generic-study.webp", "geography-terrain.webp"];
    if (genericImages.some(img => post.hero_image.includes(img))) {
        report.warnings.push(`Using generic fallback image: ${post.hero_image}`);
    }

    const fillerPhrases = ["as i navigate through", "i find it fascinating to explore the nuances", "as i delve deeper into", "i hope this journey helps you"];
    if (fillerPhrases.some(f => fullText.includes(f))) {
        report.warnings.push("AI filler phrases detected.");
    }

    // --- SEO QUALITY CHECKS ---

    // Dynamic target year
    const nowDate = new Date();
    const curYear = Number(nowDate.getFullYear());
    const curMonth = nowDate.getMonth();
    const targetYear = String(curMonth >= 7 ? curYear + 1 : curYear);

    // Title must contain year
    if (!post.title.includes(targetYear)) {
        report.warnings.push(`SEO: Title missing target year (${targetYear}).`);
        // Auto-fix: append year
        const oldTitle = post.title;
        post.title = post.title.replace(/\d{4}/g, targetYear);
        if (!post.title.includes(targetYear)) {
            post.title = `${post.title} ${targetYear}`;
        }
        report.auto_fixed.push({ field: 'title_year', old: oldTitle, new: post.title });
    }

    // Title length check (50-70 chars ideal)
    if (post.title.length > 70) {
        report.warnings.push(`SEO: Title too long (${post.title.length} chars). Target: 50-70.`);
    } else if (post.title.length < 30) {
        report.warnings.push(`SEO: Title too short (${post.title.length} chars). Target: 50-70.`);
    }

    // Kill list phrases in title
    const titleKillList = ["ultimate guide", "comprehensive", "everything you need", "complete guide", "master today"];
    const lowerTitle = post.title.toLowerCase();
    for (const phrase of titleKillList) {
        if (lowerTitle.includes(phrase)) {
            report.warnings.push(`SEO: Title contains kill-list phrase: "${phrase}".`);
        }
    }

    // Exam name check for Class 11-12 PCMB
    const PCMB_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    if (post.exam_class >= 11 && PCMB_SUBJECTS.includes(post.subject)) {
        const hasExam = lowerTitle.includes('jee') || lowerTitle.includes('neet') || lowerTitle.includes('gate');
        if (!hasExam) {
            report.warnings.push("SEO: Class 11-12 PCMB title missing exam name (JEE/NEET).");
        }
    }

    // --- SCORING & FINAL PASS ---
    score -= (report.critical_failures.length * 25);
    score -= (report.warnings.length * 5);
    report.score = Math.max(0, score);
    report.passed = report.score >= 70 && report.critical_failures.length === 0;

    return report;
}

export function jsonToMarkdown(post: BlogPostJSON): string {
    // Dynamic target year
    const now = new Date();
    const currentYear = Number(now.getFullYear());
    const currentMonth = now.getMonth();
    const targetYear = currentMonth >= 7 ? currentYear + 1 : currentYear;

    // SEO-optimized description (not truncated intro)
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
    // Stable hash based on topic
    const hash = post.chapter_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seoDesc = templates[hash % templates.length];

    // CRITICAL: Update the object so YAML uses the new title
    post.title = seoTitle;

    // SEO keywords
    const SUBJECT_KW_EXAMS: Record<string, string[]> = {
        'Physics': ['JEE', 'NEET'], 'Chemistry': ['JEE', 'NEET'],
        'Mathematics': ['JEE'], 'Biology': ['NEET'],
        'Computer Science': ['GATE'],
        'Science': ['CBSE'], 'Social Science': ['CBSE'], 'English': ['CBSE']
    };
    const exams = SUBJECT_KW_EXAMS[post.subject] || ['CBSE'];
    const kwParts = [
        `${post.chapter_name} class ${post.exam_class} notes`,
        `${post.chapter_name} quick revision`,
        `${post.chapter_name} ${targetYear}`,
        ...exams.map(e => `${post.chapter_name} ${e} ${targetYear}`),
        ...exams.map(e => `${post.chapter_name} notes for ${e}`),
        `class ${post.exam_class} ${post.subject} revision`,
        `${post.chapter_name} formula sheet`,
        `${post.chapter_name} MCQs`
    ];

    const sectionsHtml = (post.content?.sections || []).map(sec => `
## ${sec.heading}

${sec.body}

${(sec.table && Array.isArray(sec.table.headers) && Array.isArray(sec.table.rows)) ? `
| ${sec.table.headers.join(' | ')} |
| ${sec.table.headers.map(() => '---').join(' | ')} |
${sec.table.rows.map(row => Array.isArray(row) ? `| ${row.join(' | ')} |` : '').join('\n')}` : ''}
`).join('\n');

    const recallHtml = (post.content?.quick_recall || []).map(point => `- ${point}`).join('\n');
    const mcqsHtml = (post.content?.mcqs || []).map((mcq, i) => {
        const optionsArr = Array.isArray(mcq.options) 
            ? mcq.options 
            : (typeof mcq.options === 'string' ? (mcq.options as string).split('\n') : []);

        return `
**${i + 1}. ${mcq.question}**
${optionsArr.join('\n')}

**Answer:** ${mcq.answer}) ${mcq.answer_text}
`;
    }).join('\n');

    const yaml = `---
heroImage: "${post.hero_image}"
title: "${post.title}"
description: "${seoDesc}"
category: "${post.subject}"
keywords: "${kwParts.join(', ')}"
date: "${post.last_updated}"
practice_link: "${post.practice_link_path}"
---

![${post.chapter_name} recap](${post.hero_image})

*Last Updated: ${post.last_updated}*

## What is ${post.chapter_name}?

${post.content.intro}

${sectionsHtml}

## Quick Recall Box

${recallHtml}

## MCQs

${mcqsHtml}
`;
    return yaml;
}

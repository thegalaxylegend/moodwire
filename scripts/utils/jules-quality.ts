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
    "Algorithms": "Computer Science"
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
        if (post.chapter_name.includes(key) || post.title.includes(key)) {
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
            if (regex.test(sec.body)) {
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
    
    const wordCount = (post.content?.intro?.split(/\s+/).length || 0) +
        (post.content?.sections || []).reduce((acc, s) => acc + (s.body?.split(/\s+/).length || 0), 0);
        
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

    // Helper: normalize LaTeX in a string for markdown output
    // After JSON.parse, LaTeX like \\frac becomes \frac (correct for markdown)
    // But if double-escaped by both LLM AND our parser, we get \\frac in the string
    // which renders as literal \frac text. Normalize to single backslash.
    function normalizeLaTeX(text: string): string {
        if (!text) return '';
        // Replace \\\\command with \\command (over-escaped LaTeX)
        let result = text.replace(/\\\\\\\\([a-zA-Z])/g, '\\\\$1');
        // Ensure line breaks are actual newlines for markdown
        result = result.replace(/\\n/g, '\n');
        return result;
    }

    // Helper: check if a table is valid (not empty rows/headers)
    function isValidTable(table: any): boolean {
        if (!table) return false;
        if (!Array.isArray(table.headers) || table.headers.length === 0) return false;
        if (table.headers.every((h: string) => !h || h.trim() === '')) return false;
        if (!Array.isArray(table.rows) || table.rows.length === 0) return false;
        // Check if all rows are empty
        const hasContent = table.rows.some((row: any) => 
            Array.isArray(row) && row.some((cell: string) => cell && cell.trim() !== '')
        );
        return hasContent;
    }

    const sectionsHtml = (post.content?.sections || []).map(sec => {
        const heading = sec.heading || '';
        let body = normalizeLaTeX(sec.body || '');
        
        // Ensure body has proper paragraph breaks (double newline)
        // Replace single \n with double \n for markdown paragraph breaks
        body = body.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
        
        // Format table if valid
        let tableStr = '';
        if (isValidTable(sec.table)) {
            const headers = (sec.table!.headers || []).map((h: string) => normalizeLaTeX(h));
            const rows = (sec.table!.rows || [])
                .filter((row: any) => Array.isArray(row) && row.some((c: string) => c && c.trim()))
                .map((row: any) => row.map((cell: string) => normalizeLaTeX(cell || '')));
            
            if (rows.length > 0) {
                tableStr = `\n| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map((row: string[]) => `| ${row.join(' | ')} |`).join('\n')}\n`;
            }
        }

        return `\n## ${heading}\n\n${body}\n${tableStr}\n`;
    }).join('\n');

    const recallHtml = (post.content?.quick_recall || []).map(point => `- ${normalizeLaTeX(point)}`).join('\n');
    const mcqsHtml = (post.content?.mcqs || []).map((mcq, i) => {
        const optionsArr = Array.isArray(mcq.options) 
            ? mcq.options 
            : (typeof mcq.options === 'string' ? (mcq.options as string).split('\n') : []);

        const formattedOptions = optionsArr
            .map((opt: string, idx: number) => {
                const letter = String.fromCharCode(65 + idx); // A, B, C, D
                // If option already starts with A), B) etc. don't add again
                const cleanOpt = opt.replace(/^[A-D]\)\s*/, '').trim();
                return `- ${letter}) ${normalizeLaTeX(cleanOpt)}`;
            })
            .join('\n');

        return `\n**${i + 1}. ${normalizeLaTeX(mcq.question)}**\n\n${formattedOptions}\n\n**Answer:** ${mcq.answer}) ${normalizeLaTeX(mcq.answer_text)}\n`;
    }).join('\n---\n');

    const ctaHtml = `\n---\n\n### 🚀 Ready to Ace Your Exam?\nPut your knowledge to the test! Take the free [**${post.chapter_name} Full Mock Test**](${post.practice_link_path}) now and track your progress against thousands of students.\n`;

    const yaml = `---
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

## 🎯 What WILL Come in Your Exam

${normalizeLaTeX(post.content.intro)}

${sectionsHtml}

## 📝 Practice MCQs

${mcqsHtml}

${ctaHtml}
`;
    return yaml;
}

import { EXAM_SUBJECT_MAPPING, SYLLABUS_DB } from './constants';
import { godSafeParse } from './god-json';

/**
 * Robustly extract JSON from AI string, using the 8-layer GOD-JSON parser.
 */
export function extractJSON(input: any): any {
    if (input === null || input === undefined) throw new Error("Empty AI response");

    // 0. Handle already parsed objects or arrays
    if (typeof input === 'object') {
        return input;
    }

    if (typeof input !== 'string') {
        try {
            return JSON.parse(JSON.stringify(input));
        } catch (e) {
            throw new Error("Invalid input type for JSON extraction");
        }
    }

    // 1. Detect system/rate-limit messages first
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("service busy") || lowerInput.includes("rate limit") || lowerInput.includes("too many requests")) {
        const error = new Error("AI_SERVICE_BUSY");
        (error as any).isBusy = true;
        throw error;
    }

    // Remove <think> blocks from reasoning models before parsing
    let sanitized = input.replace(/<think>[\s\S]*?<\/think>/g, '');
    // Handle unclosed <think> blocks if truncated
    if (sanitized.includes('<think>')) {
        sanitized = sanitized.replace(/<think>[\s\S]*$/, '');
    }
    sanitized = sanitized.trim();

    // 2. Parse using godSafeParse
    const parsed = godSafeParse(sanitized);
    if (parsed === null) {
        console.error("Critical JSON Parsing Failure. Content:", sanitized.substring(0, 200));
        throw new Error("No valid JSON found in AI response");
    }

    // If it's a refusal, throw an error
    if (parsed && typeof parsed === 'object' && parsed.refusal) {
        console.error("AI refusal detected:", parsed.original);
        throw new Error("AI refused to generate valid response: " + parsed.original);
    }

    return parsed;
}


export const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
        .replace(/\-\-+/g, '-');     // Replace multiple - with single -
};

export const getSubjectsForExam = (examId: string): string[] => {
    const normalizedExam = examId.toLowerCase().trim();

    // 1. Direct Mapping
    if (EXAM_SUBJECT_MAPPING[normalizedExam]) {
        return EXAM_SUBJECT_MAPPING[normalizedExam];
    }

    // 2. Smart Class Detection (fallback)
    // If examId contains "class-X", filter from DB
    const classMatch = normalizedExam.match(/class-(\d+)/);
    if (classMatch) {
        const classStr = `Class ${classMatch[1]}`;
        const subjects: string[] = [];

        Object.entries(SYLLABUS_DB).forEach(([subject, topics]) => {
            const hasClassContent = topics.some(t => t.class === classStr);
            if (hasClassContent) {
                subjects.push(subject);
            }
        });

        if (subjects.length > 0) return subjects;
    }

    // 3. Default (No match)
    return [];
};

export const resolveTopicId = (topicName: string): string => {
    // 1. Try to find in SYLLABUS_DB
    for (const subject in SYLLABUS_DB) {
        const match = SYLLABUS_DB[subject].find(t => t.topic.toLowerCase() === topicName.toLowerCase());
        if (match) return match.id;
    }

    // 2. Fallback to slugified version
    return slugify(topicName).replace(/-/g, '_');
};

/**
 * Clean formatting tokens (markdown, LaTeX, math formulas, special symbols) 
 * from text before vocalizing it, preventing pronunciation of tokens like ### and $.
 */
export function cleanTextForSpeech(text: string): string {
    if (!text) return "";
    
    // Remove <think>...</think> tags if any exist (reasoning models output)
    let clean = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // Remove emojis and other special Unicode characters
    clean = clean.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    
    // Remove LaTeX display math ($$ ... $$) and inline math ($ ... $)
    clean = clean.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$]*?\$/g, '');
    
    // Remove LaTeX command names and braces: e.g. \frac{1}{2} -> 1 2, or \theta -> empty
    clean = clean.replace(/\\(text|frac|sqrt|left|right|times|cdot|geq|leq|neq|approx|infty|sum|int|prod|lim|rightarrow|leftarrow|Rightarrow|AA)\b\{?([^}]*)\}?/g, '$2');
    clean = clean.replace(/\\[a-zA-Z]+/g, ' '); // remove remaining command backslashes
    
    // Remove Markdown styling:
    // Bold / Italic: ***text*** or **text** or *text* -> text
    clean = clean.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1');
    clean = clean.replace(/_{1,3}(.*?)_{1,3}/g, '$1');
    // Inline code or code blocks: `code` or ```code``` -> remove entirely
    clean = clean.replace(/`{1,3}[^`]*`{1,3}/g, '');
    // Headers: ### Header -> Header
    clean = clean.replace(/^#{1,6}\s+/gm, '');
    // Links: [Text](URL) -> Text
    clean = clean.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    // Bullet points and list numbering:
    clean = clean.replace(/^[-*+]\s+/gm, '');
    clean = clean.replace(/^\d+\.\s+/gm, '');
    clean = clean.replace(/^>\s+/gm, '');
    
    // Nuke remaining special characters that shouldn't be read out loud
    clean = clean.replace(/[#$*_\`|~]/g, '');
    
    // Replace multiple spaces/newlines with single space
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
}

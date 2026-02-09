import { EXAM_SUBJECT_MAPPING, SYLLABUS_DB } from './constants';

/**
 * Robustly extract JSON from AI string, handling common formatting issues.
 */
export function extractJSON(input: string): any {
    if (!input) throw new Error("Empty AI response");

    // NEW: Detect system/rate-limit messages before trying to parse
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("service busy") || lowerInput.includes("rate limit") || lowerInput.includes("too many requests")) {
        const error = new Error("AI_SERVICE_BUSY");
        (error as any).isBusy = true;
        throw error;
    }

    try {
        // 1. Try direct parse
        return JSON.parse(input);
    } catch (e) {
        // 2. Look for code blocks
        const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
        const blocks: string[] = [];
        let match;

        while ((match = codeBlockRegex.exec(input)) !== null) {
            blocks.push(match[1]);
        }

        if (blocks.length > 0) {
            try {
                // If there are multiple blocks, they might be partial arrays.
                // We'll try to parse and merge them if they are arrays.
                const results = blocks.map(b => {
                    try {
                        return JSON.parse(sanitizeJSONString(b));
                    } catch {
                        return null;
                    }
                }).filter(r => r !== null);

                if (results.length === 1) return results[0];
                if (results.length > 1 && Array.isArray(results[0])) {
                    return results.flat();
                }
            } catch (err) {
                console.warn("Failed to parse from code blocks, falling back to regex extraction");
            }
        }

        // 3. Fallback: Regex for objects/arrays
        const jsonMatch = input.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch) {
            try {
                return JSON.parse(sanitizeJSONString(jsonMatch[0]));
            } catch (err) {
                // If regex match fails to parse, try repairing it
                try {
                    return JSON.parse(repairTruncatedJSON(jsonMatch[0]));
                } catch (repairErr) {
                    console.error("JSON Extraction Failed. Input preview:", input.substring(0, 100));
                    throw new Error("Invalid JSON format from AI");
                }
            }
        }

        // 4. Ultimate Fallback: Try repairing the whole input if it looks like JSON
        try {
            return JSON.parse(repairTruncatedJSON(input));
        } catch (finalErr) {
            throw new Error("No JSON found in AI response");
        }
    }
}

/**
 * Attempts to repair a truncated JSON string by closing open brackets/braces
 * and removing trailing partial key/values.
 */
function repairTruncatedJSON(str: string): string {
    let json = str.trim();

    // Find where the last valid-ish element ends
    // We look for the last complete object or trailing commas
    const lastBrace = json.lastIndexOf('}');

    // If it's an array, we try to close it at the last complete object
    if (json.startsWith('[') && lastBrace > 0) {
        json = json.substring(0, lastBrace + 1) + ']';
        return sanitizeJSONString(json);
    }

    // Generic stack-based closer
    const stack: string[] = [];
    let repaired = "";
    let inString = false;
    let escaped = false;

    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        if (char === '"' && !escaped) inString = !inString;
        if (!inString) {
            if (char === '{' || char === '[') stack.push(char);
            if (char === '}' || char === ']') stack.pop();
        }
        repaired += char;
        escaped = char === "\\" && !escaped;
    }

    // Close everything in reverse order
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') repaired += '}';
        if (last === '[') repaired += ']';
    }

    return sanitizeJSONString(repaired);
}

function sanitizeJSONString(str: string): string {
    return str
        .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .trim();
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

    // 3. Default (if nothing matches, return universal subjects)
    return ['Physics', 'Chemistry', 'Mathematics'];
};

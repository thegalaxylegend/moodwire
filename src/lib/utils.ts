import { EXAM_SUBJECT_MAPPING, SYLLABUS_DB } from './constants';

/**
 * Robustly extract JSON from AI string, handling common formatting issues.
 */
/**
 * Robustly extract JSON from AI string, handling common formatting issues.
 */
export function extractJSON(input: string): any {
    if (!input) throw new Error("Empty AI response");

    // 1. Detect system/rate-limit messages first
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("service busy") || lowerInput.includes("rate limit") || lowerInput.includes("too many requests")) {
        const error = new Error("AI_SERVICE_BUSY");
        (error as any).isBusy = true;
        throw error;
    }

    const sanitized = input.trim();

    // 2. Try direct parse (fastest)
    try {
        return JSON.parse(sanitized);
    } catch (e) {
        // Continue to extraction
    }

    // 3. Try to find JSON inside markdown code blocks
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    let match;
    while ((match = codeBlockRegex.exec(sanitized)) !== null) {
        const block = match[1].trim();
        try {
            return JSON.parse(sanitizeJSONString(block));
        } catch (e) {
            // Keep trying other blocks
        }
    }

    // 4. Boundary extraction: Look for the first { and last } (for objects)
    const firstBrace = sanitized.indexOf('{');
    const lastBrace = sanitized.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const candidate = sanitized.substring(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(sanitizeJSONString(candidate));
        } catch (e) {
            // If direct parse of boundary failed, it might be truncated
            try {
                return JSON.parse(repairTruncatedJSON(candidate));
            } catch (e2) {
                // fall through
            }
        }
    }

    // 5. Boundary extraction: Look for first [ and last ] (for arrays)
    const firstBracket = sanitized.indexOf('[');
    const lastBracket = sanitized.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const candidate = sanitized.substring(firstBracket, lastBracket + 1);
        try {
            return JSON.parse(sanitizeJSONString(candidate));
        } catch (e) {
            try {
                return JSON.parse(repairTruncatedJSON(candidate));
            } catch (e2) {
                // fall through
            }
        }
    }

    // 6. Ultimate Fallback: Try repairing the whole thing if it looks like it might have JSON
    try {
        const repairedWhole = repairTruncatedJSON(sanitized);
        // Ensure we actually removed the non-JSON prefix if repair was called on the whole string
        const start = Math.max(repairedWhole.indexOf('{'), repairedWhole.indexOf('['));
        if (start !== -1) {
            return JSON.parse(repairedWhole.substring(start));
        }
    } catch (finalErr) {
        // Last ditch effort: regex for anything between braces
        const greedyMatch = sanitized.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (greedyMatch) {
            try {
                return JSON.parse(sanitizeJSONString(greedyMatch[0]));
            } catch (e) {
                // failed
            }
        }
    }

    console.error("Critical JSON Parsing Failure. Content:", sanitized.substring(0, 200));
    throw new Error("No valid JSON found in AI response");
}

/**
 * Attempts to repair a truncated JSON string by closing open brackets/braces
 * and removing trailing partial key/values.
 */
function repairTruncatedJSON(str: string): string {
    let json = str.trim();

    // Find the actual start of JSON content to avoid repairing text preambles
    const braceStart = json.indexOf('{');
    const bracketStart = json.indexOf('[');
    let start = -1;
    if (braceStart !== -1 && (bracketStart === -1 || braceStart < bracketStart)) start = braceStart;
    else if (bracketStart !== -1) start = bracketStart;

    if (start > 0) json = json.substring(start);

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
            if (char === '}' || char === ']') {
                if (stack.length > 0) stack.pop();
                else continue; // Extra closing brace, skip it
            }
        }
        repaired += char;
        escaped = char === "\\" && !escaped;
    }

    // Force close an unclosed string if it exists
    if (inString) repaired += '"';

    // Close everything in reverse order
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') repaired += '}';
        if (last === '[') repaired += ']';
    }

    // FINAL CLEANUP: Remove trailing junk that might invalidate the JSON
    // e.g. "key": "val", "oth
    let finalStr = sanitizeJSONString(repaired);

    // If it ends with something like , it's likely a partial key/value
    finalStr = finalStr.replace(/,\s*$/g, '');

    return finalStr;
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

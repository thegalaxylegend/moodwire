import { EXAM_SUBJECT_MAPPING, SYLLABUS_DB } from './constants';

/**
 * Robustly extract JSON from AI string, handling common formatting issues.
 */
/**
 * Robustly extract JSON from AI string, handling common formatting issues.
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

    // 4. Boundary extraction: Look for first { or [ (for objects/arrays)
    const firstBrace = sanitized.indexOf('{');
    const firstBracket = sanitized.indexOf('[');
    const startIdx = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;

    if (startIdx !== -1) {
        const lastBrace = sanitized.lastIndexOf('}');
        const lastBracket = sanitized.lastIndexOf(']');
        const endIdx = Math.max(lastBrace, lastBracket);

        if (endIdx > startIdx) {
            const candidate = sanitized.substring(startIdx, endIdx + 1);
            try {
                return JSON.parse(sanitizeJSONString(candidate));
            } catch (e) {
                // If it failed, it might still be slightly mangled/truncated despite having a closing brace
                try {
                    return JSON.parse(repairTruncatedJSON(candidate));
                } catch (e2) {}
            }
        } else {
            // TRUNCATED: No closing marker found, or closing marker is before start
            try {
                return JSON.parse(repairTruncatedJSON(sanitized.substring(startIdx)));
            } catch (e) {}
        }
    }

    // 5. Ultimate Fallback: Try repairing the whole thing if it looks like it might have JSON
    try {
        const repairedWhole = repairTruncatedJSON(sanitized);
        const start = Math.max(repairedWhole.indexOf('{'), repairedWhole.indexOf('['));
        if (start !== -1) {
            return JSON.parse(repairedWhole.substring(start));
        }
    } catch (finalErr) {}

    // 6. Last ditch effort: regex for anything between braces/brackets
    const greedyMatch = sanitized.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (greedyMatch) {
        try {
            return JSON.parse(sanitizeJSONString(greedyMatch[0]));
        } catch (e) {}
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

    // 1. Find the actual start of JSON content to avoid repairing text preambles
    const braceStart = json.indexOf('{');
    const bracketStart = json.indexOf('[');
    let start = -1;
    if (braceStart !== -1 && (bracketStart === -1 || braceStart < bracketStart)) start = braceStart;
    else if (bracketStart !== -1) start = bracketStart;

    if (start > 0) json = json.substring(start);

    // 2. Remove trailing markdown code block closers if present
    json = json.replace(/```\s*$/g, '').trim();

    // 3. Generic stack-based closer
    const stack: string[] = [];
    let repaired = "";
    let inString = false;
    let escaped = false;
    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        
        // Handle escaped characters within strings
        if (escaped) {
            repaired += char;
            escaped = false;
            continue;
        }

        if (char === '\\') {
            repaired += char;
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
        }

        if (!inString) {
            if (char === '{' || char === '[') stack.push(char);
            if (char === '}' || char === ']') {
                if (stack.length > 0) {
                    const top = stack[stack.length - 1];
                    if ((char === '}' && top === '{') || (char === ']' && top === '[')) {
                        stack.pop();
                    }
                }
            }
        }
        repaired += char;
    }

    // 4. Force close an unclosed string if it exists
    if (inString) repaired += '"';

    // 5. Close everything in reverse order
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') repaired += '}';
        if (last === '[') repaired += ']';
    }

    // 6. FINAL CLEANUP: Remove trailing junk that might invalidate the JSON
    // e.g. {"key": "val", "partial_k
    // This is the most complex part: we might have a valid but incomplete structure now.
    // Try to parse it, and if it fails, try to recursively strip the last field.
    let finalStr = sanitizeJSONString(repaired);
    
    // Recursive stripping of last partial property
    for (let attempts = 0; attempts < 15; attempts++) {
        try {
            JSON.parse(finalStr);
            return finalStr;
        } catch (e) {
            // Find the last closing bracket as a pivot
            const lastClosingBrace = finalStr.lastIndexOf('}');
            const lastClosingBracket = finalStr.lastIndexOf(']');
            const lastClosing = Math.max(lastClosingBrace, lastClosingBracket);
            
            if (lastClosing === -1) break;
            
            const beforeClosing = finalStr.substring(0, lastClosing);
            
            // Look for the last comma that is NOT inside a string (simplified)
            // We search backwards for a comma that isn't preceded by an odd number of quotes
            let lastCommaIdx = -1;
            let bracketLevel = 0;
            let braceLevel = 0;
            let inStr = false;
            let esc = false;

            for (let j = 0; j < beforeClosing.length; j++) {
                const c = beforeClosing[j];
                if (c === '"' && !esc) inStr = !inStr;
                if (!inStr) {
                    if (c === '{') braceLevel++;
                    if (c === '}') braceLevel--;
                    if (c === '[') bracketLevel++;
                    if (c === ']') bracketLevel--;
                    if (c === ',' && braceLevel === 1 && bracketLevel === 0) lastCommaIdx = j;
                }
                esc = c === '\\' && !esc;
            }

            if (lastCommaIdx === -1) {
                // If no top-level comma, maybe it's the very first property that's partial
                // try to find the start and just return empty object if valid
                const firstBraceIdx = finalStr.indexOf('{');
                if (firstBraceIdx !== -1) {
                    finalStr = "{}";
                    continue;
                }
                break;
            }
            
            const suffix = finalStr.substring(lastClosing);
            finalStr = beforeClosing.substring(0, lastCommaIdx).trim() + suffix;
        }
    }

    return finalStr;
}

function sanitizeJSONString(str: string): string {
    // 1. Remove trailing commas and control chars except newlines (\n), carriage returns (\r), or tabs (\t)
    const sanitized = str
        .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "") // Keep 9 (\t), 10 (\n), 13 (\r)
        .trim();

    // 2. Escape literal newlines, carriage returns, and tabs INSIDE string values 
    // (Literal \n inside a JSON string value invalidates JSON parse)
    let result = '';
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i];
        
        // Toggle string state when we hit an unescaped quote
        if (char === '"' && !escaped) {
            inString = !inString;
        }
        
        if (inString) {
            if (char === '\n') result += '\\n';
            else if (char === '\r') result += '\\r';
            else if (char === '\t') result += '\\t';
            else if (char === '\\') {
                // If the next character is not a valid JSON escape, double escape the backslash
                // Valid JSON escapes: ", \, /, b, f, n, r, t, u
                const nextChar = i + 1 < sanitized.length ? sanitized[i + 1] : '';
                if (!['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'].includes(nextChar)) {
                    result += '\\\\'; // Output double backslash
                } else {
                    result += char;
                }
            } else {
                result += char;
            }
        } else {
            result += char;
        }
        
        // Keep track if the *next* character is escaped
        escaped = (char === '\\' && !escaped);
    }
    
    return result;
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

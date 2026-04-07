
/**
 * 🏺 God-JSON: The Universal Robust JSON Parser
 * 
 * Specifically designed to handle the "dirty" outputs of LLMs.
 * Features:
 * 1. Deep extraction (finds the first { and last })
 * 2. Unescaped quote repair in values
 * 3. Math backslash doubling
 * 4. Control character stripping
 * 5. Trailing comma removal
 */

export function godSafeParse(raw: string): any {
    if (!raw || typeof raw !== 'string') return null;

    let jsonStr = raw.trim();

    // 1. Extract JSON block from markdown/garbage if present
    // First, check if it's an array-wrapped JSON
    let firstBrace = jsonStr.indexOf('{');
    let lastBrace = jsonStr.lastIndexOf('}');
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');

    if (firstBracket !== -1 && firstBracket < (firstBrace === -1 ? Infinity : firstBrace) && lastBracket > lastBrace) {
        // It's likely array-wrapped, take the first object inside the array
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
    } else if (firstBrace !== -1 && lastBrace !== -1) {
        // Standard object extraction
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    } else {
        // No braces found? Attempt to treat the whole string as a refusal check
        if (isRefusal(raw) || raw.includes("<html")) {
            return { refusal: true, original: raw };
        }
        throw new Error("No JSON braces found in input");
    }



    // 2. Remove comments (common in some LLM outputs)
    jsonStr = jsonStr.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

    // 3. Fix unescaped control characters
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");

    // 4. Handle LaTeX backslashes 
    // We want to turn \frac into \\frac but leave \" as \"
    jsonStr = jsonStr.replace(/\\([a-df-z])/gi, (match, p1) => {
        // If it's a valid JSON escape (\n, \t, etc), keep it as is
        // We exclude 'b', 'f', 'n', 'r', 't', 'u'
        if (['b', 'f', 'n', 'r', 't', 'u', '"', '\\'].includes(p1.toLowerCase())) return match;
        return '\\\\' + p1;
    });

    // 5. Aggressive Quote Repair
    // Fixes cases like: "body": "This is a "trap" question" 
    // Logic: If a quote is not preceded by [ : , { ] and not followed by [ : , } ]
    // it's likely an unescaped internal quote.
    // This is a heuristic.
    jsonStr = jsonStr.replace(/([^\s:\[,{])"([^\s:\]},])/g, '$1\\"$2');

    // 6. Fix trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

    try {
        const cleaned = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
            return '"' + p1.replace(/\n|(?<!\\)"/g, (m: string) => m === '\n' ? '\\n' : '\\"') + '"';
        });
        return JSON.parse(cleaned);

    } catch (err) {
        console.warn("🏺 God-JSON: Standard parse failed. Attempting structural recovery...");
        
        // 7. Try a more relaxed approach: strip everything that isn't structural
        try {
            // Replace newlines inside quotes with \n
            const fixedNewlines = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
                return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
            });
            return JSON.parse(fixedNewlines);
        } catch (innerErr: any) {
            // LAST RESORT: Check for refusal before giving up
            if (isRefusal(raw) || raw.includes("<html") || raw.includes("500 Internal")) {
                return { refusal: true, original: raw };
            }

            // Multi-block recovery: try to find any valid JSON block if the first extraction failed
            const allBlocks = raw.match(/{[\s\S]*?}/g) || [];
            for (const block of allBlocks) {
                try { return JSON.parse(block); } catch { continue; }
            }

            console.error("🏺 God-JSON: Recovery failed. Length:", jsonStr.length);
            throw new Error(`God-JSON Parse Failure: ${innerErr.message}`);
        }

    }
}

/**
 * Detects if the LLM returned a refusal or policy warning instead of data.
 */
export function isRefusal(text: string): boolean {
    const refusalPatterns = [
        /I am sorry/i,
        /I apologize/i,
        /cannot fulfill/i,
        /against my policy/i,
        /restricted/i,
        /not allowed to generate/i,
        /ethical/i,
        /I cannot provide/i
    ];
    return refusalPatterns.some(p => p.test(text));
}


/**
 * Higher-level wrapper that takes a "schema-first" approach.
 * If the parse fails, it attempts to extract key fields via regex.
 */
export function godExtract(raw: string, fields: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Initialize with safe defaults based on field name patterns
    for (const field of fields) {
        if (field.includes("mcqs") || field.includes("recall") || field.includes("options") || field.includes("rows") || field.includes("headers")) {
            result[field] = [];
        } else {
            result[field] = "";
        }
    }

    try {
        const parsed = godSafeParse(raw);
        if (parsed && typeof parsed === 'object') {
            return { ...result, ...parsed };
        }
        return result;
    } catch {
        for (const field of fields) {
            const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
            const match = raw.match(regex);
            if (match) {
                result[field] = match[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
            }
        }
        return result;
    }
}

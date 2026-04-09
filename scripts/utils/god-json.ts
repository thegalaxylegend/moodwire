
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
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');

    if (firstBracket !== -1 && firstBracket < (firstBrace === -1 ? Infinity : firstBrace) && lastBracket > lastBrace) {
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
    } else if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    } else {
        if (isRefusal(raw) || raw.includes("<html")) {
            return { refusal: true, original: raw };
        }
        throw new Error("No JSON braces found in input");
    }

    // 2. Minimal Prep: Remove comments and control chars (Preserve \n \r for aggressive repair)
    jsonStr = jsonStr.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    jsonStr = jsonStr.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ");

    // 3. ATTEMPT 1: Native Parse (Highest Priority)
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        // Continue to repairs...
    }

    // 4. ATTEMPT 2: Structural Repairs (Trailing Commas, LaTeX, Python Literals)
    try {
        let repaired = jsonStr.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        
        // Fix Python/Common Mistake Literals (only if not inside quotes)
        // We use a safe regex that looks for these words not preceded by a quote
        repaired = repaired.replace(/(?<!["\w])(True|False|None|NaN|Infinity)(?!["\w])/g, (match) => {
            switch(match) {
                case 'True': return 'true';
                case 'False': return 'false';
                case 'None': return 'null';
                case 'NaN': return 'null'; // JSON doesn't support NaN
                case 'Infinity': return '999999999'; // Safe overflow
                default: return match;
            }
        });

        // Double backslashes for LaTeX if they aren't already escaped
        repaired = repaired.replace(/\\([a-df-z])/gi, (match, p1) => {
            if (['b', 'f', 'n', 'r', 't', 'u', '"', '\\'].includes(p1.toLowerCase())) return match;
            return '\\\\' + p1;
        });
        return JSON.parse(repaired);
    } catch (e) {
        // Continue to aggressive...
    }

    // 5. ATTEMPT 3: Aggressive Quote & Newline Repair
    try {
        const aggressive = jsonStr.replace(/"([^"]*)"/g, (match, p1) => {
            // Escape unescaped double quotes inside the string value
            // and replace real newlines with \n
            return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/(?<!\\)"/g, '\\"') + '"';
        });
        return JSON.parse(aggressive);
    } catch (err: any) {
        // LAST RESORT: Block search
        const allBlocks = raw.match(/{[\s\S]*?}/g) || [];
        for (const block of allBlocks) {
            try { return JSON.parse(block); } catch { continue; }
        }

        // ABSOLUTE LAST RESORT: Attempt to scrape as Markdown if it looks like content
        if (raw.includes('- ') || raw.includes('##') || raw.includes('**')) {
            console.warn("🏺 God-JSON: JSON failed. Attempting Markdown Scraping...");
            return {
                body: raw.replace(/```json|```/g, "").trim(),
                isScraped: true
            };
        }

        console.error("🏺 God-JSON: All recovery attempts failed.");
        throw new Error(`God-JSON Final Failure: ${err.message}`);
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
            // Merge parsed fields into result, but only if they contain actual content
            const merged = { ...result };
            for (const field of fields) {
                if (parsed[field] !== undefined && parsed[field] !== null) merged[field] = parsed[field];
            }
            return merged;
        }
        return result;
    } catch {
        // High-performance regex extraction for flat fields
        for (const field of fields) {
            // Try catching quoted string values first
            const stringRegex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
            const stringMatch = raw.match(stringRegex);
            if (stringMatch) {
                result[field] = stringMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                continue;
            }

            // Try catching markdown blocks if it's the 'body' field
            if (field === 'body') {
                const markdownRegex = /(?:###|##|- \*\*).*?(?=\n\n|\n{3,}|$)/s;
                const markdownMatch = raw.match(markdownRegex);
                if (markdownMatch) {
                    result[field] = markdownMatch[0].trim();
                }
            }
        }
        return result;
    }
}

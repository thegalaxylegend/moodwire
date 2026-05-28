
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║             🏺  GOD-JSON  —  Universal LLM Parser            ║
 * ║         8-Layer Cascade Recovery with Schema Awareness       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Failure modes handled:
 *  L1 — Native JSON.parse (happy path)
 *  L2 — Structural repairs (trailing commas, Python literals, LaTeX)
 *  L3 — Aggressive quote & newline normalisation
 *  L4 — Markdown code-fence stripping, then re-parse
 *  L5 — Block-level JSON fragment hunting (first complete {...})
 *  L6 — Regex field-by-field extraction
 *  L7 — Markdown body scraping (LLM returned prose instead of JSON)
 *  L8 — Safe defaults (pipeline must never crash)
 */

// ─── Refusal detection ────────────────────────────────────────────────────────

const REFUSAL_PATTERNS: RegExp[] = [
    /^i am sorry/i,
    /i apologize/i,
    /cannot fulfill/i,
    /against my policy/i,
    /\brestricted\b/i,
    /not allowed to generate/i,
    /\bethical\b.*\bconcern/i,
    /i cannot provide/i,
    /as an ai (language model|assistant)/i,
    /i'm unable to/i,
    /i regret to inform/i,
    /content policy/i,
];

export function isRefusal(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const sample = text.slice(0, 400); // Only test the preamble — avoids false positives
    return REFUSAL_PATTERNS.some(p => p.test(sample));
}

// ─── Layer helpers ────────────────────────────────────────────────────────────

/** Strip markdown code fences and XML declarations */
function stripWrapper(s: string): string {
    return s
        .replace(/^```(?:json|javascript|js|python|text|markdown)?\s*/im, '')
        .replace(/```\s*$/im, '')
        .replace(/^<\?xml[^>]*\?>\s*/i, '')
        .trim();
}

/** Extract the outermost balanced JSON object or array */
function extractOuterBlock(s: string): string | null {
    const oB = s.indexOf('{');
    const oA = s.indexOf('[');
    const start = oB === -1 ? oA : oA === -1 ? oB : Math.min(oB, oA);
    if (start === -1) return null;

    const opener = s[start];
    const closer = opener === '{' ? '}' : ']';
    let depth = 0;
    let inStr = false;
    let escaped = false;

    for (let i = start; i < s.length; i++) {
        const c = s[i];
        if (escaped) { escaped = false; continue; }
        if (c === '\\' && inStr) { escaped = true; continue; }
        if (c === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (c === opener) depth++;
        else if (c === closer) {
            depth--;
            if (depth === 0) return s.slice(start, i + 1);
        }
    }
    // Fallback: unclosed block — take from start to last closer
    const last = s.lastIndexOf(closer);
    if (last > start) return s.slice(start, last + 1);
    return s.slice(start);
}

/** Apply structural repairs to a semi-valid JSON string */
function repairStructure(s: string): string {
    let r = s;
    // Remove JS/Python style comments
    r = r.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    // Strip control characters except standard whitespace
    r = r.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    // Trailing commas before } or ]
    r = r.replace(/,\s*([}\]])/g, '$1');
    // Python / YAML literals
    r = r.replace(/(?<![\w"])(True|False|None|NaN|Infinity)(?![\w"])/g, m => {
        const map: Record<string, string> = { True: 'true', False: 'false', None: 'null', NaN: 'null', Infinity: '9e99' };
        return map[m] ?? m;
    });

    const trimmed = r.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        let inString = false;
        let escape = false;
        let depthBrace = 0;
        let depthBracket = 0;

        for (let i = 0; i < r.length; i++) {
            if (r[i] === '"' && !escape) inString = !inString;
            if (r[i] === '\\' && !escape) escape = true;
            else escape = false;

            if (!inString) {
                if (r[i] === '{') depthBrace++;
                else if (r[i] === '}') depthBrace--;
                else if (r[i] === '[') depthBracket++;
                else if (r[i] === ']') depthBracket--;
            }
        }

        if (inString) r += '"';
        for (let i = 0; i < depthBracket; i++) r += ']';
        for (let i = 0; i < depthBrace; i++) r += '}';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CRITICAL: Pre-escape known LaTeX/Greek letter sequences BEFORE
    // the generic backslash fixer runs. This is the #1 cause of JSON
    // parse failures — \alpha, \beta, \frac, \binom, \theta, etc.
    // Without this, \b → backspace and \f → formfeed INSIDE JSON strings,
    // which corrupts the parse irreversibly.
    // ═══════════════════════════════════════════════════════════════════════
    const LATEX_COMMANDS = [
        'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
        'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma',
        'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
        'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Theta', 'Lambda',
        'Sigma', 'Phi', 'Psi', 'Omega',
        'frac', 'sqrt', 'sum', 'prod', 'int', 'lim', 'infty', 'partial',
        'nabla', 'cdot', 'times', 'div', 'pm', 'mp', 'leq', 'geq', 'neq',
        'approx', 'equiv', 'propto', 'sim', 'simeq',
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'exp',
        'binom', 'text', 'mathrm', 'mathbf', 'vec', 'hat', 'bar', 'dot',
        'overline', 'underline', 'overbrace', 'underbrace',
        'left', 'right', 'begin', 'end', 'hbar', 'ell',
        'forall', 'exists', 'in', 'notin', 'subset', 'supset',
        'cap', 'cup', 'land', 'lor', 'neg', 'Rightarrow', 'Leftarrow',
        'rightarrow', 'leftarrow', 'implies', 'iff',
        'quad', 'qquad', 'space', 'hspace', 'vspace',
    ];
    // Build a single regex that matches \command (unescaped backslash + command name)
    // but only inside JSON string contexts (between quotes)
    const latexPattern = new RegExp(
        `(?<!\\\\\\\\.*)\\\\(${LATEX_COMMANDS.join('|')})(?=[^a-zA-Z]|$)`, 'g'
    );
    // Safer approach: directly double-escape any \<latex_command> in the raw string
    for (const cmd of LATEX_COMMANDS) {
        // Match single backslash + command that isn't already double-escaped
        const singleBackslash = new RegExp(`(?<!\\\\)\\\\${cmd}(?=[^a-zA-Z]|$)`, 'g');
        r = r.replace(singleBackslash, `\\\\${cmd}`);
    }

    // Double-escape ALL remaining non-standard backslash sequences inside JSON strings
    // Only preserve the 8 standard JSON escapes: \", \\, \/, \n, \r, \t, \b, \f, \uXXXX
    // NOTE: We now ALSO escape \b and \f because in our context they are ALWAYS LaTeX
    // (\binom, \beta, \frac, \forall) and never actual backspace/formfeed characters.
    r = r.replace(/"((?:[^"\\]|\\.)*)"/gs, (_m, inner: string) => {
        const fixed = inner.replace(/\\(?!["\\\//nrtu])/g, '\\\\');
        return `"${fixed}"`;
    });
    return r;
}

/** Repair unescaped double-quotes inside JSON string values */
function repairQuotes(s: string): string {
    return s.replace(/"([^"]*)"/g, (_m, inner: string) =>
        '"' + inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/(?<!\\)"/g, '\\"') + '"'
    );
}

// ─── L6: Regex field extraction ──────────────────────────────────────────────

function regexExtract(raw: string, fields: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const field of fields) {
        // Try quoted string value
        const strRx = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
        const strM = raw.match(strRx);
        if (strM) {
            result[field] = strM[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            continue;
        }
        // Try array value
        const arrRx = new RegExp(`"${field}"\\s*:\\s*(\\[[\\s\\S]*?\\])`, 's');
        const arrM = raw.match(arrRx);
        if (arrM) {
            try { result[field] = JSON.parse(arrM[1]); } catch { result[field] = []; }
            continue;
        }
        // Try numeric / boolean value
        const numRx = new RegExp(`"${field}"\\s*:\\s*([\\d.]+|true|false|null)`, 'i');
        const numM = raw.match(numRx);
        if (numM) {
            try { result[field] = JSON.parse(numM[1]); } catch { result[field] = numM[1]; }
        }
    }
    return result;
}

// ─── L7: Markdown body scraping ──────────────────────────────────────────────

function scrapeMarkdownBody(raw: string): Record<string, any> | null {
    const looks = raw.includes('- ') || raw.includes('## ') || raw.includes('**') || raw.includes('\n\n');
    if (!looks) return null;
    console.warn('🏺 God-JSON [L7]: JSON failed — scraping as raw Markdown body.');
    return {
        body: raw.replace(/```json|```/g, '').trim(),
        isScraped: true,
    };
}

// ─── Core parse ───────────────────────────────────────────────────────────────

export function godSafeParse(raw: string): any {
    if (!raw || typeof raw !== 'string') return null;

    // L0: Short-circuit for obvious refusals
    if (isRefusal(raw)) return { refusal: true, original: raw };

    let s = raw.trim();

    // L1: Native parse (happy path — LLM output clean JSON)
    try { return JSON.parse(s); } catch { /* continue */ }

    // L1b: Strip wrapper and try again
    s = stripWrapper(s);
    try { return JSON.parse(s); } catch { /* continue */ }

    // L2: Extract outer block
    const block = extractOuterBlock(s);
    if (block) {
        // L2a: Native parse of block
        try { return JSON.parse(block); } catch { /* continue */ }

        // L3: Structural repairs on block (includes LaTeX backslash escaping)
        const repaired = repairStructure(block);
        try { return JSON.parse(repaired); } catch { /* continue */ }

        // L4: Quote repair on repaired block
        const quotedFixed = repairQuotes(repaired);
        try { return JSON.parse(quotedFixed); } catch { /* continue */ }
    }

    // L4.5: Full-string structural repair (in case block extraction missed content)
    try {
        const fullRepaired = repairStructure(s);
        return JSON.parse(fullRepaired);
    } catch { /* continue */ }

    // L5: Block fragment hunting — try every complete {...} substring
    const fragments = s.match(/\{[\s\S]*?\}/g) || [];
    for (const frag of fragments) {
        try { return JSON.parse(frag); } catch { /* continue */ }
        try { return JSON.parse(repairStructure(frag)); } catch { /* continue */ }
    }

    // L6: Array fragments
    const arrFrags = s.match(/\[[\s\S]*?\]/g) || [];
    for (const frag of arrFrags) {
        try { return JSON.parse(frag); } catch { /* continue */ }
        try { return JSON.parse(repairStructure(frag)); } catch { /* continue */ }
    }

    // L7: Markdown scrape
    const scraped = scrapeMarkdownBody(raw);
    if (scraped) return scraped;

    // L8: Total failure
    console.error('🏺 God-JSON [L8]: All 8 recovery layers exhausted — returning null.');
    return null;
}

// ─── godExtract — schema-first extraction with guaranteed safe defaults ───────

/**
 * Extract specific fields from an LLM response string.
 * Returns safe defaults even if parsing completely fails.
 * The pipeline must NEVER crash because of a parse failure.
 */
export function godExtract(raw: string, fields: string[]): Record<string, any> {
    // Build safe defaults based on field name semantics
    const defaults: Record<string, any> = {};
    for (const f of fields) {
        const isArray = ['mcqs', 'recall', 'quick_recall', 'options', 'rows', 'headers', 'sections'].some(k => f.includes(k));
        defaults[f] = isArray ? [] : '';
    }

    // Attempt full parse first
    try {
        const parsed = godSafeParse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const merged = { ...defaults };
            for (const f of fields) {
                const val = parsed[f];
                if (val !== undefined && val !== null) {
                    // Type coercion safety: arrays expected as arrays
                    if (Array.isArray(defaults[f]) && !Array.isArray(val)) {
                        // If string, attempt to parse it as JSON array
                        if (typeof val === 'string') {
                            try { merged[f] = JSON.parse(val); } catch { merged[f] = [val]; }
                        } else {
                            merged[f] = [val];
                        }
                    } else {
                        merged[f] = val;
                    }
                }
            }
            return merged;
        }
    } catch { /* fall through to regex */ }

    // Regex field-by-field extraction (L6)
    const regexResult = regexExtract(raw, fields);
    const merged = { ...defaults, ...regexResult };

    // If body is still empty, try markdown scrape
    if (fields.includes('body') && !merged['body']) {
        const scraped = scrapeMarkdownBody(raw);
        if (scraped?.body) merged['body'] = scraped.body;
    }

    return merged;
}

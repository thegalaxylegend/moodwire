/**
 * preprocessLatex.ts — v2  (101% defensive LaTeX pre-processor)
 *
 * Fixes every observed KaTeX rendering failure before the string reaches
 * ReactMarkdown / rehype-katex:
 *
 *  A. Options stored with missing backslash:  `$text{CN}^{-}$`
 *     → sanitizeMathContent adds `\`: `$\text{CN}^{-}$`
 *
 *  B. `\text{long sentence that contains ^ or _}` wrapping the entire question
 *     → strips \text{}, recurses as plain Markdown (no KaTeX at all)
 *
 *  C. `\text{short formula with ^ or _}` e.g. `\text{CN^-}`, `\text{H_2O}`
 *     → fixTextCommandSubSup moves ^/_ outside \text{}: `\text{CN}^{-}`
 *     so KaTeX gets valid LaTeX
 *
 *  D. `\text{CO}` etc. (plain, no ^/_) → kept as-is inside the math run
 *
 *  E. `^Δ` `^n` `_n` (single Unicode-char super/subscript w/o braces) inside
 *     existing $…$ → wrapped: `^{Δ}` to prevent KaTeX "Expected EOF" errors
 *
 *  F. Literal `\n` (2-char: backslash + n) inside $…$ → space
 *
 *  G. Literal `\n` outside $…$ → real newline (Markdown paragraph break)
 *
 *  H. `\begin{array/matrix/…}…\end{…}` outside $$ → wrapped in `$$\n…\n$$`
 *
 *  I. Bare inline LaTeX commands outside $…$ → wrapped in `$…$`
 *
 *  J. Options containing only LaTeX (no $ delimiters) → wrapped in `$…$`
 *     via processOuterSegment
 */

// ─── Command whitelist ────────────────────────────────────────────────────────
const MATH_CMDS = new Set([
    // fractions / roots / sums
    'frac','dfrac','tfrac','cfrac','sqrt','sum','prod','coprod',
    'int','oint','iint','iiint','idotsint',
    // limits / log-like
    'lim','limsup','liminf','sup','inf','max','min',
    'sin','cos','tan','sec','csc','cot',
    'arcsin','arccos','arctan','sinh','cosh','tanh',
    'log','ln','exp','det','dim','ker','gcd','hom','arg','deg',
    'mod','bmod','pmod',
    // Greek lower
    'alpha','beta','gamma','delta','epsilon','varepsilon','zeta','eta',
    'theta','vartheta','iota','kappa','lambda','mu','nu','xi','pi','varpi',
    'rho','varrho','sigma','varsigma','tau','upsilon','phi','varphi',
    'chi','psi','omega',
    // Greek upper
    'Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta',
    'Iota','Kappa','Lambda','Mu','Nu','Xi','Pi','Rho','Sigma','Tau',
    'Upsilon','Phi','Chi','Psi','Omega',
    // operators / relations
    'cdot','cdots','times','div','pm','mp',
    'leq','geq','neq','approx','equiv','sim','simeq','cong','propto',
    'le','ge','ne','ll','gg','prec','succ','preceq','succeq',
    'leqslant','geqslant','not',
    // arrows
    'leftarrow','rightarrow','Leftarrow','Rightarrow',
    'leftrightarrow','Leftrightarrow','to','gets','mapsto',
    'uparrow','downarrow','nearrow','searrow',
    // sets / logic
    'infty','partial','nabla','forall','exists','nexists','emptyset',
    'in','notin','subset','subseteq','supset','supseteq','cup','cap',
    'setminus','vee','wedge','lor','land','lnot','neg',
    'therefore','because','implies','vdash','models',
    // decorations / fonts
    'hat','vec','bar','tilde','overline','underline',
    'widehat','widetilde','overleftarrow','overrightarrow',
    'mathbf','mathrm','mathit','mathbb','mathcal','mathscr','mathfrak',
    // misc
    'text','binom','choose','left','right',
    'lfloor','rfloor','lceil','rceil','langle','rangle',
    'angle','perp','parallel','triangle','square',
    'oplus','ominus','otimes','oslash','odot',
    'ldots','vdots','ddots','dots',
    'hbar','ell','aleph','Re','Im','wp',
    'prime','dagger','ddagger','bullet','star','circ',
    'over','atop','displaystyle','textstyle','scriptstyle',
    'color','textcolor','boxed','underbrace','overbrace',
]);

// ─── Block environments → $$…$$ ──────────────────────────────────────────────
const BLOCK_ENV_RE =
    /\[?\\begin\{(array|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|align\*?|aligned|cases|equation\*?|gather\*?|multline\*?|eqnarray\*?|tabular)\}([\s\S]*?)\\end\{\1\}\]?/g;

// ─── Quick-test for LaTeX presence ───────────────────────────────────────────
const MATH_CMD_PRESENCE_RE =
    /\\(?:frac|sqrt|sum|int|text|cdot|times|alpha|beta|gamma|delta|mu|pi|theta|sigma|phi|omega|leq|geq|infty|partial|in|cup|cap|to|hat|vec|mathbf|mathbb|binom|lfloor|rfloor|langle|rangle|sin|cos|tan|log|ln|lim|begin)/;

// ─── Sentence-like content heuristic (long prose wrapped in \text{…}) ────────
const PROSE_WORD_RE =
    /\b(?:the|and|is|by|of|to|in|at|for|with|from|that|this|which|are|was|were|have|has|been|given|constant|equation|following|where|when|what|find|calculate|determine|using|such|each|its|their|between|through|during|after|before|related|defined|expressed|equal|value|state|show|prove|if|let|consider|suppose|then|can|will|may|must|does|more|less|greater|smaller|equal)\b/i;

// ─────────────────────────────────────────────────────────────────────────────
//  Low-level helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Skip past a balanced `{…}` block starting at index `start` (which points at `{`). */
function skipBraces(text: string, start: number): number {
    let depth = 1, i = start + 1;
    while (i < text.length && depth > 0) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        i++;
    }
    return i;
}

/** Collect optional `{arg}` groups and `_` / `^` subscript/superscript arguments. */
function collectArguments(text: string, i: number): number {
    while (i < text.length && text[i] === ' ') i++;
    while (i < text.length && text[i] === '{') {
        i = skipBraces(text, i);
        while (i < text.length && text[i] === ' ') i++;
    }
    while (i < text.length && (text[i] === '_' || text[i] === '^')) {
        i++;
        while (i < text.length && text[i] === ' ') i++;
        if (i < text.length && text[i] === '{') i = skipBraces(text, i);
        else if (i < text.length && /[a-zA-Z0-9]/.test(text[i])) i++;
        while (i < text.length && text[i] === ' ') i++;
    }
    return i;
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIX C: Move ^/_ OUTSIDE \text{…} content
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given the RAW content inside \text{…} (i.e. without the outer braces),
 * return fixed LaTeX where ^/_ that were inside are moved outside.
 *
 * Examples:
 *   "CN^-"   → \text{CN}^{-}
 *   "H_2O"   → \text{H}_{2}\text{O}
 *   "NH_3"   → \text{NH}_{3}
 *   "CO"     → \text{CO}        (no ^/_, no change needed)
 */
function fixTextCommandSubSup(content: string): string {
    if (!/[_^]/.test(content)) return `\\text{${content}}`;

    let result = '';
    let pending = '';
    let i = 0;

    while (i < content.length) {
        const ch = content[i];
        if (ch === '^' || ch === '_') {
            const op = ch;
            i++;
            let arg = '';
            if (i < content.length && content[i] === '{') {
                const end = skipBraces(content, i);
                arg = content.slice(i, end);    // includes { and }
                i = end;
            } else if (i < content.length) {
                arg = `{${content[i]}}`;
                i++;
            }
            if (pending) { result += `\\text{${pending}}`; pending = ''; }
            result += `${op}${arg}`;
        } else {
            pending += ch;
            i++;
        }
    }
    if (pending) result += `\\text{${pending}}`;
    return result || `\\text{}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIX B + C + D: Pre-process every \text{…} occurrence in OUTER text
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walk the string finding `\text{…}` (with simple non-nested content) and:
 *  - Long prose (≥ 40 chars or sentence words found): strip \text{}, keep content
 *  - Short with ^/_: call fixTextCommandSubSup → produces valid LaTeX for KaTeX
 *  - Short plain: keep as \text{content} (valid KaTeX)
 *
 * Uses a proper brace-depth scanner so nested {} inside \text{…} are handled.
 */
function preprocessTextCommands(text: string): string {
    let result = '';
    let i = 0;

    while (i < text.length) {
        // Look for \text{
        const idx = text.indexOf('\\text{', i);
        if (idx === -1) { result += text.slice(i); break; }

        result += text.slice(i, idx);   // everything before \text{
        i = idx + 6;                    // position right after the opening `{`

        // Scan for matching closing `}` using depth counter
        let depth = 1, j = i;
        while (j < text.length && depth > 0) {
            if (text[j] === '{') depth++;
            else if (text[j] === '}') depth--;
            if (depth > 0) j++;
            else break;
        }
        const content = text.slice(i, j);
        i = j + 1;  // skip past the closing `}`

        const hasSubSup = /[_^]/.test(content);
        const isLong = content.length >= 40 || PROSE_WORD_RE.test(content);

        if (isLong) {
            // Strip \text{…}: the sentence/prose content is emitted as plain text.
            // We do NOT re-wrap it in math — KaTeX never sees this content.
            result += content;
        } else if (hasSubSup) {
            // Fix sub/superscripts inside \text{…} so KaTeX gets valid LaTeX.
            result += fixTextCommandSubSup(content);
        } else {
            // Short plain text: keep \text{content} untouched (valid KaTeX).
            result += `\\text{${content}}`;
        }
    }
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIX E + F: Sanitise EXISTING $…$ / $$…$$ blocks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitise the content INSIDE an existing `$…$` or `$$…$$` block.
 *
 * Fixes applied (in order):
 *  1. Literal `\n` (backslash-n two chars) → space  (prevents unknown-cmd error)
 *  2. `text{` without leading `\` → `\text{`  (restores missing backslash)
 *  3. `^X` where X is a single non-digit, non-ASCII-letter char → `^{X}`
 *  4. `_X` same rule → `_{X}`
 */
function sanitizeMathContent(mathBlock: string): string {
    const isBlock = mathBlock.startsWith('$$');
    const delim = isBlock ? '$$' : '$';
    let inner = mathBlock.slice(delim.length, -delim.length);

    // 1. Literal \n → space
    inner = inner.replace(/\\n/g, ' ');

    // 2. text{ missing backslash → \text{
    //    Negative lookbehind: don't match if preceded by \ or a word char
    //    Pattern: match char-before + "text{" so we can check the char before
    inner = inner.replace(
        /(^|[^\\a-zA-Z0-9])(text\{)/g,
        (_, prefix, token) => `${prefix}\\${token}`
    );

    // 3 & 4. ^X and _X for single Unicode / non-ASCII chars not already braced.
    //   Use function callbacks (not string replacements) for correct Unicode handling.
    inner = inner.replace(/\^([^\d{}\s\\])(?![{\\])/g, (_, ch) => `^{${ch}}`);
    inner = inner.replace(/_([^\d{}\s\\])(?![{\\])/g, (_, ch) => `_{${ch}}`);

    return `${delim}${inner}${delim}`;
}

/** Apply `sanitizeMathContent` to every `$…$` / `$$…$$` block in a string. */
function sanitizeExistingMathBlocks(text: string): string {
    return text.replace(
        /(\$\$[\s\S]*?\$\$|\$(?:[^$\n\\]|\\.)*?\$)/g,
        match => sanitizeMathContent(match)
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIX I: Wrap BARE inline LaTeX in $…$
// ─────────────────────────────────────────────────────────────────────────────

function wrapBareLatex(text: string): string {
    let result = '';
    let i = 0;

    while (i < text.length) {
        // Look for a backslash followed by a letter (start of LaTeX command)
        if (text[i] === '\\' && i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1])) {
            // Read the command name
            let j = i + 1;
            while (j < text.length && /[a-zA-Z]/.test(text[j])) j++;
            const cmdName = text.slice(i + 1, j);

            if (MATH_CMDS.has(cmdName)) {
                // Start collecting a math run
                const mathStart = i;
                i = j;
                i = collectArguments(text, i);

                // Keep extending the run if more math tokens follow
                let keepGoing = true;
                while (keepGoing) {
                    let k = i;
                    while (k < text.length && text[k] === ' ') k++;

                    if (k < text.length && (text[k] === '_' || text[k] === '^')) {
                        i = k + 1;
                        while (i < text.length && text[i] === ' ') i++;
                        if (i < text.length && text[i] === '{') i = skipBraces(text, i);
                        else if (i < text.length && /[a-zA-Z0-9]/.test(text[i])) i++;
                    } else if (
                        k < text.length &&
                        text[k] === '\\' &&
                        k + 1 < text.length &&
                        /[a-zA-Z]/.test(text[k + 1])
                    ) {
                        let l = k + 1;
                        while (l < text.length && /[a-zA-Z]/.test(text[l])) l++;
                        const nextCmd = text.slice(k + 1, l);
                        if (MATH_CMDS.has(nextCmd)) {
                            i = l;
                            i = collectArguments(text, i);
                        } else {
                            keepGoing = false;
                        }
                    } else if (k < text.length && /[+\-=*/,;]/.test(text[k])) {
                        // Operator/punctuation — extend run only if a math token follows
                        let l = k + 1;
                        while (l < text.length && text[l] === ' ') l++;
                        if (
                            l < text.length && text[l] === '\\' &&
                            l + 1 < text.length && /[a-zA-Z]/.test(text[l + 1])
                        ) {
                            let m = l + 1;
                            while (m < text.length && /[a-zA-Z]/.test(text[m])) m++;
                            if (MATH_CMDS.has(text.slice(l + 1, m))) {
                                i = k + 1;
                            } else { keepGoing = false; }
                        } else if (l < text.length && /[0-9.]/.test(text[l])) {
                            i = k + 1;
                        } else { keepGoing = false; }
                    } else {
                        keepGoing = false;
                    }
                }

                const mathExpr = text.slice(mathStart, i).trim();
                if (mathExpr) result += `$${mathExpr}$`;
            } else {
                // Unknown command — output as-is
                result += text[i];
                i++;
            }
        } else {
            result += text[i];
            i++;
        }
    }
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Segment processors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process a segment of text that is OUTSIDE existing `$…$` delimiters.
 *  G. Literal \n → real newline
 *  H. \begin{env}…\end{env} → $$\n…\n$$
 *  B/C/D. \text{…} → handled by preprocessTextCommands
 *  I. Remaining bare LaTeX → $…$
 */
function processOuterSegment(text: string): string {
    if (!text) return text;

    // G. Literal two-char `\n` → real newline
    let result = text.replace(/\\n/g, '\n');

    // H. Block environments → $$…$$
    result = result.replace(
        BLOCK_ENV_RE,
        (_, env, content) => `\n$$\n\\begin{${env}}${content}\\end{${env}}\n$$\n`
    );

    // B/C/D. Handle \text{…} specially (before wrapBareLatex sees it)
    result = preprocessTextCommands(result);

    // I. Wrap remaining bare inline LaTeX in $…$
    if (MATH_CMD_PRESENCE_RE.test(result)) {
        result = wrapBareLatex(result);
    }

    return result;
}

/**
 * Process a segment that IS inside `$…$` or `$$…$$`.
 * Delegates to sanitizeMathContent for all fixes.
 */
function processMathBlock(block: string): string {
    return sanitizeMathContent(block);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Preprocess a QUESTION TEXT or EXPLANATION string before passing to
 * ReactMarkdown + remarkMath + rehypeKatex.
 *
 * Splits on existing `$…$`/`$$…$$`, applies the appropriate processor to each
 * segment, then reassembles.
 */
export function preprocessQuestionText(text: string): string {
    if (!text) return '';

    const out: string[] = [];
    // Match existing block ($$…$$) or inline ($…$) math
    const mathRe = /(\$\$[\s\S]*?\$\$|\$(?:[^$\n\\]|\\.)*?\$)/g;
    let last = 0;
    let m: RegExpExecArray | null;

    mathRe.lastIndex = 0;
    while ((m = mathRe.exec(text)) !== null) {
        if (m.index > last) out.push(processOuterSegment(text.slice(last, m.index)));
        out.push(processMathBlock(m[0]));
        last = m.index + m[0].length;
    }
    out.push(processOuterSegment(text.slice(last)));

    return out.join('');
}

/**
 * Preprocess an OPTION string.
 *
 * If the option already contains `$…$` math: sanitize the math blocks.
 * Otherwise: run through processOuterSegment which handles bare LaTeX,
 * \text{…}, block envs, and literal `\n`.
 */
export function preprocessOption(opt: string): string {
    if (!opt) return '';

    let result = opt.trim();
    // Normalize literal \n → space (options are single-line UI elements)
    result = result.replace(/\\n/g, ' ');

    if (result.includes('$')) {
        // Option already has math delimiters — only sanitize their content
        result = sanitizeExistingMathBlocks(result);
    } else {
        // No delimiters — full outer processing (wraps bare LaTeX in $…$, etc.)
        result = processOuterSegment(result);
    }

    return result;
}

/**
 * Strip all LaTeX formatting from a string to produce a plain-text fallback.
 * Used by MathErrorBoundary to render un-parseable math gracefully.
 */
export function stripLatex(text: string): string {
    if (!text) return '';
    return text
        .replace(/\$\$?([\s\S]*?)\$\$?/g, '$1')              // strip $…$ delimiters
        .replace(/\\text\{([^}]*)\}/g, '$1')                  // \text{x} → x
        .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')            // \cmd{x} → x
        .replace(/\\[a-zA-Z]+/g, '')                          // \cmd → ''
        .replace(/[{}_^]/g, '')                               // remove LaTeX meta-chars
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

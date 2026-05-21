/**
 * Quick manual verification of all 5 fixes.
 * Run with:  node --input-type=module < scripts/test-preprocess.mjs
 *
 * (Does NOT import the TS file — reproduces the key transforms directly
 *  so we can run without a build step.)
 */

// ─── Reproduce sanitizeMathContent logic ─────────────────────────────────────
function sanitize(block) {
    const isBlock = block.startsWith('$$');
    const delim = isBlock ? '$$' : '$';
    let inner = block.slice(delim.length, -delim.length);
    inner = inner.replace(/\\n/g, ' ');                                           // F
    inner = inner.replace(/(^|[^\\a-zA-Z0-9])(text\{)/g, (_, p, t) => `${p}\\${t}`); // A
    inner = inner.replace(/\^([^\d{}\s\\])(?![a-zA-Z{])/g, '^{$1}');           // E
    inner = inner.replace(/_([^\d{}\s\\])(?![a-zA-Z{])/g, '_{$1}');            // E
    return `${delim}${inner}${delim}`;
}

// ─── Reproduce fixTextCommandSubSup ──────────────────────────────────────────
function fixSubSup(content) {
    if (!/[_^]/.test(content)) return `\\text{${content}}`;
    let result = '', pending = '', i = 0;
    while (i < content.length) {
        const ch = content[i];
        if (ch === '^' || ch === '_') {
            let arg = '';
            i++;
            if (i < content.length && content[i] === '{') {
                let depth = 1, j = i + 1;
                while (j < content.length && depth > 0) {
                    if (content[j] === '{') depth++;
                    else if (content[j] === '}') depth--;
                    j++;
                }
                arg = content.slice(i, j);
                i = j;
            } else if (i < content.length) {
                arg = `{${content[i]}}`;
                i++;
            }
            if (pending) { result += `\\text{${pending}}`; pending = ''; }
            result += `${ch}${arg}`;
        } else { pending += ch; i++; }
    }
    if (pending) result += `\\text{${pending}}`;
    return result;
}

const PROSE_RE = /\b(?:the|and|is|by|of|to|in|at|for|with|from|that|this|which|are|was|were|have|has|been|given|constant|equation|following|where|when|what|find|calculate|determine|using|such|each|its|their|between|through|during|after|before|related|defined|expressed|equal|value|state|show|prove|if|let|consider|suppose|then|can|will|may|must|does|more|less|greater|smaller|equal)\b/i;

function handleTextCmd(content) {
    const hasSubSup = /[_^]/.test(content);
    const isLong = content.length >= 40 || PROSE_RE.test(content);
    if (isLong) return content;                          // B: strip \text{}, plain text
    if (hasSubSup) return fixSubSup(content);            // C: move ^/_ outside \text{}
    return `\\text{${content}}`;                         // D: keep as-is
}

// ─── Tests ────────────────────────────────────────────────────────────────────
const tests = [
    {
        label: 'FIX A: text{ → \\text{ inside $...$',
        input: '$text{CN}^{-}$',
        fn: s => sanitize(s),
        expect: '$\\text{CN}^{-}$',
    },
    {
        label: 'FIX A: text{ at start of inner math block',
        input: '$text{H}_{2}\\text{O}$',
        fn: s => sanitize(s),
        expect: '$\\text{H}_{2}\\text{O}$',
    },
    {
        label: 'FIX B: long \\text{sentence with ^} → plain text',
        input: 'The equilibrium constant Kp is related to the equilibrium constant Kc by the equation Kp = Kc(RT)^Δn.',
        fn: content => handleTextCmd(content),
        expect: 'The equilibrium constant Kp is related to the equilibrium constant Kc by the equation Kp = Kc(RT)^Δn.',
    },
    {
        label: 'FIX C: \\text{CN^-} → \\text{CN}^{-}',
        input: 'CN^-',
        fn: content => handleTextCmd(content),
        expect: '\\text{CN}^{-}',
    },
    {
        label: 'FIX C: \\text{H_2O} → \\text{H}_{2}\\text{O}',
        input: 'H_2O',
        fn: content => handleTextCmd(content),
        expect: '\\text{H}_{2}\\text{O}',
    },
    {
        label: 'FIX C: \\text{NH_3} → \\text{NH}_{3}',
        input: 'NH_3',
        fn: content => handleTextCmd(content),
        expect: '\\text{NH}_{3}',
    },
    {
        label: 'FIX D: \\text{CO} → \\text{CO} (no change)',
        input: 'CO',
        fn: content => handleTextCmd(content),
        expect: '\\text{CO}',
    },
    {
        label: 'FIX E: ^Δ → ^{Δ} inside $...$',
        input: '$Kp = Kc(RT)^Δn$',
        fn: s => sanitize(s),
        expect: '$Kp = Kc(RT)^{Δ}n$',
    },
    {
        label: 'FIX F: \\n inside $...$ → space',
        input: '$E = mc^2\\n+ hf$',
        fn: s => sanitize(s),
        expect: '$E = mc^2 + hf$',
    },
];

let passed = 0, failed = 0;
for (const { label, input, fn, expect } of tests) {
    const got = fn(input);
    const ok = got === expect;
    console.log(`${ok ? '✅' : '❌'} ${label}`);
    if (!ok) {
        console.log(`   expected: ${expect}`);
        console.log(`   got:      ${got}`);
        failed++;
    } else {
        passed++;
    }
}
console.log(`\n${passed}/${passed + failed} passed`);

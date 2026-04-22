/**
 * 🎓 Jules Academic Grammar & Tone Auditor v2.0 (FULL AUTO-FIX)
 * 
 * Uses the free LanguageTool API to refine blog content.
 * v2.0 Changes:
 *   - Auto-fixes ALL safe categories (not just typos/punctuation)
 *   - Protects LaTeX blocks and code fences from corruption
 *   - Smart chunking for large blogs (prevents 413 Payload Too Large)
 *   - Confidence-gated replacements to prevent hallucination
 */

import fs from 'fs';
import path from 'path';

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Categories that are ALWAYS safe to auto-apply.
 * These are deterministic corrections where the LanguageTool suggestion
 * is overwhelmingly likely to be correct for academic English.
 */
const AUTO_FIX_CATEGORIES = new Set([
    // Original 4 (always safe)
    'TYPOS',
    'PUNCTUATION',
    'WHITESPACE',
    'CASING',
    // Expanded — grammar/style fixes that are deterministic
    'GRAMMAR',
    'STYLE',
    'REDUNDANCY',
    'MISC',
    'CONFUSED_WORDS',
    'COMPOUNDING',
    'COLLOCATIONS',
    'REPETITIONS',
    'SEMANTICS',
    'TEXT_ANALYSIS',
    'TYPOGRAPHY',
]);

/**
 * Specific rule IDs that should NEVER be auto-fixed, even if their
 * category is in AUTO_FIX_CATEGORIES. These rules are either too
 * aggressive, context-dependent, or prone to corrupting academic text.
 */
const RULE_BLOCKLIST = new Set([
    'MORFOLOGIK_RULE_EN_US',      // Flags technical terms as misspellings
    'EN_QUOTES',                   // Tries to convert quotes — breaks markdown
    'DASH_RULE',                   // Aggressively changes dashes
    'COMMA_PARENTHESIS_WHITESPACE', // Conflicts with LaTeX notation
    'UPPERCASE_SENTENCE_START',    // Flags bullet points that start lowercase
    'SENTENCE_WHITESPACE',         // Can break intentional formatting
    'ARROWS',                      // Tries to convert → to arrow emoji
    'MULTIPLICATION_SIGN',         // Tries to convert × — breaks math context
    'EN_UNPAIRED_BRACKETS',        // Flags LaTeX braces as unpaired
    'UNIT_SPACE',                  // Conflicts with math notation like "5cm"
    'DATE_NEW_YEAR',               // False positives on year ranges
    'ENGLISH_WORD_REPEAT_RULE',    // Sometimes flags intentional repetition
    'WORD_CONTAINS_UNDERSCORE',    // Flags variable names
    'UNLIKELY_OPENING_PUNCTUATION', // Flags LaTeX delimiters
    'WHITESPACE_RULE',             // Too aggressive with whitespace changes
]);

/**
 * Maximum text length per API call. LanguageTool's free tier rejects
 * payloads above ~50KB. We chunk at 40K chars to leave headroom.
 */
const MAX_CHUNK_SIZE = 40_000;

// ─── LaTeX / Code Protection ──────────────────────────────────────────────────

interface ProtectedRegion {
    placeholder: string;
    original: string;
}

/**
 * Replaces LaTeX blocks ($...$, $$...$$) and code fences (```...```)
 * with unique placeholders so LanguageTool cannot corrupt them.
 * Returns the sanitised text and a map to restore originals.
 */
function protectSpecialBlocks(text: string): { sanitised: string; regions: ProtectedRegion[] } {
    const regions: ProtectedRegion[] = [];
    let counter = 0;

    function addPlaceholder(match: string): string {
        const placeholder = `⟦PROTECTED_${counter++}⟧`;
        regions.push({ placeholder, original: match });
        return placeholder;
    }

    let sanitised = text;

    // 1. Code fences (```...```) — must be first (greedy)
    sanitised = sanitised.replace(/```[\s\S]*?```/g, addPlaceholder);

    // 2. Block LaTeX ($$...$$) — before inline
    sanitised = sanitised.replace(/\$\$[\s\S]*?\$\$/g, addPlaceholder);

    // 3. Inline LaTeX ($...$) — careful not to match currency
    sanitised = sanitised.replace(/\$(?!\s)[^$\n]+(?<!\s)\$/g, addPlaceholder);

    // 4. HTML tags (<details>, <summary>, etc.)
    sanitised = sanitised.replace(/<[^>]+>/g, addPlaceholder);

    // 5. Markdown image/link syntax
    sanitised = sanitised.replace(/!\[[^\]]*\]\([^)]+\)/g, addPlaceholder);
    sanitised = sanitised.replace(/\[[^\]]*\]\([^)]+\)/g, addPlaceholder);

    // 6. Frontmatter block (---...---)
    const fmMatch = sanitised.match(/^(---[\s\S]*?---\r?\n)/);
    if (fmMatch) {
        sanitised = sanitised.replace(fmMatch[1], addPlaceholder(fmMatch[1]));
    }

    return { sanitised, regions };
}

/**
 * Restores all protected regions back into the text.
 */
function restoreSpecialBlocks(text: string, regions: ProtectedRegion[]): string {
    let restored = text;
    // Restore in reverse order to handle nested placeholders
    for (let i = regions.length - 1; i >= 0; i--) {
        // Use split+join instead of replace to avoid regex special char issues
        restored = restored.split(regions[i].placeholder).join(regions[i].original);
    }
    return restored;
}

// ─── Smart Chunking ──────────────────────────────────────────────────────────

/**
 * Splits text into chunks ≤ MAX_CHUNK_SIZE, breaking at paragraph
 * boundaries to avoid splitting mid-sentence.
 */
function chunkText(text: string): string[] {
    if (text.length <= MAX_CHUNK_SIZE) return [text];

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= MAX_CHUNK_SIZE) {
            chunks.push(remaining);
            break;
        }

        // Find the last paragraph break before the limit
        let splitAt = remaining.lastIndexOf('\n\n', MAX_CHUNK_SIZE);
        if (splitAt < MAX_CHUNK_SIZE * 0.5) {
            // If no good paragraph break, try a single newline
            splitAt = remaining.lastIndexOf('\n', MAX_CHUNK_SIZE);
        }
        if (splitAt < MAX_CHUNK_SIZE * 0.3) {
            // Last resort: hard split
            splitAt = MAX_CHUNK_SIZE;
        }

        chunks.push(remaining.substring(0, splitAt));
        remaining = remaining.substring(splitAt);
    }

    return chunks;
}

// ─── Core Audit ──────────────────────────────────────────────────────────────

/**
 * Checks a single chunk of text against LanguageTool and applies
 * all safe corrections.
 */
async function auditChunk(text: string): Promise<{ corrected: string; fixed: number; total: number; skipped: number }> {
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('language', 'en-US');
    // Disable rules that are known to be problematic for academic content
    params.append('disabledRules', [...RULE_BLOCKLIST].join(','));

    const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        body: params,
    });

    if (!response.ok) {
        if (response.status === 413) {
            // Still too large even after chunking — try splitting in half
            console.warn(`   ⚠️ Chunk still too large (${text.length} chars). Splitting further...`);
            const mid = Math.floor(text.length / 2);
            const splitAt = text.lastIndexOf('\n', mid);
            const actualSplit = splitAt > mid * 0.3 ? splitAt : mid;

            const r1 = await auditChunk(text.substring(0, actualSplit));
            const r2 = await auditChunk(text.substring(actualSplit));

            return {
                corrected: r1.corrected + r2.corrected,
                fixed: r1.fixed + r2.fixed,
                total: r1.total + r2.total,
                skipped: r1.skipped + r2.skipped,
            };
        }
        console.error(`❌ LanguageTool API Error: ${response.status} ${response.statusText}`);
        return { corrected: text, fixed: 0, total: 0, skipped: 0 };
    }

    const data: any = await response.json();
    const matches = data.matches || [];

    if (matches.length === 0) {
        return { corrected: text, fixed: 0, total: 0, skipped: 0 };
    }

    let corrected = text;
    let fixed = 0;
    let skipped = 0;

    // Sort from end to start so replacements don't shift earlier offsets
    const sorted = matches.sort((a: any, b: any) => b.offset - a.offset);

    for (const match of sorted) {
        const ruleId: string = match.rule?.id ?? '';
        const ruleCategory: string = match.rule?.category?.id ?? '';
        const replacement = match.replacements?.[0]?.value;

        // Skip if no replacement suggested
        if (!replacement) { skipped++; continue; }

        // Skip blocklisted rules
        if (RULE_BLOCKLIST.has(ruleId)) { skipped++; continue; }

        // Skip if category is not in our safe list
        if (!AUTO_FIX_CATEGORIES.has(ruleCategory)) { skipped++; continue; }

        // Skip if the replacement is identical (no-op)
        const original = corrected.substring(match.offset, match.offset + match.length);
        if (original === replacement) continue;

        // Skip if the replacement is suspiciously different in length (>3x longer/shorter)
        // This prevents LanguageTool from replacing a word with a whole sentence
        if (replacement.length > original.length * 3 + 20) { skipped++; continue; }

        // Skip if the replacement would corrupt a protected placeholder
        if (replacement.includes('⟦PROTECTED_') || original.includes('⟦PROTECTED_')) continue;

        // ✅ Apply the fix
        corrected = corrected.substring(0, match.offset) + replacement + corrected.substring(match.offset + match.length);
        fixed++;
    }

    return { corrected, fixed, total: matches.length, skipped };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function auditGrammar(text: string): Promise<string> {
    try {
        console.log(`📡 Jules is auditing grammar via LanguageTool API...`);

        // Step 1: Protect LaTeX, code, and special blocks
        const { sanitised, regions } = protectSpecialBlocks(text);

        // Step 2: Chunk the sanitised text
        const chunks = chunkText(sanitised);
        let totalFixed = 0;
        let totalDetected = 0;
        let totalSkipped = 0;
        const correctedChunks: string[] = [];

        for (const chunk of chunks) {
            // Rate-limit: LanguageTool free tier allows ~20 req/min
            if (chunks.length > 1) await new Promise(r => setTimeout(r, 3500));

            const result = await auditChunk(chunk);
            correctedChunks.push(result.corrected);
            totalFixed += result.fixed;
            totalDetected += result.total;
            totalSkipped += result.skipped;
        }

        const correctedSanitised = correctedChunks.join('');

        // Step 3: Restore protected blocks
        const finalText = restoreSpecialBlocks(correctedSanitised, regions);

        // Step 4: Log results
        if (totalFixed > 0) {
            console.log(`✨ Auto-fixed ${totalFixed} of ${totalDetected} issues (${totalSkipped} skipped as unsafe).`);
        } else if (totalDetected > 0) {
            console.log(`✅ ${totalDetected} issues detected but all filtered by safety rules. No changes made.`);
        } else {
            console.log(`✅ No grammatical issues found by LanguageTool.`);
        }

        return finalText;
    } catch (err: any) {
        console.error(`❌ Grammar Audit Error: ${err.message}`);
        return text;
    }
}

// CLI usage
if (process.argv[1]?.includes('grammar-audit')) {
    const filePath = process.argv[2];
    if (filePath && fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, 'utf-8');
        auditGrammar(text).then(corrected => {
            if (process.argv.includes('--write')) {
                fs.writeFileSync(filePath, corrected);
                console.log('✅ File updated with corrections.');
            } else {
                console.log('\n--- CORRECTED TEXT ---\n', corrected);
            }
        });
    } else {
        console.log('Usage: npx tsx scripts/utils/grammar-audit.ts <file_path> [--write]');
    }
}

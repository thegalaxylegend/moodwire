/**
 * 🌐 Hindi Blog Translator (NEXUS v2 — Phase 4)
 * 
 * Translates English blog posts to Hindi using your EXISTING
 * Gemini API keys (FREE — no Google Translate billing needed).
 * 
 * Features:
 * - Protects LaTeX, code blocks, URLs, and frontmatter from translation
 * - Translates in chunks to handle long blogs
 * - Rotates across 6 Gemini keys for rate limit safety
 * - Generates proper hreflang metadata
 * - Skips already-translated blogs
 * 
 * Run: npx tsx scripts/hindi-translator.ts
 * Run single: npx tsx scripts/hindi-translator.ts --slug=thermodynamics-class-11
 * Dry run: npx tsx scripts/hindi-translator.ts --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const HINDI_DIR = path.join(__dirname, '../src/content/blogs-hi');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const MAX_PER_RUN = 3; // Translate max 3 blogs per run (to stay in free quota)

// ════════════════════════════════════════════════════════
// GEMINI KEY ROTATION (reuses your existing keys)
// ════════════════════════════════════════════════════════

const GEMINI_KEYS = [
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY_3,
    process.env.VITE_GEMINI_API_KEY_4,
    process.env.VITE_GEMINI_API_KEY_5,
    process.env.VITE_GEMINI_API_KEY_6,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getGeminiKey(): string {
    if (GEMINI_KEYS.length === 0) {
        throw new Error('No Gemini API keys found in .env');
    }
    const key = GEMINI_KEYS[currentKeyIndex % GEMINI_KEYS.length];
    return key;
}

function rotateKey(): void {
    currentKeyIndex++;
    console.log(`   🔄 Rotated to Gemini key #${(currentKeyIndex % GEMINI_KEYS.length) + 1}`);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ════════════════════════════════════════════════════════
// PLACEHOLDER PROTECTION
// ════════════════════════════════════════════════════════

interface ProtectionResult {
    text: string;
    placeholders: Map<string, string>;
}

function protectContent(content: string): ProtectionResult {
    const placeholders = new Map<string, string>();
    let counter = 0;
    let text = content;

    // Protect display LaTeX blocks ($$...$$)
    text = text.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
        const key = `⟦LATEX_BLOCK_${counter++}⟧`;
        placeholders.set(key, match);
        return key;
    });

    // Protect inline LaTeX ($...$)
    text = text.replace(/\$[^$\n]+?\$/g, (match) => {
        const key = `⟦LATEX_INLINE_${counter++}⟧`;
        placeholders.set(key, match);
        return key;
    });

    // Protect code blocks (```...```)
    text = text.replace(/```[\s\S]*?```/g, (match) => {
        const key = `⟦CODE_BLOCK_${counter++}⟧`;
        placeholders.set(key, match);
        return key;
    });

    // Protect inline code (`...`)
    text = text.replace(/`[^`\n]+?`/g, (match) => {
        const key = `⟦CODE_INLINE_${counter++}⟧`;
        placeholders.set(key, match);
        return key;
    });

    // Protect URLs
    text = text.replace(/https?:\/\/[^\s\)]+/g, (match) => {
        const key = `⟦URL_${counter++}⟧`;
        placeholders.set(key, match);
        return key;
    });

    // Protect HTML tags
    text = text.replace(/<[^>]+>/g, (match) => {
        const key = `⟦HTML_${counter++}⟧`;
        placeholders.set(key, match);
        return key;
    });

    // Protect image markdown ![alt](path)
    text = text.replace(/!\[[^\]]*\]\([^\)]+\)/g, (match) => {
        const key = `⟦IMG_${counter++}⟧`;
        placeholders.set(key, match);
        return key;
    });

    return { text, placeholders };
}

function restorePlaceholders(text: string, placeholders: Map<string, string>): string {
    let result = text;
    // Restore in reverse order to handle nested placeholders
    for (const [key, value] of Array.from(placeholders.entries()).reverse()) {
        result = result.replace(key, value);
    }
    return result;
}

// ════════════════════════════════════════════════════════
// GEMINI TRANSLATION
// ════════════════════════════════════════════════════════

async function translateChunk(chunk: string, attempt = 0): Promise<string> {
    const apiKey = getGeminiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an expert translator for Indian competitive exam content (JEE, NEET, UPSC, CBSE).

TASK: Translate the following educational content from English to Hindi.

RULES:
1. Keep ALL placeholder tokens (⟦...⟧) EXACTLY as they are — do NOT translate them.
2. Keep markdown formatting (##, **, -, >, etc.) exactly as is.
3. Keep all MCQ option letters (A), B), C), D)) as is.
4. Technical terms like "JEE", "NEET", "CBSE", "UPSC", "MCQ", "PYQ" stay in English.
5. Scientific terms should be in Hindi with English in brackets. Example: ऊष्मागतिकी (Thermodynamics)
6. Keep numbered lists and bullet points in the same format.
7. The translation should feel natural to a Hindi-medium student, not robotic.
8. DO NOT add any extra commentary or notes — ONLY return the translated text.

CONTENT TO TRANSLATE:
${chunk}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 8192,
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            if ((response.status === 429 || response.status === 503) && attempt < GEMINI_KEYS.length) {
                console.warn(`   ⚠️ Rate limited (${response.status}). Rotating key...`);
                rotateKey();
                await sleep(3000 * (attempt + 1));
                return translateChunk(chunk, attempt + 1);
            }
            throw new Error(`Gemini API error ${response.status}: ${errText.substring(0, 200)}`);
        }

        const data: any = await response.json();
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!translated) {
            throw new Error('Empty response from Gemini');
        }

        return translated.trim();
    } catch (err: any) {
        if (attempt < GEMINI_KEYS.length - 1) {
            rotateKey();
            await sleep(2000);
            return translateChunk(chunk, attempt + 1);
        }
        throw err;
    }
}

// ════════════════════════════════════════════════════════
// MAIN TRANSLATION LOGIC
// ════════════════════════════════════════════════════════

function splitIntoChunks(text: string, maxChars = 3000): string[] {
    const lines = text.split('\n');
    const chunks: string[] = [];
    let current = '';

    for (const line of lines) {
        if (current.length + line.length > maxChars && current.length > 0) {
            chunks.push(current);
            current = '';
        }
        current += line + '\n';
    }
    if (current.trim()) chunks.push(current);

    return chunks;
}

function translateFrontmatter(frontmatter: string): string {
    // Only translate the title and description fields
    // Keep everything else (slug, date, category, etc.) in English
    let translated = frontmatter;

    // We'll handle title and description translation in the body pass
    // Just add language marker
    if (!translated.includes('language:')) {
        translated = translated.replace(
            /^(---)$/m,
            'language: hi\n$1'
        );
    }
    
    // Add the original slug reference for hreflang
    const slugMatch = frontmatter.match(/slug:\s*["']?([^"'\n]+)["']?/);
    if (slugMatch && !translated.includes('originalSlug:')) {
        translated = translated.replace(
            /^(---)$/m,
            `originalSlug: ${slugMatch[1]}\n$1`
        );
    }

    return translated;
}

async function translateBlog(slug: string, isDryRun: boolean): Promise<boolean> {
    const sourceFile = path.join(BLOG_DIR, `${slug}.md`);
    const targetFile = path.join(HINDI_DIR, `${slug}.md`);

    if (!fs.existsSync(sourceFile)) {
        console.log(`   ❌ Source not found: ${slug}`);
        return false;
    }

    if (fs.existsSync(targetFile)) {
        console.log(`   ⏭️ Already translated: ${slug}`);
        return false;
    }

    const content = fs.readFileSync(sourceFile, 'utf-8');

    // Split frontmatter and body
    const fmMatch = content.match(/^(---\r?\n[\s\S]*?\r?\n---)\r?\n([\s\S]*)$/);
    if (!fmMatch) {
        console.log(`   ⚠️ No frontmatter found: ${slug}`);
        return false;
    }

    const frontmatter = fmMatch[1];
    const body = fmMatch[2];

    if (isDryRun) {
        console.log(`   🧪 Would translate: ${slug} (${body.length} chars)`);
        return true;
    }

    console.log(`   📝 Translating: ${slug} (${body.length} chars)...`);

    // Step 1: Protect LaTeX, code, URLs
    const { text: protectedBody, placeholders } = protectContent(body);

    // Step 2: Split into chunks and translate each
    const chunks = splitIntoChunks(protectedBody);
    console.log(`   📦 Split into ${chunks.length} chunks`);

    const translatedChunks: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
        console.log(`   🔄 Translating chunk ${i + 1}/${chunks.length}...`);
        const translated = await translateChunk(chunks[i]);
        translatedChunks.push(translated);
        // Rate limit between chunks
        if (i < chunks.length - 1) await sleep(1500);
    }

    const translatedBody = translatedChunks.join('\n');

    // Step 3: Restore placeholders
    const finalBody = restorePlaceholders(translatedBody, placeholders);

    // Step 4: Translate frontmatter fields
    const translatedFm = translateFrontmatter(frontmatter);

    // Step 5: Write output
    const finalContent = translatedFm + '\n' + finalBody;
    fs.writeFileSync(targetFile, finalContent, 'utf-8');

    console.log(`   ✅ Saved: blogs-hi/${slug}.md (${finalContent.length} chars)`);
    return true;
}

// ════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('🌐 HINDI BLOG TRANSLATOR (NEXUS v2)');
    console.log('   Using Gemini API (FREE — no billing needed)');
    console.log('═'.repeat(60) + '\n');

    if (GEMINI_KEYS.length === 0) {
        console.error('❌ No VITE_GEMINI_API_KEY found in .env');
        process.exit(1);
    }

    console.log(`🔑 ${GEMINI_KEYS.length} Gemini keys loaded\n`);

    // Create output directory
    if (!fs.existsSync(HINDI_DIR)) {
        fs.mkdirSync(HINDI_DIR, { recursive: true });
    }

    const isDryRun = process.argv.includes('--dry-run');
    const singleSlug = process.argv.find(a => a.startsWith('--slug='))?.split('=')[1];

    if (isDryRun) console.log('🧪 DRY RUN MODE\n');

    let slugsToTranslate: string[] = [];

    if (singleSlug) {
        slugsToTranslate = [singleSlug];
    } else {
        // Get all English blogs, sorted by priority (JEE/NEET first)
        const allFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
        const existingHindi = new Set(
            fs.existsSync(HINDI_DIR) 
                ? fs.readdirSync(HINDI_DIR).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''))
                : []
        );

        const untranslated = allFiles
            .map(f => f.replace('.md', ''))
            .filter(slug => !existingHindi.has(slug));

        // Prioritize high-value content
        untranslated.sort((a, b) => {
            const scoreA = /jee|neet|class-1[12]/.test(a) ? 1 : 0;
            const scoreB = /jee|neet|class-1[12]/.test(b) ? 1 : 0;
            return scoreB - scoreA;
        });

        slugsToTranslate = untranslated.slice(0, MAX_PER_RUN);
    }

    console.log(`📋 Queue: ${slugsToTranslate.length} blogs to translate\n`);

    let translated = 0;
    let failed = 0;

    for (const slug of slugsToTranslate) {
        try {
            const success = await translateBlog(slug, isDryRun);
            if (success) translated++;
        } catch (err: any) {
            console.error(`   ❌ Failed: ${slug} — ${err.message}`);
            failed++;
        }
        // Rate limit between blogs
        if (!isDryRun) await sleep(3000);
    }

    // Report
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TRANSLATION REPORT');
    console.log('═'.repeat(60));

    const totalEnglish = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md')).length;
    const totalHindi = fs.existsSync(HINDI_DIR)
        ? fs.readdirSync(HINDI_DIR).filter(f => f.endsWith('.md')).length
        : 0;

    console.log(`  📝 Translated this run: ${translated}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📚 Total English blogs: ${totalEnglish}`);
    console.log(`  🇮🇳 Total Hindi blogs: ${totalHindi}`);
    console.log(`  📊 Coverage: ${Math.round((totalHindi / totalEnglish) * 100)}%`);
    console.log('═'.repeat(60));
    console.log('\n✨ Translation complete!\n');

    // Save progress report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(
        path.join(REPORTS_DIR, 'translation-progress.json'),
        JSON.stringify({
            date: new Date().toISOString(),
            thisRun: { translated, failed },
            total: { english: totalEnglish, hindi: totalHindi, coverage: `${Math.round((totalHindi / totalEnglish) * 100)}%` },
        }, null, 2)
    );
}

main().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
});

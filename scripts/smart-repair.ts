/**
 * 🛡️ Smart Auto-Repair System (Feature 2.2)
 * 
 * Scans all blogs and automatically fixes quality issues:
 * 1. Detects missing mandatory sections (Trap Questions, Ayush's Note, Last 5 Min Box)
 * 2. Fixes broken LaTeX ($$...$$ without content, unescaped backslashes)
 * 3. Removes kill-list phrases
 * 4. Fixes broken internal links
 * 5. Repairs thin content sections
 * 6. Fixes duplicate headers
 * 7. Standardizes frontmatter
 * 
 * Run: npx tsx scripts/smart-repair.ts
 * Dry run: npx tsx scripts/smart-repair.ts --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const TODAY = new Date().toISOString().split('T')[0];

import Groq from 'groq-sdk';
import 'dotenv/config';
import { godSafeParse, godExtract, isRefusal } from './utils/god-json.ts';
import { sanitizeAiText, checkLatexIntegrity, normalizeMarkdownMCQs } from './utils/jules-quality.ts';
import { auditGrammar } from './utils/grammar-audit.ts';
import { extractTextFromImage } from './utils/ocr-tool.ts';
import { fetchWikiSummary, buildWikiCallout } from './utils/wikipedia-enricher.ts';
import { buildChemistryTable } from './utils/pubchem-verifier.ts';
import { findAcademicPapers, buildCitationSection } from './utils/openalex-citations.ts';
import { fetchExamNews, buildNewsBlock } from './utils/news-api.ts';
import { fetchSearchIntelligence, buildPAAContext } from './utils/serper-api.ts';

const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY,
    process.env.VITE_GROQ_API_KEY_2,
    process.env.VITE_GROQ_API_KEY_3,
    process.env.VITE_GROQ_API_KEY_4,
    process.env.VITE_GROQ_API_KEY_5,
    process.env.VITE_GROQ_API_KEY_6
].filter(Boolean) as string[];

const GEMINI_KEYS = [
    process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_BACKUP_KEY,
    process.env.VITE_GEMINI_API_KEY_2,
    process.env.VITE_GEMINI_API_KEY_3,
    process.env.VITE_GEMINI_API_KEY_4,
    process.env.VITE_GEMINI_API_KEY_5,
    process.env.VITE_GEMINI_API_KEY_6
].filter(Boolean) as string[];

let currentGroqIndex = 0;
let currentGeminiIndex = 0;
let groq = new Groq({ apiKey: GROQ_KEYS[0] });

const GROQ_COOLDOWNS = new Map<number, number>();
const GEMINI_COOLDOWNS = new Map<number, number>();
const GROQ_PERMANENT_DEAD = new Set<number>();
const GEMINI_PERMANENT_DEAD = new Set<number>();

function rotateGroqKey(isPermanent = false) {
    if (isPermanent) GROQ_PERMANENT_DEAD.add(currentGroqIndex);
    else GROQ_COOLDOWNS.set(currentGroqIndex, Date.now() + 2 * 60 * 1000); // 2 min timeout for errors

    const now = Date.now();
    const availableIndices = GROQ_KEYS.map((_, i) => i).filter(i => 
        !GROQ_PERMANENT_DEAD.has(i) && 
        (GROQ_COOLDOWNS.get(i) || 0) < now
    );
    
    if (availableIndices.length > 0) {
        currentGroqIndex = availableIndices[0];
        groq = new Groq({ apiKey: GROQ_KEYS[currentGroqIndex] });
        console.log(`🔄 Rotating to Groq Key #${currentGroqIndex + 1} (${isPermanent ? 'Permanent' : '2min Timeout'})...`);
        return true;
    } else {
        console.warn("⚠️ ALL GROQ KEYS EXHAUSTED OR IN COOLDOWN.");
        return false;
    }
}

/**
 * Polling strategy to check for key recovery every 2 minutes.
 * Total wait: 10 minutes (5 attempts).
 */
async function pollForAvailableKey(): Promise<boolean> {
    for (let i = 1; i <= 5; i++) {
        console.log(`📡 Polling for key recovery (Attempt ${i}/5)... Waiting 2 mins.`);
        await sleep(120000); // 2 minutes
        const now = Date.now();
        const available = GROQ_KEYS.map((_, idx) => idx).filter(idx => 
            !GROQ_PERMANENT_DEAD.has(idx) && (GROQ_COOLDOWNS.get(idx) || 0) < now
        );
        if (available.length > 0) {
            currentGroqIndex = available[0];
            groq = new Groq({ apiKey: GROQ_KEYS[currentGroqIndex] });
            console.log(`✅ Key Recovered: Groq Key #${currentGroqIndex + 1} is back online.`);
            return true;
        }
    }
    return false;
}

function rotateGeminiKey(isPermanent = false, cooldownMs = 1 * 60 * 1000) {
    if (isPermanent) GEMINI_PERMANENT_DEAD.add(currentGeminiIndex);
    else GEMINI_COOLDOWNS.set(currentGeminiIndex, Date.now() + cooldownMs);

    const now = Date.now();
    const availableIndices = GEMINI_KEYS.map((_, i) => i).filter(i => 
        !GEMINI_PERMANENT_DEAD.has(i) && 
        (GEMINI_COOLDOWNS.get(i) || 0) < now
    );
    
    if (availableIndices.length > 0) {
        currentGeminiIndex = availableIndices[0];
        console.log(`💎 Rotating to Gemini Key #${currentGeminiIndex + 1}...`);
        return true;
    } else {
        console.warn("🚨 ALL GEMINI KEYS EXHAUSTED OR IN COOLDOWN.");
        return false;
    }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function generateWithGemini(systemPrompt: string, userPrompt: string, isJson: boolean = false): Promise<string | null> {
    const now = Date.now();
    if ((GEMINI_COOLDOWNS.get(currentGeminiIndex) || 0) > now || GEMINI_PERMANENT_DEAD.has(currentGeminiIndex)) {
        rotateGeminiKey();
    }

    const key = GEMINI_KEYS[currentGeminiIndex];
    if (!key) return null;

    try {
        const generationConfig: any = { maxOutputTokens: 2500, temperature: 0.7 };
        if (isJson) generationConfig.responseMimeType = "application/json";

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
                generationConfig
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            let retryAfter = 60 * 1000;
            let isDaily = false;

            try {
                const errData = JSON.parse(errBody);
                const quotaFailure = errData.error?.details?.find((d: any) => d["@type"]?.includes("QuotaFailure"));
                const retryInfo = errData.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"));
                
                if (quotaFailure?.violations?.some((v: any) => v.quotaId?.includes("Day"))) isDaily = true;
                if (retryInfo?.retryDelay) retryAfter = parseInt(retryInfo.retryDelay.replace('s', '')) * 1000 + 2000;
            } catch { }

            console.error(`❌ Gemini Error (${response.status}) for Key #${currentGeminiIndex + 1}. Cooldown: ${Math.round(retryAfter/1000)}s`);
            rotateGeminiKey(isDaily, retryAfter);
            return null;
        }

        const data: any = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err: any) {
        console.error("❌ Gemini Network Error:", err.message);
        return null;
    }
}

async function generateWithGeminiRetry(systemPrompt: string, userPrompt: string, isJson: boolean = false): Promise<string | null> {
    const maxKeys = GEMINI_KEYS.length;
    for (let i = 0; i < maxKeys; i++) {
        const result = await generateWithGemini(systemPrompt, userPrompt, isJson);
        if (result) return result;
    }
    const now = Date.now();
    const cooldowns = GEMINI_KEYS.map((_, i) => ({ index: i, remaining: (GEMINI_COOLDOWNS.get(i) || 0) - now })).filter(c => !GEMINI_PERMANENT_DEAD.has(c.index));
    if (cooldowns.length > 0) {
        const shortest = cooldowns.sort((a, b) => a.remaining - b.remaining)[0];
        if (shortest.remaining > 0) {
            console.log(`⏳ ALL GEMINI KEYS BUSY. Waiting ${Math.round(shortest.remaining / 1000)}s for Key #${shortest.index + 1}...`);
            await sleep(shortest.remaining);
            currentGeminiIndex = shortest.index;
            return await generateWithGemini(systemPrompt, userPrompt, isJson);
        }
    }
    return null;
}

async function callLlm(system: string, user: string, attempt: number = 1): Promise<string | null> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        return completion.choices[0]?.message?.content || "";
    } catch (err: any) {
        const errMsg = (err.message || "").toLowerCase();
        
        // 1. Permanent Failures (401)
        if (errMsg.includes("401") || errMsg.includes("invalid_api_key")) {
            console.error(`❌ Groq Key #${currentGroqIndex + 1} INVALID (401). Marking permanent...`);
            rotateGroqKey(true);
            await sleep(2000);
            if (attempt <= GROQ_KEYS.length) {
                return await callLlm(system, user, attempt + 1);
            }
        }

        // 2. Temporary Failures (400, 429, 500, Timeout)
        if (errMsg.includes("429") || errMsg.includes("rate_limit") || errMsg.includes("400") || errMsg.includes("500") || errMsg.includes("timeout") || errMsg.includes("overloaded")) {
            console.warn(`⚠️ Groq Key #${currentGroqIndex + 1} Temporary Error (${errMsg.includes("429") ? "Rate Limit" : "Bad Request/Server"}).`);
            
            const rotated = rotateGroqKey(false);
            if (!rotated && attempt <= GROQ_KEYS.length) {
                // All keys are currently waiting - trigger Polling Mode
                const recovered = await pollForAvailableKey();
                if (recovered) return await callLlm(system, user, attempt);
            } else if (rotated) {
                await sleep(2000 * attempt); // Progressive safety delay
                return await callLlm(system, user, attempt + 1);
            }
            
            // 3. Fallback to Gemini
            console.log(`🛡️ Transitioning to Gemini fallback tier for repair generation...`);
            const geminiResult = await generateWithGeminiRetry(system, user);
            if (geminiResult) {
                console.log(`✅ Gemini repair content received.`);
                return geminiResult;
            }

            return null;
        }

        throw err;
    }
}

// Kill list from BLOG_RULES.md
const KILL_LIST = [
    "in conclusion", "delve into", "it is important to note",
    "world-best", "comprehensive guide", "ultimate guide",
    "embark on your journey", "needless to say", "master this today",
    "everything you need", "complete guide", "mastering this",
    "in today's competitive world", "vibrant", "robust", "unveiling",
    "embark on a journey", "one of the most important topics",
    "written with 10+ years experience", "master [topic] today",
    "it is worth noting", "as we navigate", "the landscape of",
    "in the realm of", "at the end of the day", "last but not least",
    "without further ado", "it goes without saying", "first and foremost",
    "plays a crucial role", "in a nutshell", "it is imperative",
    "in the ever-evolving", "in this day and age"
];

/**
 * Encodes a diagram string for Kroki.io (Deflate + Base64 Safe)
 */
function encodeKroki(diagram: string): string {
    const data = Buffer.from(diagram, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

interface RepairResult {
    slug: string;
    fixes: string[];
    warnings: string[];
    wasModified: boolean;
    isStrategicRefinement: boolean;
}

interface RegenItem {
    slug: string;
    reason: string;
}

function loadRegenQueue(): Record<string, string> {
    const queue: Record<string, string> = {};
    if (!fs.existsSync(REPORTS_DIR)) return queue;

    const files = fs.readdirSync(REPORTS_DIR).filter(f => f.startsWith('regen-queue-') && f.endsWith('.json'));
    for (const file of files) {
        try {
            const content = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, file), 'utf8'));
            if (Array.isArray(content)) {
                content.forEach((item: RegenItem) => {
                    queue[item.slug] = item.reason;
                });
            }
        } catch (e) {
            console.error(`⚠️ Failed to parse regen queue ${file}:`, e);
        }
    }
    return queue;
}

async function repairBlog(filePath: string, isDryRun: boolean, canUseAi: boolean, canUseGrammar: boolean = false, regenReason?: string): Promise<RepairResult> {
    const slug = path.basename(filePath, '.md');
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    const fixes: string[] = [];
    const warnings: string[] = [];
    let isStrategicRefinement = false;

    // Separate frontmatter and body
    const fmMatch = content.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    let frontmatter = fmMatch ? fmMatch[1] : '';
    let body = fmMatch ? fmMatch[2] : content;

    const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
    const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');

    // ========= NEXUS v2 FIX: Auto Table of Contents =========
    // Extracts all ## headings and injects a clickable anchor TOC after the first paragraph.
    // Zero API cost. Only runs if blog has 3+ headings and no TOC exists yet.
    const hasToc = body.includes('## Table of Contents') || body.includes('## 📑') || body.includes('<!-- toc -->');
    if (!hasToc) {
        const h2Matches = [...body.matchAll(/^##\s+(.+)$/gm)];
        if (h2Matches.length >= 3) {
            const tocLines = h2Matches.map((m, i) => {
                const heading = m[1].trim();
                // Generate a slug-safe anchor ID from heading text
                const anchor = heading.toLowerCase()
                    .replace(/[^\w\s-]/g, '') // Remove emoji and special chars
                    .replace(/\s+/g, '-')
                    .replace(/^-+|-+$/g, '');
                return `${i + 1}. [${heading}](#${anchor})`;
            });
            
            const tocBlock = `\n## 📑 Table of Contents\n\n${tocLines.join('\n')}\n\n---\n\n`;
            
            // Inject after the first paragraph or first heading
            const firstHeadingIdx = body.indexOf('\n## ');
            if (firstHeadingIdx > 0) {
                body = body.slice(0, firstHeadingIdx) + tocBlock + body.slice(firstHeadingIdx);
                fixes.push(`Injected auto Table of Contents (${h2Matches.length} sections)`);
            }
        }
    }

    // ========= STRATEGIC REFINEMENT (CTR/DECAY FIX) =========
    if (canUseAi && regenReason) {
        console.log(`🧬 STRATEGIC REFINEMENT: Deep-fixing ${slug}...`);
        console.log(`   Reason: ${regenReason}`);
        
        const refinement = await callLlm(
            "You are a Senior Academic SEO Strategist. Your goal is to rewrite the core content of an academic blog to fix performance issues (Low CTR, Stale Content). Keep the technical tone but make it more engaging and direct. Ensure all math is correctly formatted in LaTeX.",
            `Topic: ${title}\nReason for refinement: ${regenReason}\n\nExisting Content (Summary): ${body.substring(0, 500)}...\n\nRewrite the full body content to be more authoritative and high-impact. Return JSON: {"body": "full markdown content"}`
        );

        if (refinement) {
            const parsed = godSafeParse(refinement);
            if (parsed?.body && parsed.body.length > 300) {
                body = parsed.body;
                isStrategicRefinement = true;
                fixes.push(`Applied deep strategic refinement: ${regenReason}`);
            }
        }
    }

    // ========= FIX 0A: [object Object] Artifact Removal =========
    // Caused by LLM returning a JS object that gets stringified instead of serialized.
    // Safe to remove — '[object Object]' is never valid academic content.
    if (body.includes('[object Object]')) {
        const objectCount = (body.match(/\[object Object\]/g) || []).length;
        body = body.replace(/\[object Object\]/g, '');
        // Clean up lines that become empty after removal
        body = body.replace(/^\s*[-*]\s*\[?\s*\]?\s*$/gm, '');
        body = body.replace(/\n{3,}/g, '\n\n');
        fixes.push(`Removed ${objectCount} [object Object] artifacts`);
    }

    // ========= FIX 0B: Literal \n Escape Failure Repair =========
    // Caused by LLM returning '\\n' as text instead of actual newlines.
    // Only fix outside of code blocks to avoid corrupting code examples.
    const hasLiteralNewlines = body.includes('\\n') && !body.includes('```');
    if (hasLiteralNewlines) {
        // Count occurrences before fixing
        const nlCount = (body.match(/\\n/g) || []).length;
        body = body.replace(/\\n/g, '\n');
        body = body.replace(/\n{3,}/g, '\n\n');
        fixes.push(`Fixed ${nlCount} literal \\\\n escape sequences`);
    }

    // ========= FIX 0C: JSON Squashing Repair =========
    // Caused by LLM returning raw JSON in the body instead of rendered markdown.
    // Detects patterns like {"heading":"...","body":"..."} and extracts the body text.
    const jsonSquashRegex = /\{"heading"\s*:\s*"([^"]*?)"\s*,\s*"body"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"table"\s*:\s*\{[\s\S]*?\})?\s*\}/g;
    let jsonSquashMatch;
    let jsonSquashCount = 0;
    // Use a loop with exec to process each match
    const jsonSquashMatches: Array<{full: string, heading: string, bodyContent: string}> = [];
    while ((jsonSquashMatch = jsonSquashRegex.exec(body)) !== null) {
        jsonSquashMatches.push({
            full: jsonSquashMatch[0],
            heading: jsonSquashMatch[1],
            bodyContent: jsonSquashMatch[2]
        });
    }
    // Process in reverse to preserve string positions
    for (const match of jsonSquashMatches.reverse()) {
        // Unescape the body content: convert \\n to newlines, \\" to "
        let cleaned = match.bodyContent
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        // Add the heading as an H3 if it's meaningful
        const headingText = match.heading.trim();
        if (headingText && headingText.length > 2) {
            cleaned = `### ${headingText}\n\n${cleaned}`;
        }
        body = body.replace(match.full, cleaned);
        jsonSquashCount++;
    }
    if (jsonSquashCount > 0) {
        body = body.replace(/\n{3,}/g, '\n\n');
        fixes.push(`Extracted ${jsonSquashCount} JSON-squashed blocks into markdown`);
    }

    // ========= FIX 0D: Malformed [class] HTML Attribute Repair =========
    // Caused by LLM outputting Angular/React binding syntax like <div [class]="...">
    // in markdown. This is invalid HTML and breaks rendering.
    const malformedClassRegex = /<(\w+)\s+\[class\]="([^"]*)"([^>]*)>/g;
    if (malformedClassRegex.test(body)) {
        // Reset regex lastIndex after test
        malformedClassRegex.lastIndex = 0;
        let classFixCount = 0;
        body = body.replace(malformedClassRegex, (_match, tag, className, rest) => {
            classFixCount++;
            return `<${tag} class="${className}"${rest}>`;
        });
        if (classFixCount > 0) {
            fixes.push(`Fixed ${classFixCount} malformed [class] HTML attributes`);
        }
    }


    // ... [existing fixes 1-5 remain unchanged] ...

    // ========= FIX 16: LLM Truncation Marker Removal =========
    // Root Cause #1: LLM hit output token limit and emitted "(suggestion limit reached)".
    // This is NEVER valid content — safe to remove unconditionally.
    const slrCount = (body.match(/\(suggestion limit reached\)/g) || []).length;
    if (slrCount > 0) {
        body = body.replace(/\(suggestion limit reached\)/g, '');
        body = body.replace(/^[\s,\-*]*$/gm, ''); // Clean orphaned bullets
        body = body.replace(/\n{3,}/g, '\n\n');
        fixes.push(`Removed ${slrCount} "(suggestion limit reached)" truncation artifacts`);
    }

    // ========= FIX 17: Case-Mangled LaTeX Normalization =========
    // Root Cause #2: LLM outputs \fRAC instead of \frac, \tEXT instead of \text, etc.
    const KNOWN_COMMANDS: Record<string, string> = {
        'frac': 'frac', 'text': 'text', 'times': 'times', 'sqrt': 'sqrt',
        'sum': 'sum', 'int': 'int', 'prod': 'prod', 'alpha': 'alpha',
        'beta': 'beta', 'gamma': 'gamma', 'delta': 'delta', 'theta': 'theta',
        'pi': 'pi', 'sigma': 'sigma', 'omega': 'omega', 'lambda': 'lambda',
        'infty': 'infty', 'partial': 'partial', 'nabla': 'nabla',
        'cdot': 'cdot', 'ldots': 'ldots', 'leq': 'leq', 'geq': 'geq',
        'neq': 'neq', 'approx': 'approx', 'equiv': 'equiv', 'pm': 'pm',
        'left': 'left', 'right': 'right', 'overline': 'overline',
        'sin': 'sin', 'cos': 'cos', 'tan': 'tan', 'log': 'log', 'ln': 'ln',
        'lim': 'lim', 'boxed': 'boxed', 'mathrm': 'mathrm', 'binom': 'binom',
    };
    let caseFixCount = 0;
    body = body.replace(/\\([a-zA-Z]+)/g, (match, cmd) => {
        const lower = cmd.toLowerCase();
        if (KNOWN_COMMANDS[lower] && cmd !== KNOWN_COMMANDS[lower]) {
            caseFixCount++;
            return '\\' + KNOWN_COMMANDS[lower];
        }
        return match;
    });
    if (caseFixCount > 0) {
        fixes.push(`Case-normalized ${caseFixCount} LaTeX commands (e.g. \\fRAC → \\frac)`);
    }

    // ========= FIX 18: Naked LaTeX Wrapping =========
    // Root Cause #3: LaTeX commands like \frac{a}{b} render as plaintext without $...$ delimiters.
    let nakedWrapCount = 0;
    const nakedLines = body.split('\n');
    let inBlockMath = false;
    for (let li = 0; li < nakedLines.length; li++) {
        const line = nakedLines[li];
        if (/^\s*\$\$/.test(line)) { inBlockMath = !inBlockMath; continue; }
        if (inBlockMath || /^\s*\|/.test(line)) continue;
        
        const segs = line.split(/(\$[^$]*\$)/);
        let segModified = false;
        for (let si = 0; si < segs.length; si++) {
            if (si % 2 === 0) {
                const fixed = segs[si].replace(
                    /\\(frac|text|sqrt|overline|underline|vec|hat|bar|boxed|mathrm|mathbb|binom)(\{[^}]*\}(?:\{[^}]*\})*)/g,
                    (m) => { segModified = true; return '$' + m + '$'; }
                );
                if (fixed !== segs[si]) segs[si] = fixed;
            }
        }
        if (segModified) { nakedLines[li] = segs.join(''); nakedWrapCount++; }
    }
    if (nakedWrapCount > 0) {
        body = nakedLines.join('\n');
        fixes.push(`Wrapped naked LaTeX in ${nakedWrapCount} lines with $ delimiters`);
    }

    // ========= FIX 19: Heading Hallucination Fix =========
    // Root Cause #5: LLM outputs "Solved Yes" instead of "Solved PYQs".
    if (body.includes('Solved Yes')) {
        body = body.replace(/Solved Yes/g, 'Solved PYQs');
        fixes.push('Fixed heading hallucination: "Solved Yes" → "Solved PYQs"');
    }

    // ========= FIX 20: Multi-line JSON Squash Extraction =========
    // Root Cause #4: LLM returned raw JSON objects in the markdown body.
    const jsonBlockRegex = /\n\s*\{\s*\r?\n\s*"heading"\s*:\s*"([^"]*?)"\s*,\s*\r?\n\s*"body"\s*:\s*"/g;
    let jsonMatch;
    let jsonExtractCount = 0;
    while ((jsonMatch = jsonBlockRegex.exec(body)) !== null) {
        const blockStart = jsonMatch.index;
        let depth = 0;
        let blockEnd = -1;
        for (let c = blockStart + body.substring(blockStart).indexOf('{'); c < body.length; c++) {
            if (body[c] === '{') depth++;
            if (body[c] === '}') { depth--; if (depth === 0) { blockEnd = c + 1; break; } }
        }
        if (blockEnd > blockStart) {
            const fullBlock = body.substring(blockStart, blockEnd);
            const bodyExtract = fullBlock.match(/"body"\s*:\s*"([\s\S]*)/);
            if (bodyExtract) {
                let extracted = bodyExtract[1];
                const lastQuote = extracted.lastIndexOf('"');
                if (lastQuote >= 0) extracted = extracted.substring(0, lastQuote);
                extracted = extracted.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
                body = body.substring(0, blockStart) + '\n\n' + extracted + '\n\n' + body.substring(blockEnd);
                jsonExtractCount++;
                jsonBlockRegex.lastIndex = blockStart; // Reset since body changed
            }
        }
    }
    if (jsonExtractCount > 0) {
        body = body.replace(/\n{3,}/g, '\n\n');
        fixes.push(`Extracted ${jsonExtractCount} multi-line JSON-squash blocks into markdown`);
    }

    // ========= FIX 21: Standalone Naked Math Block Wrapping =========
    // Root Cause #6: LLM outputs entire equations on their own lines (like "f'(x) = \lim...") 
    // either completely naked or with fragmented inline $ wrappers.
    let standaloneMathFixCount = 0;
    const bodyLines = body.split('\n');
    let insideBlockMathFix = false;
    
    function isStandaloneMath(line: string): boolean {
        const bareLine = line.replace(/\$/g, '').trim();
        if (bareLine.length === 0 || line.includes('$$')) return false;
        if (!/(\\[a-zA-Z]+|=|f'\([a-zA-Z0-9]\)|[+\-*/^])/.test(bareLine)) return false;
        
        const withoutLatex = bareLine.replace(/\\[a-zA-Z]+/g, '');
        const words = withoutLatex.match(/[a-zA-Z]{3,}/g) || [];
        const proseWords = words.filter(w => !['sin', 'cos', 'tan', 'log', 'lim', 'max', 'min'].includes(w.toLowerCase()));
        
        if (proseWords.length > 1) return false; 
        
        if (/\\(lim|sin|cos|tan|frac|int|sum|prod|alpha|beta|gamma|theta|pi|infty|rightarrow)/.test(bareLine)) return true;
        if (bareLine.includes("f'(") || bareLine.startsWith("=")) return true;
        
        return false;
    }

    for (let li = 0; li < bodyLines.length; li++) {
        const line = bodyLines[li];
        if (/^\s*\$\$/.test(line)) { insideBlockMathFix = !insideBlockMathFix; continue; }
        if (insideBlockMathFix || /^\s*\|/.test(line) || /^#/.test(line) || (/^- /.test(line) && line.length > 50)) continue;
        
        if (isStandaloneMath(line)) {
            // Strip any fragmented inline $ and wrap the whole line as block math
            const cleanLine = line.replace(/\$/g, '').trim();
            // Preserve list marker if it exists
            const listMatch = line.match(/^(\s*[-*]\s+|\s*\d+\.\s+)/);
            if (listMatch) {
                bodyLines[li] = `${listMatch[1]}$$ ${cleanLine.substring(listMatch[1].length).trim()} $$`;
            } else {
                bodyLines[li] = `$$ ${cleanLine} $$`;
            }
            standaloneMathFixCount++;
        }
    }
    
    if (standaloneMathFixCount > 0) {
        body = bodyLines.join('\n');
        fixes.push(`Converted ${standaloneMathFixCount} fragmented standalone equations into block math`);
    }

    // ========= FIX 1: Kill List Phrase Removal =========
    let killCount = 0;
    for (const phrase of KILL_LIST) {
        const regex = new RegExp(phrase, 'gi');
        if (regex.test(body)) {
            body = body.replace(regex, '');
            killCount++;
        }
    }
    if (killCount > 0) {
        body = body.replace(/  +/g, ' ').replace(/\n{3,}/g, '\n\n');
        fixes.push(`Removed ${killCount} kill-list phrases`);
    }

    // ========= FIX 2: Broken LaTeX Repair =========
    const emptyLatex = body.match(/\$\$\s*\$\$/g);
    if (emptyLatex) {
        body = body.replace(/\$\$\s*\$\$/g, '');
        fixes.push(`Removed ${emptyLatex.length} empty LaTeX blocks`);
    }
    // ========= NEW: Advanced LaTeX Normalization =========
    const bodyBeforeLatex = body;
    body = checkLatexIntegrity(body);
    if (body !== bodyBeforeLatex) {
        fixes.push('Normalized advanced LaTeX formatting (wrapped raw blocks)');
    }

    // ========= FIX 4: Duplicate H2 Headers =========
    const h2s = body.match(/^## .+$/gm) || [];
    const seen = new Set<string>();
    for (const h2 of h2s) {
        const normalized = h2.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seen.has(normalized)) {
            const firstIndex = body.indexOf(h2);
            const secondIndex = body.indexOf(h2, firstIndex + h2.length);
            if (secondIndex > firstIndex) {
                body = body.substring(0, secondIndex) + body.substring(secondIndex + h2.length);
                fixes.push(`Removed duplicate H2: "${h2.substring(0, 40)}..."`);
            }
        }
        seen.add(normalized);
    }



    // ========= FIX 5: Kroki Diagram Enhancement =========
    // FIX: Collect ALL matches FIRST with matchAll(), THEN replace.
    // The old while+exec() loop was modifying `body` mid-iteration, causing
    // stale lastIndex and re-processing of Mermaid code inside <details> tags.
    const diagramMatches = [...body.matchAll(/```mermaid\s*([\s\S]*?)```/gi)];
    let diagCount = 0;
    // Iterate in REVERSE so string replacements don't shift earlier offsets
    for (const diagramMatch of [...diagramMatches].reverse()) {
        const originalBlock = diagramMatch[0];
        const diagramCode = diagramMatch[1].trim();
        
        if (diagramCode.length > 20) { // Only process significant diagrams
            const encoded = encodeKroki(diagramCode);
            const krokiUrl = `https://kroki.io/mermaid/svg/${encoded}`;
            
            // Skip if a Kroki link for this exact diagram already exists
            if (!body.includes(krokiUrl)) {
                // Inject SVG image ABOVE and keep the source in <details> for SEO/accessibility
                const replacement = `\n![Diagram Concept](${krokiUrl})\n\n<details>\n<summary>View Diagram Source</summary>\n\n${originalBlock}\n\n</details>\n`;
                body = body.replace(originalBlock, replacement);
                diagCount++;
            }
        }
    }
    if (diagCount > 0) {
        fixes.push(`Enhanced ${diagCount} diagrams with Kroki.io SVGs`);
    }

    // ========= FIX 6: ACTIVE SECTION REPAIR (AI-POWERED) =========
    const bodyLower = body.toLowerCase();
    
    if (canUseAi) {
        if (!/trap\s*questions?|mistakes?\s*that\s*cost/i.test(bodyLower)) {
            console.log(`🤖 Repairing missing "Trap Questions" for ${slug}...`);
            const repair = await callLlm(
                "You are an expert JEE/NEET teacher. Generate exactly 5 'Trap Questions' or 'Common Mistakes' for the given topic in revision format.",
                `Topic: ${title}. Format as bullet points. Return JSON: {"body": "markdown bullet points"}`
            );
            if (repair) {
                const parsed = godSafeParse(repair);
                if (parsed?.body) {
                    body += `\n\n## 🪤 The 5 Mistakes That Cost Marks\n\n${parsed.body}`;
                    fixes.push('Generated missing Trap Questions section');
                }
            }
        }
        
        if (!/last\s*5\s*minutes?\s*box/i.test(bodyLower)) {
            console.log(`🤖 Repairing missing "Last 5 Minutes Box" for ${slug}...`);
            const repair = await callLlm(
                "Generate a 'Last 5 Minutes Box' for revision. High-density facts/formulas only.",
                `Topic: ${title}. Return JSON: {"body": "markdown bullet points"}`
            );
            if (repair) {
                const parsed = godSafeParse(repair);
                if (parsed?.body) {
                    body += `\n\n## 🔁 Last 5 Minutes Box\n\n${parsed.body}`;
                    fixes.push('Generated missing Last 5 Minutes Box');
                }
            }
        }
    } else {
        // Fallback to passive warnings if out of AI quota
        if (!/trap\s*questions?|mistakes?\s*that\s*cost/i.test(bodyLower)) warnings.push('Missing "Trap Questions" section');
        if (!/last\s*5\s*minutes?\s*box/i.test(bodyLower)) warnings.push('Missing "Last 5 Minutes Box" section');
        if (!/practice\s*mcqs?|mcq/i.test(bodyLower)) warnings.push('Missing Practice MCQs section');
    }

    // ========= FIX 7: LanguageTool Academic Audit =========
    // ONLY runs if canUseGrammar=true (tied to repairLimit, capped at ~9 blogs/run)
    // This prevents 178 API calls/day and avoids LanguageTool rate limits (20 req/min)
    if (canUseGrammar && body.length > 100 && body.length < 75000) {
        const auditedBody: string = await auditGrammar(body);
        if (auditedBody && auditedBody !== body) {
            body = auditedBody;
            fixes.push('Applied LanguageTool academic grammar enhancements');
        }
    }

    // ========= FIX 8: OCR Context Extraction (Academic Intelligence) =========
    // FIX: Use matchAll() instead of exec() loop, and resolve multiple possible image paths.
    // Blog markdown uses /blog-images/ paths (verified from actual files).
    const imgMatches = [...body.matchAll(/!\[(.*?)\]\((.*?)\)/g)];
    for (const imgMatch of imgMatches) {
        const altText = imgMatch[1];
        const imgPath = imgMatch[2];
        
        // Only process local paths with generic or missing alt text
        if ((!altText || altText === 'Diagram' || altText === 'Image') && imgPath && !imgPath.startsWith('http')) {
            // Try multiple candidate paths — blog-images is the primary store
            const candidatePaths = [
                path.join(__dirname, '../public', imgPath),              // /public/blog-images/x.webp
                path.join(__dirname, '../public/blog-images', path.basename(imgPath)), // fallback by filename
                path.join(__dirname, '../public/assets/blogs', path.basename(imgPath)) // legacy
            ];
            const absoluteImgPath = candidatePaths.find(p => fs.existsSync(p));
            if (absoluteImgPath) {
                console.log(`👁️ OCR scanning image for context: ${imgPath}`);
                const extractedText = await extractTextFromImage(absoluteImgPath);
                if (extractedText && extractedText.length > 10) {
                    const cleanAlt = extractedText.substring(0, 50).replace(/\n/g, ' ') + '...';
                    body = body.replace(imgMatch[0], `![OCR Extract: ${cleanAlt}](${imgPath})`);
                    fixes.push(`Generated Alt-Text via OCR for ${imgPath}`);
                }
            }
        }
    }

    // ========= FIX 9: Wikipedia Verified Intro (Authority Signal) =========
    // Adds a verified Wikipedia callout after the first H2 heading to boost E-E-A-T.
    // Only runs on blogs being actively repaired (canUseGrammar gate).
    if (canUseGrammar && !body.includes('📖 **Wikipedia Says:**')) {
        const wikiSummary = await fetchWikiSummary(title);
        if (wikiSummary && wikiSummary.extract) {
            // Inject after the first H2 heading for natural placement
            const firstH2 = body.match(/^## .+$/m);
            if (firstH2) {
                const insertAt = body.indexOf(firstH2[0]) + firstH2[0].length;
                const callout = buildWikiCallout(wikiSummary);
                body = body.substring(0, insertAt) + callout + body.substring(insertAt);
                fixes.push(`Injected Wikipedia verified intro for: ${wikiSummary.title}`);
            }
        }
    }

    // ========= FIX 10: PubChem Chemistry Table (Science Verification) =========
    // For Chemistry blogs: inject a verified compound table from NIH PubChem.
    // Checks subject frontmatter to avoid running on non-chemistry content.
    const isChemistryBlog = /chemistry|chemical|organic|inorganic|compound|mol/i.test(frontmatter + title);
    if (canUseGrammar && isChemistryBlog && !body.includes('Chemical Quick Reference')) {
        const chemTable = await buildChemistryTable(body);
        if (chemTable) {
            // Inject before the footer/references section
            const footerMatch = body.indexOf('\n---\n');
            if (footerMatch !== -1) {
                body = body.substring(0, footerMatch) + chemTable + body.substring(footerMatch);
            } else {
                body += chemTable;
            }
            fixes.push('Injected PubChem verified chemistry reference table');
        }
    }

    // ========= FIX 11: OpenAlex Academic Citations (E-E-A-T Boost) =========
    // Adds a real peer-reviewed citations section from OpenAlex (250M+ papers).
    // Only for blogs that don't already have an Academic References section.
    if (canUseGrammar && !body.includes('## 📚 Academic References')) {
        const papers = await findAcademicPapers(title, 3);
        if (papers.length > 0) {
            const citationSection = buildCitationSection(papers);
            // Insert before the final footer
            const footerMatch = body.lastIndexOf('\n---\n');
            if (footerMatch !== -1) {
                body = body.substring(0, footerMatch) + citationSection + body.substring(footerMatch);
            } else {
                body += citationSection;
            }
            fixes.push(`Added ${papers.length} OpenAlex academic citations`);
        }
    }

    // ========= FIX 12: Live Exam Pulse Injection (Freshness Signal) =========
    // Scans for 'hot' exam topics (JEE, NEET, CBSE) and fetches recent headlines.
    const isHotTopic = /jee|neet|cbse|board|exam|result|registration|syllabus/i.test(title + slug);
    if (canUseGrammar && isHotTopic && !body.includes('Live Exam Pulse')) {
        const headlines = await fetchExamNews(title);
        if (headlines.length > 0) {
            const newsBlock = buildNewsBlock(headlines);
            // Append to bottom, just above the citations or footer
            const anchor = body.includes('## 📚 Academic References') ? '## 📚 Academic References' : '---';
            const splitIdx = body.lastIndexOf(anchor);
            if (splitIdx !== -1) {
                body = body.substring(0, splitIdx) + newsBlock + '\n\n' + body.substring(splitIdx);
            } else {
                body += newsBlock;
            }
            fixes.push(`Injected Live Exam Pulse with ${headlines.length} headlines`);
        }
    }

    // ========= FIX 13: SEO FAQ Enrichment (Serper.dev Intelligence) =========
    // Fetches real 'People Also Ask' from Google to generate grounded FAQs.
    // Only runs if the blog doesn't already have an FAQ section.
    if (canUseAi && !body.includes('Frequently Asked Questions') && !body.includes('## FAQ')) {
        console.log(`🕵️ SEO Scout: Fetching Google PAA intelligence for ${slug}...`);
        const intel = await fetchSearchIntelligence(title);
        if (intel && intel.peopleAlsoAsk.length > 0) {
            const paaContext = buildPAAContext(intel);
            const faqRepair = await callLlm(
                "You are an SEO expert. Generate a structured 'Frequently Asked Questions' section based on real Google 'People Also Ask' data. Keep answers crisp and academic.",
                `${paaContext}\nTopic: ${title}. Return JSON: {"body": "markdown faq section with h2"}`
            );
            if (faqRepair) {
                const parsed = godSafeParse(faqRepair);
                if (parsed?.body) {
                    // Inject before references/news
                    const anchor = body.includes('## 📡 Live Exam') ? '## 📡 Live Exam' : (body.includes('## 📚 Academic') ? '## 📚 Academic' : '---');
                    const splitIdx = body.lastIndexOf(anchor);
                    if (splitIdx !== -1) {
                        body = body.substring(0, splitIdx) + `\n\n${parsed.body}\n\n` + body.substring(splitIdx);
                    } else {
                        body += `\n\n${parsed.body}`;
                    }
                    fixes.push('Enriched blog with Google-grounded FAQ section');
                }
            }
        }
    }

    // ========= NEXUS v2 FIX 13.5: YouTube Video Enrichment =========
    // Embeds an educational video from a trusted YouTube channel.
    // Only runs if blog doesn't already have a video embed.
    const hasVideo = body.includes('youtube.com/embed') || body.includes('🎬 Watch');
    if (canUseGrammar && !hasVideo) {
        try {
            const { findYouTubeVideo, buildVideoEmbed, buildYouTubeSearchLink } = await import('./utils/youtube-enricher.ts');
            const subjectMatch = frontmatter.match(/category:\s*["']?(\w+)["']?/);
            const subject = subjectMatch ? subjectMatch[1] : 'Physics';
            
            const video = await findYouTubeVideo(title, subject);
            if (video) {
                const videoBlock = buildVideoEmbed(video);
                // Inject before the FAQ or references section
                const anchor = body.includes('## ❓') ? '## ❓' : (body.includes('## 📚 Academic') ? '## 📚 Academic' : '');
                if (anchor) {
                    const splitIdx = body.lastIndexOf(anchor);
                    if (splitIdx !== -1) {
                        body = body.substring(0, splitIdx) + videoBlock + body.substring(splitIdx);
                    }
                } else {
                    // Inject before the last horizontal rule (footer area)
                    const lastHr = body.lastIndexOf('\n---\n');
                    if (lastHr !== -1) {
                        body = body.substring(0, lastHr) + videoBlock + body.substring(lastHr);
                    } else {
                        body += videoBlock;
                    }
                }
                fixes.push(`Embedded YouTube video: "${video.title}" by ${video.channelTitle}`);
            } else if (!process.env.YOUTUBE_API_KEY) {
                // No API key: inject a search link instead (zero-cost fallback)
                const searchLink = buildYouTubeSearchLink(title);
                if (!body.includes('youtube.com/results')) {
                    const lastHr = body.lastIndexOf('\n---\n');
                    if (lastHr !== -1) {
                        body = body.substring(0, lastHr) + searchLink + body.substring(lastHr);
                    } else {
                        body += searchLink;
                    }
                    fixes.push('Added YouTube search link (no API key for embed)');
                }
            }
        } catch (ytErr: any) {
            // YouTube enrichment is best-effort — never crash the repair pipeline
            console.warn(`⚠️ YouTube enrichment skipped: ${ytErr.message}`);
        }
    }

    // ========= FIX 14: Deduplication & Empty Content Cleanup =========
    // 1. Remove duplicate "Related Topics" sections
    const relatedSectionRegex = /\n\n---\n\n## (📚 )?Related Topics[\s\S]*?(?=\n\n---\n\n##|$)/gi;
    const relatedMatches = [...body.matchAll(relatedSectionRegex)];
    if (relatedMatches.length > 1) {
        // Keep only the last match (usually the most updated) and remove others
        for (let i = 0; i < relatedMatches.length - 1; i++) {
            body = body.replace(relatedMatches[i][0], '');
        }
        fixes.push('Removed duplicate "Related Topics" sections');
    }

    // 2. Remove duplicate "curated by Jules" signatures
    const signatureRegex = /\n\s*---\s*\n\*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush\.\*/gi;
    const sigMatches = body.match(signatureRegex);
    if (sigMatches && sigMatches.length > 1) {
        let first = true;
        body = body.replace(signatureRegex, (match) => {
            if (first) { first = false; return match; }
            return "";
        });
        fixes.push(`Deduplicated Jules footers (removed ${sigMatches.length - 1} extras)`);
    }

    // 3. Clean up empty/broken LaTeX blocks like $$$$ or $ $
    const emptyLatexRegex = /\$\$\s*\$\$|\$\s*\$/g;
    if (emptyLatexRegex.test(body)) {
        body = body.replace(emptyLatexRegex, '');
        fixes.push('Cleaned up empty LaTeX blocks');
    }

    // ========= FIX 15: MCQ Formatting Normalizer =========
    const bodyBeforeMcq = body;
    body = normalizeMarkdownMCQs(body);
    if (body !== bodyBeforeMcq) {
        fixes.push('Repaired MCQ option formatting (ensured multi-line)');
    }

    // 4. Final Body Polish: Remove triple newlines
    body = body.replace(/\n{3,}/g, '\n\n');

    content = frontmatter + body;
    const wasModified = content !== originalContent;
    if (wasModified && !isDryRun) fs.writeFileSync(filePath, content, 'utf-8');
    return { slug, fixes, warnings, wasModified, isStrategicRefinement };
}

async function main() {
    console.log('\n🛡️ Smart Auto-Repair System v1.1 (ACTIVE MODE)');
    console.log('Scanning and actively fixing quality issues across all blogs...\n');

    const isDryRun = process.argv.includes('--dry-run');
    const limitArg = process.argv.find(a => a.startsWith('--limit='));
    const repairLimit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;
    
    if (isDryRun) console.log('🧪 DRY RUN MODE — No files will be modified.\n');
    console.log(`🔒 Active Repair Limit: ${repairLimit} blogs per run (to protect API quota).\n`);

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const allFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const files = allFiles.filter(f => {
        const classMatch = f.match(/class-(\d+)/);
        if (!classMatch) return true; // Include if class is unknown to be safe
        const classNum = parseInt(classMatch[1]);
        return classNum >= 8 && classNum <= 12;
    });
    console.log(`📂 Scanning ${files.length} blog files (filtered for Classes 8-12 from ${allFiles.length} total)...\n`);

    const results: RepairResult[] = [];
    let totalFixes = 0;
    let totalWarnings = 0;
    let aiRepairsPerformed = 0;

    const regenQueue = loadRegenQueue();
    if (Object.keys(regenQueue).length > 0) {
        console.log(`🎯 Strategic Refinement Queue active with ${Object.keys(regenQueue).length} blogs.\n`);
    }

    for (const file of files) {
        const slug = path.basename(file, '.md');
        const regenReason = regenQueue[slug];
        
        const canUseAi = aiRepairsPerformed < repairLimit;
        // Grammar audit now runs on ALL blogs — it's free (LanguageTool API) and
        // the new v2.0 auditor handles chunking + LaTeX protection automatically.
        const canUseGrammar = true;
        
        const result = await repairBlog(path.join(BLOG_DIR, file), isDryRun, canUseAi, canUseGrammar, regenReason);
        
        if (result.fixes.some(f => f.includes('Generated')) || result.isStrategicRefinement) {
            aiRepairsPerformed++;
        }

        results.push(result);
        totalFixes += result.fixes.length;
        totalWarnings += result.warnings.length;

        if (result.fixes.length > 0 || result.warnings.length > 0) {
            const icon = result.fixes.length > 0 ? '🔧' : '⚠️';
            console.log(`${icon} ${result.slug}`);
            result.fixes.forEach(f => console.log(`   ✅ ${f}`));
            result.warnings.forEach(w => console.log(`   ⚠️ ${w}`));
        }
    }

    // === SUMMARY ===
    const modified = results.filter(r => r.wasModified).length;
    const refined = results.filter(r => r.isStrategicRefinement).length;
    const withWarnings = results.filter(r => r.warnings.length > 0).length;
    const clean = results.filter(r => r.fixes.length === 0 && r.warnings.length === 0).length;

    console.log('\n' + '═'.repeat(60));
    console.log('📊 AUTO-REPAIR & REFINEMENT REPORT');
    console.log('═'.repeat(60));
    console.log(`  🚀 Deeply Refined:     ${refined}`);
    console.log(`  🔧 Files repaired:     ${modified - refined}`);
    console.log(`  ⚠️  Files with warnings: ${withWarnings}`);
    console.log(`  ✅ Clean files:         ${clean}`);
    console.log(`  📊 Total fixes applied: ${totalFixes}`);
    console.log(`  ⚠️  Total warnings:      ${totalWarnings}`);
    console.log('═'.repeat(60));

    // Save report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const reportPath = path.join(REPORTS_DIR, `repair-${TODAY}.json`);
    const report = {
        date: TODAY,
        summary: { modified, withWarnings, clean, totalFixes, totalWarnings },
        repairs: results.filter(r => r.fixes.length > 0 || r.warnings.length > 0)
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
    console.log('\n✨ Smart repair complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

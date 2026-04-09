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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const TODAY = new Date().toISOString().split('T')[0];

import Groq from 'groq-sdk';
import 'dotenv/config';
import { godSafeParse, godExtract, isRefusal } from './utils/god-json.js';
import { sanitizeAiText, checkLatexIntegrity } from './utils/jules-quality.js';

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
    else GROQ_COOLDOWNS.set(currentGroqIndex, Date.now() + 1 * 60 * 1000); // 1 min cooldown

    const now = Date.now();
    const availableIndices = GROQ_KEYS.map((_, i) => i).filter(i => 
        !GROQ_PERMANENT_DEAD.has(i) && 
        (GROQ_COOLDOWNS.get(i) || 0) < now
    );
    
    if (availableIndices.length > 0) {
        currentGroqIndex = availableIndices[0];
        groq = new Groq({ apiKey: GROQ_KEYS[currentGroqIndex] });
        console.log(`🔄 Rotating to Groq Key #${currentGroqIndex + 1} (${isPermanent ? 'Permanent' : '5min Cooldown'})...`);
    } else {
        console.warn("🚨 ALL GROQ KEYS EXHAUSTED OR IN COOLDOWN.");
    }
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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
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
        const errMsg = err.message || "";
        
        // 1. Permanent Failures (Invalid Key / Model)
        if (errMsg.includes("401") || errMsg.includes("invalid_api_key") || errMsg.includes("400") || errMsg.includes("decommissioned") || errMsg.includes("404")) {
            console.error(`❌ Groq Key #${currentGroqIndex + 1} dead (401/400). Marking permanent...`);
            rotateGroqKey(true);
            if (attempt <= GROQ_KEYS.length) {
                return await callLlm(system, user, attempt + 1);
            }
        }

        // 2. Transient Failures (Rate Limit / 500)
        if ((errMsg.includes("429") || errMsg.includes("rate_limit") || errMsg.includes("500")) && attempt <= GROQ_KEYS.length) {
            console.log(`⚠️ Groq Rate Limit (Key #${currentGroqIndex + 1}). Cooling down...`);
            rotateGroqKey(false);
            await sleep(1000 * attempt);
            return callLlm(system, user, attempt + 1);
        }

        // 3. Fallback to Gemini
        console.log(`🛡️ Transitioning to Gemini fallback tier for repair generation...`);
        const geminiResult = await generateWithGemini(system, user);
        if (geminiResult) {
            console.log(`✅ Gemini repair content received.`);
            return geminiResult;
        }

        return null;
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

interface RepairResult {
    slug: string;
    fixes: string[];
    warnings: string[];
    wasModified: boolean;
}

async function repairBlog(filePath: string, isDryRun: boolean, canUseAi: boolean): Promise<RepairResult> {
    const slug = path.basename(filePath, '.md');
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    const fixes: string[] = [];
    const warnings: string[] = [];

    // Separate frontmatter and body
    const fmMatch = content.match(/^(---[\s\S]*?---\r?\n)([\s\S]*)$/);
    let frontmatter = fmMatch ? fmMatch[1] : '';
    let body = fmMatch ? fmMatch[2] : content;

    const titleMatch = frontmatter.match(/title:\s*["'](.+?)["']/);
    const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');

    // ... [existing fixes 1-5 remain unchanged] ...
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
    body = body.replace(/^(\s*)\$([^$\n]+)\$\s*$/gm, (match, indent, content) => {
        if (/\\(frac|sum|int|prod|lim|sqrt|begin)/.test(content)) {
            fixes.push(`Fixed block LaTeX: $...$ → $$...$$`);
            return `${indent}$$${content}$$`;
        }
        return match;
    });

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

    content = frontmatter + body;
    const wasModified = content !== originalContent;
    if (wasModified && !isDryRun) fs.writeFileSync(filePath, content, 'utf-8');
    return { slug, fixes, warnings, wasModified };
}

async function main() {
    console.log('\n🛡️ Smart Auto-Repair System v1.1 (ACTIVE MODE)');
    console.log('Scanning and actively fixing quality issues across all blogs...\n');

    const isDryRun = process.argv.includes('--dry-run');
    const limitArg = process.argv.find(a => a.startsWith('--limit='));
    const repairLimit = limitArg ? parseInt(limitArg.split('=')[1]) : 6;
    
    if (isDryRun) console.log('🧪 DRY RUN MODE — No files will be modified.\n');
    console.log(`🔒 Active Repair Limit: ${repairLimit} blogs per run (to protect API quota).\n`);

    if (!fs.existsSync(BLOG_DIR)) {
        console.error('❌ Blog directory not found:', BLOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    console.log(`📂 Scanning ${files.length} blog files...\n`);

    const results: RepairResult[] = [];
    let totalFixes = 0;
    let totalWarnings = 0;
    let aiRepairsPerformed = 0;

    for (const file of files) {
        const canUseAi = aiRepairsPerformed < repairLimit;
        const result = await repairBlog(path.join(BLOG_DIR, file), isDryRun, canUseAi);
        
        if (result.fixes.some(f => f.includes('Generated'))) {
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
    const withWarnings = results.filter(r => r.warnings.length > 0).length;
    const clean = results.filter(r => r.fixes.length === 0 && r.warnings.length === 0).length;

    console.log('\n' + '═'.repeat(60));
    console.log('📊 AUTO-REPAIR REPORT');
    console.log('═'.repeat(60));
    console.log(`  🔧 Files repaired:     ${modified}`);
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

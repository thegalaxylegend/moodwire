/**
 * 🧬 Prompt Evolution Engine (Module 7.1 + 4.4)
 * 
 * THE BRAIN of the self-improving system.
 * 
 * This script reads ALL intelligence sources:
 *   - content-patterns.json  → structural DNA of successful blogs
 *   - quality-trends.json    → pass rates, score trends
 *   - ga4-stats.json         → which pages get the most traffic
 *   - search-intelligence.json → which pages rank highest on Google
 *   - generation-strategy.json → lessons from past failures
 *   - lessons-learned.json     → specific failure patterns
 * 
 * Then uses Gemini to synthesize a NEW, evolved system prompt that:
 *   - Matches the structural patterns of top-performing content
 *   - Avoids the patterns that caused failures
 *   - Adjusts temperature, word count, and style per subject
 * 
 * Output: jules-reports/evolved-prompt.json
 * 
 * Run: npx tsx scripts/prompt-evolution.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import { godSafeParse } from './utils/god-json.js';
import dotenv from 'dotenv';
import { 
    hasAyushNoteRegex, 
    hasMistakesRegex, 
    hasPyqsRegex, 
    hasFormulaBankRegex 
} from './utils/jules-quality.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const PUBLIC_REPORTS = path.join(__dirname, '../public/jules-reports');
const EVOLVED_PROMPT_FILE = path.join(REPORTS_DIR, 'evolved-prompt.json');
const PROMPT_HISTORY_DIR = path.join(REPORTS_DIR, 'prompt-history');

// Initialize Groq (the "meta-brain" that evolves prompts)
const GROQ_KEYS = [
    process.env.GROQ_API_KEY,
    process.env.VITE_GROQ_API_KEY_2,
    process.env.VITE_GROQ_API_KEY_3,
    process.env.VITE_GROQ_API_KEY_4,
    process.env.VITE_GROQ_API_KEY_5,
    process.env.VITE_GROQ_API_KEY_6
].filter(Boolean) as string[];

let currentGroqKeyIndex = 0;
let groq = new Groq({ apiKey: GROQ_KEYS[0] });

function rotateGroqKey() {
    currentGroqKeyIndex = (currentGroqKeyIndex + 1) % GROQ_KEYS.length;
    groq = new Groq({ apiKey: GROQ_KEYS[currentGroqKeyIndex] });
    console.log(`🔄 Rotating to Groq Key #${currentGroqKeyIndex + 1}...`);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ════════════════════════════════════════════════════════
// DATA LOADERS — Read all intelligence sources
// ════════════════════════════════════════════════════════

interface IntelligenceReport {
    contentPatterns: any | null;
    qualityTrends: any | null;
    ga4Stats: any | null;
    searchIntelligence: any | null;
    generationStrategy: any | null;
    lessonsLearned: any[] | null;
    currentPrompt: string;
}

function loadJSON(filePath: string): any | null {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch { /* corrupted file, skip */ }
    return null;
}

function gatherIntelligence(): IntelligenceReport {
    console.log('📡 Gathering intelligence from all sources...\n');

    const report: IntelligenceReport = {
        contentPatterns: loadJSON(path.join(REPORTS_DIR, 'content-patterns.json')),
        qualityTrends: loadJSON(path.join(REPORTS_DIR, 'quality-trends.json')),
        ga4Stats: loadJSON(path.join(PUBLIC_REPORTS, 'ga4-stats.json')),
        searchIntelligence: loadJSON(path.join(PUBLIC_REPORTS, 'search-intelligence.json')),
        generationStrategy: loadJSON(path.join(REPORTS_DIR, 'generation-strategy.json')),
        lessonsLearned: loadJSON(path.join(REPORTS_DIR, 'lessons-learned.json')),
        currentPrompt: getCurrentPrompt()
    };

    const sources = [
        ['Content Patterns', report.contentPatterns],
        ['Quality Trends', report.qualityTrends],
        ['GA4 Traffic Data', report.ga4Stats],
        ['Search Intelligence', report.searchIntelligence],
        ['Generation Strategy', report.generationStrategy],
        ['Lessons Learned', report.lessonsLearned],
    ];

    for (const [name, data] of sources) {
        const status = data ? '✅' : '⚪';
        console.log(`  ${status} ${name}`);
    }
    console.log('');

    return report;
}

function getCurrentPrompt(): string {
    // Extract the current hardcoded system prompt from blog-generator.ts
    try {
        const generatorPath = path.join(__dirname, 'blog-generator.ts');
        const content = fs.readFileSync(generatorPath, 'utf-8');
        const match = content.match(/SYSTEM_PROMPT_CORE\s*=\s*`([\s\S]*?)`;/);
        if (match) return match[1].trim();
    } catch { /* ignore */ }

    return `You are a JEE/NEET exam preparation blog writer.
Focus on high-yield exam content with bullet points, formulas, and MCQs.
Voice: Authentic Peer Mentor (student-to-student).
FORMATTING: NEVER WRITE LONG PARAGRAPHS. Use bullet points for almost everything.`;
}

// ════════════════════════════════════════════════════════
// INTELLIGENCE SYNTHESIS — Extract actionable insights
// ════════════════════════════════════════════════════════

interface EvolutionInsights {
    topPerformingPatterns: string;
    failurePatterns: string;
    trafficInsights: string;
    searchInsights: string;
    qualityTrend: string;
    subjectSpecificGuidance: string;
}

function synthesizeInsights(intel: IntelligenceReport): EvolutionInsights {
    console.log('🧪 Synthesizing intelligence into actionable insights...\n');

    // 1. Top-performing content patterns
    let topPerformingPatterns = 'No content pattern data available.';
    if (intel.contentPatterns?.patterns) {
        const patterns = intel.contentPatterns.patterns;
        topPerformingPatterns = patterns.map((p: any) =>
            `${p.subject}: avg ${p.avgWordCount} words, ${p.avgH2} H2s, ${p.avgH3} H3s, ${p.avgFormulas} formulas, ${p.avgMCQs} MCQs, ${p.avgBullets} bullets, style=${p.idealTemplate?.bulletRatio || 'unknown'}`
        ).join('\n');
    }

    // 2. Failure patterns from autopsy
    let failurePatterns = 'No failure data available.';
    if (intel.generationStrategy?.adjustments?.length > 0) {
        failurePatterns = intel.generationStrategy.adjustments
            .map((a: any) => `RULE: ${a.rule} (Reason: ${a.reason})`)
            .join('\n');
    }
    if (intel.lessonsLearned?.length) {
        const typeCounts = new Map<string, number>();
        intel.lessonsLearned.forEach((l: any) => 
            typeCounts.set(l.failureType, (typeCounts.get(l.failureType) || 0) + 1));
        const topFailures = Array.from(typeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => `${type}: ${count} occurrences`)
            .join('\n');
        failurePatterns += '\n\nTop Failure Types:\n' + topFailures;
    }

    // 3. Traffic insights from GA4
    let trafficInsights = 'No GA4 data available.';
    if (intel.ga4Stats) {
        const totals = intel.ga4Stats.totals;
        trafficInsights = `Active Users: ${totals?.activeUsers || 0}, Sessions: ${totals?.sessions || 0}, Pageviews: ${totals?.pageviews || 0}, Avg Engagement: ${totals?.avgEngagementTime || 0}s`;
        
        if (intel.ga4Stats.topPages?.length > 0) {
            const topPages = intel.ga4Stats.topPages.slice(0, 5)
                .map((p: any) => `${p.page}: ${p.views} views`)
                .join(', ');
            trafficInsights += `\nTop 5 pages by traffic: ${topPages}`;
        }

        if (intel.ga4Stats.devices?.length > 0) {
            const deviceBreakdown = intel.ga4Stats.devices
                .map((d: any) => `${d.category}: ${d.users} users`)
                .join(', ');
            trafficInsights += `\nDevice breakdown: ${deviceBreakdown}`;
        }
    }

    // 4. Search insights from GSC
    let searchInsights = 'No search data available.';
    if (intel.searchIntelligence?.globalTopKeywords?.length > 0) {
        searchInsights = 'Top ranking keywords: ' + 
            intel.searchIntelligence.globalTopKeywords.slice(0, 10)
                .map((kw: any) => `"${kw.query}" (${kw.impressions} impr, ${kw.clicks} clicks)`)
                .join(', ');
    }

    // 5. Quality trend
    let qualityTrend = 'No quality data available.';
    if (intel.qualityTrends) {
        qualityTrend = `Trend: ${intel.qualityTrends.trend} (delta: ${intel.qualityTrends.trendDelta}), Overall avg: ${intel.qualityTrends.overallAvgScore}/100, Pass rate: ${intel.qualityTrends.overallPassRate}%`;
    }

    // 6. Subject-specific guidance
    let subjectSpecificGuidance = '';
    if (intel.contentPatterns?.patterns) {
        for (const p of intel.contentPatterns.patterns) {
            const template = p.idealTemplate;
            if (template) {
                subjectSpecificGuidance += `\n${p.subject}: Target ${template.wordCountRange[0]}-${template.wordCountRange[1]} words, ${template.headingCount[0]}-${template.headingCount[1]} H2 headings, formula density=${template.formulaDensity}, MCQs=${template.mcqCount[0]}-${template.mcqCount[1]}, style=${template.bulletRatio}`;
            }
        }
    }

    return {
        topPerformingPatterns,
        failurePatterns,
        trafficInsights,
        searchInsights,
        qualityTrend,
        subjectSpecificGuidance
    };
}

// ════════════════════════════════════════════════════════
// PROMPT EVOLUTION — Use Gemini to evolve the prompt
// ════════════════════════════════════════════════════════

async function evolvePrompt(currentPrompt: string, insights: EvolutionInsights, attempt: number = 1): Promise<any> {
    console.log(`🧬 Evolving system prompt using Gemini meta-cognition (Attempt ${attempt})...\n`);

    const metaPrompt = `You are a Prompt Engineering Grandmaster. Your job is to EVOLVE a system prompt for an AI blog generator.

## CURRENT SYSTEM PROMPT (to evolve):
\`\`\`
${currentPrompt}
\`\`\`

## INTELLIGENCE DATA (from real production analytics):

### Content Patterns of Successful Blogs:
${insights.topPerformingPatterns}

### Failure Patterns to Avoid:
${insights.failurePatterns}

### Real Traffic Data (GA4):
${insights.trafficInsights}

### Google Search Performance:
${insights.searchInsights}

### Quality Trend:
${insights.qualityTrend}

### Subject-Specific Optimal Structures:
${insights.subjectSpecificGuidance}

## YOUR TASK:

Evolve the system prompt to produce BETTER content. Specifically:

1. **KEEP** what's working (the voice, formatting rules, exam focus)
2. **ADD** structural targets based on the winning patterns (word count, heading count, formula density per subject)
3. **ADD** anti-patterns from failure data as explicit "NEVER DO" rules
4. **ADJUST** the tone/depth based on what drives traffic
5. **ADD** a section for search-optimized writing (use the top-ranking keywords as context)
6. **MAINTAIN** all LaTeX escaping rules exactly as they are

Output ONLY a strict, valid JSON object.
CRITICAL JSON RULES:
1. ONLY use double quotes (") for strings. NEVER use backticks (\`).
2. You MUST escape all newlines within strings as \\n.

{
  "evolvedPrompt": "The complete new system prompt text (ready to use as-is) with escaped \\n newlines",
  "temperature": 0.7,
  "subjectTargets": {
    "Physics": { "minWords": 2000, "maxWords": 4000, "formulaDensity": "high", "mcqCount": 5 },
    "Chemistry": { "minWords": 2000, "maxWords": 3500, "formulaDensity": "medium", "mcqCount": 5 },
    "Biology": { "minWords": 2500, "maxWords": 4000, "formulaDensity": "low", "mcqCount": 5 },
    "Mathematics": { "minWords": 2000, "maxWords": 3500, "formulaDensity": "high", "mcqCount": 5 }
  },
  "changelog": ["List of specific changes you made and why"],
  "confidence": 0.85
}

CRITICAL: The evolved prompt must be BETTER than the original. Don't just rephrase — ADD value based on the data.`;

    try {
        const result = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: metaPrompt }],
            temperature: 0.7,
            max_tokens: 6000,
            response_format: { type: "json_object" }
        });

        let evolved;
        try {
            const responseText = result.choices[0]?.message?.content?.trim() || "";
            
            // Aggressive pre-cleaning to handle LLM unescaped newlines inside JSON
            let cleanedJson = responseText.replace(/```json|```/g, '').trim();
            
            const firstBrace = cleanedJson.indexOf('{');
            const lastBrace = cleanedJson.lastIndexOf('}');
            if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON braces found in response.");
            
            cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
            evolved = godSafeParse(cleanedJson);
            
            if (!evolved || !evolved.evolvedPrompt) {
                throw new Error("Invalid structure in evolved prompt JSON.");
            }
        } catch (parseError: any) {
            console.warn(`⚠️ JSON Parse failed: ${parseError.message}. Attempting aggressive regex extraction...`);
            
            const responseText = result.choices[0]?.message?.content || "";
            // Aggressively match anything between "evolvedPrompt": " and the next unescaped quote followed by comma/brace
            const promptMatch = responseText.match(/"evolvedPrompt"\s*:\s*"(.*?)(?="(?:(?:\s*,)|(?:\s*\})))/s);
            
            if (!promptMatch) throw new Error('Failed to extract evolvedPrompt via regex completely');
            
            let extractedPrompt = promptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            
            evolved = {
                evolvedPrompt: extractedPrompt,
                temperature: 0.7,
                confidence: 0.1,
                changelog: ["Rescued from broken JSON via aggressive regex"]
            };
        }

        // Validate structure
        if (!evolved.evolvedPrompt || evolved.evolvedPrompt.length < 100) {
            throw new Error('Evolved prompt is too short or missing');
        }

        return evolved;
    } catch (err: any) {
        console.error(`❌ Prompt evolution failed on key #${currentGroqKeyIndex + 1}:`, err.message);
        
        if ((err.message.includes("429") || err.message.includes("rate_limit") || err.message.includes("503")) && attempt < GROQ_KEYS.length) {
            rotateGroqKey();
            await sleep(2000 * attempt);
            return evolvePrompt(currentPrompt, insights, attempt + 1);
        }
        
        // ULTIMATE FALLBACK: 100% guarantee an update is returned
        console.warn('⚠️ All API attempts failed. Returning fallback augmented prompt to guarantee 100% update.');
        return {
            evolvedPrompt: currentPrompt + "\n\n// ⚡ EVOLVED VIA FALLBACK: Prioritize bullet points, PYQs, and Trap questions rigorously. Avoid paragraphs.",
            temperature: 0.7,
            confidence: 0.0,
            changelog: ["Forced ultimate fallback evolution due to catastrophic API failure"]
        };
    }
}

// ════════════════════════════════════════════════════════
// VERSION CONTROL — Keep prompt history for rollback
// ════════════════════════════════════════════════════════

function saveWithHistory(evolved: any): void {
    // Ensure directories exist
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    if (!fs.existsSync(PROMPT_HISTORY_DIR)) fs.mkdirSync(PROMPT_HISTORY_DIR, { recursive: true });

    // Archive current version before overwriting
    if (fs.existsSync(EVOLVED_PROMPT_FILE)) {
        const current = loadJSON(EVOLVED_PROMPT_FILE);
        if (current) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archivePath = path.join(PROMPT_HISTORY_DIR, `prompt-${timestamp}.json`);
            fs.writeFileSync(archivePath, JSON.stringify(current, null, 2));
        }
    }

    // Clean old history (keep last 10)
    const historyFiles = fs.readdirSync(PROMPT_HISTORY_DIR)
        .filter(f => f.startsWith('prompt-') && f.endsWith('.json'))
        .sort()
        .reverse();
    
    for (let i = 10; i < historyFiles.length; i++) {
        fs.unlinkSync(path.join(PROMPT_HISTORY_DIR, historyFiles[i]));
    }

    // Save new evolved prompt
    const output = {
        version: new Date().toISOString(),
        generatedBy: 'prompt-evolution-engine-v1.0',
        ...evolved,
        metadata: {
            sourcesUsed: {
                contentPatterns: fs.existsSync(path.join(REPORTS_DIR, 'content-patterns.json')),
                qualityTrends: fs.existsSync(path.join(REPORTS_DIR, 'quality-trends.json')),
                ga4Stats: fs.existsSync(path.join(PUBLIC_REPORTS, 'ga4-stats.json')),
                searchIntelligence: fs.existsSync(path.join(PUBLIC_REPORTS, 'search-intelligence.json')),
                generationStrategy: fs.existsSync(path.join(REPORTS_DIR, 'generation-strategy.json')),
                lessonsLearned: fs.existsSync(path.join(REPORTS_DIR, 'lessons-learned.json'))
            }
        }
    };

    fs.writeFileSync(EVOLVED_PROMPT_FILE, JSON.stringify(output, null, 2));
    
    // Also save to public for dashboard
    if (!fs.existsSync(PUBLIC_REPORTS)) fs.mkdirSync(PUBLIC_REPORTS, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC_REPORTS, 'evolved-prompt.json'), JSON.stringify(output, null, 2));
}

// ════════════════════════════════════════════════════════
// SAFETY CHECK — Auto-revert if quality drops
// ════════════════════════════════════════════════════════

function shouldRevert(): boolean {
    const trends = loadJSON(path.join(REPORTS_DIR, 'quality-trends.json'));
    const ga4Data = loadJSON(path.join(PUBLIC_REPORTS, 'ga4-stats.json'));
    const evolved = loadJSON(EVOLVED_PROMPT_FILE);
    
    if (!evolved || !evolved.version) return false;
    
    const evolvedDate = new Date(evolved.version);
    const daysSinceEvolution = (Date.now() - evolvedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Only check reverts for prompts changed in the last 14 days
    if (daysSinceEvolution > 14) return false;
    
    let shouldRevertNow = false;
    const reasons: string[] = [];
    
    // Check 1: Quality score declining below 70
    if (trends && trends.trend === 'declining' && trends.overallAvgScore < 70) {
        reasons.push(`Quality declining (${trends.overallAvgScore}/100)`);
        shouldRevertNow = true;
    }
    
    // Check 2: High failure rate (>40% blogs failing)
    if (trends && trends.overallPassRate !== undefined && trends.overallPassRate < 60) {
        reasons.push(`High failure rate (pass rate: ${trends.overallPassRate}%)`);
        shouldRevertNow = true;
    }
    
    // Check 3: Traffic-based reversion (if GA4 data available)
    if (ga4Data && ga4Data.totals) {
        const avgViewsPerPage = (ga4Data.totals.pageviews || 0) / Math.max(1, ga4Data.topPages?.length || 1);
        // If average views per page dropped below 5 (extremely low), something is wrong
        if (avgViewsPerPage < 5 && daysSinceEvolution < 7) {
            reasons.push(`Traffic collapse (avg ${avgViewsPerPage.toFixed(1)} views/page)`);
            shouldRevertNow = true;
        }
    }
    
    if (shouldRevertNow) {
        console.log('🚨 SAFETY TRIGGERS DETECTED:');
        reasons.forEach(r => console.log(`   ⚠️ ${r}`));
        console.log(`   📅 Evolved prompt age: ${daysSinceEvolution.toFixed(1)} days`);
        
        // Find and restore the most recent history file
        if (fs.existsSync(PROMPT_HISTORY_DIR)) {
            const historyFiles = fs.readdirSync(PROMPT_HISTORY_DIR)
                .filter(f => f.startsWith('prompt-') && f.endsWith('.json'))
                .sort()
                .reverse();
            
            if (historyFiles.length > 0) {
                const previousPrompt = loadJSON(path.join(PROMPT_HISTORY_DIR, historyFiles[0]));
                if (previousPrompt) {
                    fs.writeFileSync(EVOLVED_PROMPT_FILE, JSON.stringify(previousPrompt, null, 2));
                    console.log('✅ REVERTED to previous prompt version.');
                    console.log(`   📄 Restored from: ${historyFiles[0]}`);
                    return true;
                }
            }
        }
        
        console.log('⚠️ No history file found to revert to. Continuing with current prompt.');
    }
    
    return false;
}

function baselineValidator(): boolean {
    console.log('🧪 Running Baseline Validator on recent content...');
    
    const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
    const AUDIT_LOG = path.join(REPORTS_DIR, 'prompt-evolution-audit.log');
    
    if (!fs.existsSync(BLOG_DIR)) return true; // Nothing to check
    
    const files = fs.readdirSync(BLOG_DIR)
        .filter(f => f.endsWith('.md'))
        .map(file => {
            const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
            const match = content.match(/date:\s*["']?([^"'\n]+)["']?/);
            const time = match ? new Date(match[1]).getTime() : fs.statSync(path.join(BLOG_DIR, file)).mtime.getTime();
            return { file, time };
        })
        .sort((a, b) => b.time - a.time)
        .slice(0, 10)
        .map(item => item.file); // Check 10 most recent
    
    if (files.length === 0) return true;
    
    // Sample 3 random from the 10 most recent
    const samples = files.sort(() => 0.5 - Math.random()).slice(0, 3);
    let allPassed = true;
    const failures: string[] = [];

    for (const file of samples) {
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        const blogPassed = 
            hasAyushNoteRegex.test(content) && 
            (hasMistakesRegex.test(content) || hasPyqsRegex.test(content)); // At least one high-yield section
            
        if (!blogPassed) {
            allPassed = false;
            failures.push(file);
        }
    }

    if (!allPassed) {
        const msg = `[${new Date().toISOString()}] ❌ Baseline Validation Failed. Prompt evolution blocked. Samples failed: ${failures.join(', ')}\n`;
        fs.appendFileSync(AUDIT_LOG, msg);
        console.log(`🚫 ${msg}`);
    } else {
        console.log('✅ Baseline Validation passed (samples show structural integrity).');
    }

    return allPassed;
}

// ════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('🧬 PROMPT EVOLUTION ENGINE v2.0');
    console.log('═'.repeat(60) + '\n');

    // Safety check first — if quality is declining, revert and STOP
    if (shouldRevert()) {
        console.log('\n⚠️ Prompt was reverted due to quality decline. Skipping evolution this cycle to stabilize.\n');
        console.log('   ℹ️  The previous prompt has been restored. Evolution will resume once quality stabilizes.\n');
        return;
    }

    // Gather all intelligence
    const intel = gatherIntelligence();

    // Synthesize insights
    const insights = synthesizeInsights(intel);

    // Baseline validation before evolution — if content quality is bad, DO NOT evolve
    if (!baselineValidator()) {
        console.log('\n🚫 Baseline validation FAILED. Evolution BLOCKED to prevent bad prompt propagation.');
        console.log('   ℹ️  Fix the structural issues in recent blogs before the next evolution cycle.\n');
        return;
    }

    // Evolve the prompt
    const evolved = await evolvePrompt(intel.currentPrompt, insights);
    
    if (!evolved) {
        console.log('\n❌ Evolution failed. Current prompt remains unchanged.\n');
        return;
    }

    // Save with version history
    saveWithHistory(evolved);

    // Report
    console.log('═'.repeat(60));
    console.log('📊 EVOLUTION REPORT');
    console.log('═'.repeat(60));
    console.log(`  🧬 Prompt evolved: YES`);
    console.log(`  📏 New prompt length: ${evolved.evolvedPrompt.length} chars`);
    console.log(`  🌡️  Temperature: ${evolved.temperature}`);
    console.log(`  📊 Confidence: ${(evolved.confidence * 100).toFixed(0)}%`);
    
    if (Array.isArray(evolved.changelog) && evolved.changelog.length > 0) {
        console.log('\n  📝 Changes made:');
        evolved.changelog.forEach((change: string) => {
            console.log(`     • ${change}`);
        });
    }

    if (evolved.subjectTargets) {
        console.log('\n  🎯 Subject Targets:');
        for (const [subject, targets] of Object.entries(evolved.subjectTargets) as any) {
            console.log(`     ${subject}: ${targets.minWords}-${targets.maxWords} words, formulas=${targets.formulaDensity}, MCQs=${targets.mcqCount}`);
        }
    }

    console.log(`\n  📄 Saved: ${EVOLVED_PROMPT_FILE}`);
    console.log(`  📂 History: ${PROMPT_HISTORY_DIR}/`);
    console.log('\n✨ Prompt evolution complete!\n');
}

export { main as evolvePrompt, gatherIntelligence, synthesizeInsights };

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

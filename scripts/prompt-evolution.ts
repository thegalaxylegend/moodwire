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
import dotenv from 'dotenv';

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

Output ONLY a JSON object:
{
  "evolvedPrompt": "The complete new system prompt text (ready to use as-is)",
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
            max_tokens: 6000
        });

        const responseText = result.choices[0]?.message?.content?.trim() || "";
        const cleanedJson = responseText.replace(/```json|```/g, '').trim();
        
        // Extract JSON
        const firstBrace = cleanedJson.indexOf('{');
        const lastBrace = cleanedJson.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON object found in response');
        
        const jsonStr = cleanedJson.substring(firstBrace, lastBrace + 1);
        const evolved = JSON.parse(jsonStr);

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
        
        return null;
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
    if (!trends) return false;

    // Revert if quality is declining AND score is below 70
    if (trends.trend === 'declining' && trends.overallAvgScore < 70) {
        console.log('🚨 SAFETY: Quality declining below 70. Checking if evolved prompt is the cause...');
        
        const evolved = loadJSON(EVOLVED_PROMPT_FILE);
        if (evolved && evolved.version) {
            const evolvedDate = new Date(evolved.version);
            const daysSinceEvolution = (Date.now() - evolvedDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // If prompt was evolved recently and quality dropped, revert
            if (daysSinceEvolution < 7) {
                console.log('⏪ REVERTING: Evolved prompt was applied within last 7 days and quality dropped.');
                
                // Find the most recent history file
                if (fs.existsSync(PROMPT_HISTORY_DIR)) {
                    const historyFiles = fs.readdirSync(PROMPT_HISTORY_DIR)
                        .filter(f => f.startsWith('prompt-') && f.endsWith('.json'))
                        .sort()
                        .reverse();
                    
                    if (historyFiles.length > 0) {
                        const previousPrompt = loadJSON(path.join(PROMPT_HISTORY_DIR, historyFiles[0]));
                        if (previousPrompt) {
                            fs.writeFileSync(EVOLVED_PROMPT_FILE, JSON.stringify(previousPrompt, null, 2));
                            console.log('✅ Reverted to previous prompt version.');
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

// ════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('🧬 PROMPT EVOLUTION ENGINE v1.0');
    console.log('═'.repeat(60) + '\n');

    // Safety check first
    if (shouldRevert()) {
        console.log('\n⚠️ Prompt was reverted due to quality decline. Skipping evolution this cycle.\n');
        return;
    }

    // Gather all intelligence
    const intel = gatherIntelligence();

    // Synthesize insights
    const insights = synthesizeInsights(intel);

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
    
    if (evolved.changelog?.length > 0) {
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

/**
 * 🔬 Failed Blog Autopsy System (Feature 7.3)
 * 
 * When a blog fails the quality gate, this system:
 * 1. Analyzes pipeline-*.json reports to find failures
 * 2. Categorizes failure reasons (LaTeX, word count, kill-list, etc)
 * 3. Writes "lessons learned" → adjusts future generation strategy
 * 4. Outputs concrete fix recommendations
 * 5. Tracks failure recurring patterns over time
 * 
 * Run: npx tsx scripts/failed-autopsy.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const LESSONS_FILE = path.join(REPORTS_DIR, 'lessons-learned.json');
const STRATEGY_FILE = path.join(REPORTS_DIR, 'generation-strategy.json');

interface PipelineEntry {
    slug: string;
    status: string;
    quality_score: number;
    retries: number;
    error: string | null;
}

interface Lesson {
    date: string;
    slug: string;
    failureType: string;
    rootCause: string;
    fix: string;
    priority: 'critical' | 'high' | 'medium' | 'low' | 'resolved';
}

interface GenerationStrategy {
    lastUpdated: string;
    lessonsApplied: number;
    adjustments: StrategyAdjustment[];
}

interface StrategyAdjustment {
    rule: string;
    reason: string;
    appliedDate: string;
    impactedSubjects: string[];
}

// Self-extending error pattern registry
const ERROR_PATTERNS_FILE = path.join(REPORTS_DIR, 'error-patterns.json');

interface ErrorPattern {
    type: string;
    keywords: string[];
    rootCause: string;
    fix: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    learnedFrom?: string; // slug that first triggered this pattern
    addedDate?: string;
}

function loadErrorPatterns(): ErrorPattern[] {
    try {
        if (fs.existsSync(ERROR_PATTERNS_FILE)) {
            return JSON.parse(fs.readFileSync(ERROR_PATTERNS_FILE, 'utf-8'));
        }
    } catch { /* start fresh */ }
    return [];
}

function saveErrorPatterns(patterns: ErrorPattern[]): void {
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(ERROR_PATTERNS_FILE, JSON.stringify(patterns, null, 2));
}

// Built-in patterns (always available as baseline)
const BUILTIN_PATTERNS: ErrorPattern[] = [
    { type: 'JSON_PARSE_FAILURE', keywords: ['json', 'parse', 'syntax', 'unexpected token'], rootCause: 'LLM returned malformed JSON. Likely exceeded token limit or included markdown in JSON body.', fix: 'Reduce max_tokens or add stricter JSON validation. Add JSON repair fallback.', priority: 'critical' },
    { type: 'THIN_CONTENT', keywords: ['word count', 'too short', 'thin content'], rootCause: 'Generated content too short. LLM may have truncated output.', fix: 'Increase min word count enforcement. Add depth expansion pass.', priority: 'high' },
    { type: 'KILL_LIST_VIOLATION', keywords: ['kill', 'banned', 'phrase'], rootCause: 'LLM used banned AI-sounding phrases.', fix: 'Add kill-list to system prompt as negative examples.', priority: 'medium' },
    { type: 'LATEX_ERROR', keywords: ['latex', 'formula', 'math', 'katex', 'render'], rootCause: 'LaTeX formulas malformed or unrenderable.', fix: 'Add LaTeX validation pass. Use simpler formula syntax.', priority: 'high' },
    { type: 'MCQ_QUALITY_FAILURE', keywords: ['mcq', 'question', 'option', 'answer'], rootCause: 'Generated MCQs had incorrect answers or duplicate options.', fix: 'Add MCQ-specific validation. Use dedicated MCQ prompt.', priority: 'high' },
    { type: 'API_RATE_LIMIT', keywords: ['rate_limit', '429', 'quota', 'too many requests'], rootCause: 'All API keys exhausted. Too many requests.', fix: 'Add delay between requests. Reduce batch size.', priority: 'critical' },
    { type: 'NETWORK_TIMEOUT', keywords: ['timeout', 'timed out', 'network', 'econnreset', 'fetch failed'], rootCause: 'API request timed out. Server overload or network instability.', fix: 'Increase timeout. Add exponential backoff.', priority: 'medium' },
    { type: 'MISSING_SECTION', keywords: ['section', 'missing', 'trap', 'last 5'], rootCause: 'Required blog section was not generated.', fix: 'Generate missing sections in a separate pass.', priority: 'medium' },
    { type: 'CONTEXT_LENGTH', keywords: ['context_length', 'context length', 'token limit', 'max_tokens', 'too long'], rootCause: 'Input or output exceeded model context window.', fix: 'Reduce prompt size or split generation into multiple calls.', priority: 'high' },
    { type: 'MODEL_ERROR', keywords: ['model not found', 'model_not_found', 'deprecated', 'unavailable'], rootCause: 'Requested model is unavailable or deprecated.', fix: 'Update model ID in configuration. Add model fallback chain.', priority: 'critical' },
    { type: 'CONTENT_POLICY', keywords: ['content_policy', 'safety', 'blocked', 'filtered', 'harmful'], rootCause: 'Content was blocked by model safety filter.', fix: 'Rephrase prompt to avoid triggering safety filters.', priority: 'high' },
];

// Categorize errors — checks custom patterns first, then built-in, then auto-learns
function categorizeFailure(error: string, slug: string): { type: string; rootCause: string; fix: string; priority: 'critical' | 'high' | 'medium' | 'low' } {
    const errorLower = error.toLowerCase();
    
    // Load custom learned patterns (checked first — they may be more specific)
    const customPatterns = loadErrorPatterns();
    
    // Check custom patterns first
    for (const pattern of customPatterns) {
        if (pattern.keywords.some(kw => errorLower.includes(kw.toLowerCase()))) {
            return { type: pattern.type, rootCause: pattern.rootCause, fix: pattern.fix, priority: pattern.priority };
        }
    }
    
    // Check built-in patterns
    for (const pattern of BUILTIN_PATTERNS) {
        if (pattern.keywords.some(kw => errorLower.includes(kw.toLowerCase()))) {
            return { type: pattern.type, rootCause: pattern.rootCause, fix: pattern.fix, priority: pattern.priority };
        }
    }
    
    // UNKNOWN — auto-register this error signature for future categorization
    const subjectFromSlug = slug.includes('physics') ? 'Physics' 
        : slug.includes('chemistry') ? 'Chemistry'
        : slug.includes('biology') ? 'Biology'
        : slug.includes('math') ? 'Mathematics'
        : 'General';
    
    // Extract key words from the error for future matching
    const errorWords = errorLower
        .replace(/[^a-z0-9\s_]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4)
        .slice(0, 5);
    
    if (errorWords.length > 0) {
        const newPattern: ErrorPattern = {
            type: `LEARNED_${errorWords[0].toUpperCase()}`,
            keywords: errorWords,
            rootCause: `Auto-learned pattern from ${subjectFromSlug} failure: ${error.substring(0, 120)}`,
            fix: 'Review this auto-learned pattern and refine the fix recommendation.',
            priority: 'medium',
            learnedFrom: slug,
            addedDate: new Date().toISOString().split('T')[0]
        };
        
        // Don't add duplicates
        const existingTypes = new Set(customPatterns.map(p => p.type));
        if (!existingTypes.has(newPattern.type)) {
            customPatterns.push(newPattern);
            saveErrorPatterns(customPatterns);
            console.log(`   🧠 Auto-learned new error pattern: ${newPattern.type}`);
        }
    }
    
    return {
        type: 'UNKNOWN_FAILURE',
        rootCause: `Unclassified failure for ${subjectFromSlug} topic: ${error.substring(0, 100)}`,
        fix: 'Review error-patterns.json — a new pattern may have been auto-registered.',
        priority: 'low'
    };
}

function generateStrategyAdjustments(lessons: Lesson[]): StrategyAdjustment[] {
    const adjustments: StrategyAdjustment[] = [];
    const typeCounts = new Map<string, number>();
    
    // Count failure frequencies
    for (const lesson of lessons) {
        typeCounts.set(lesson.failureType, (typeCounts.get(lesson.failureType) || 0) + 1);
    }
    
    // Generate strategy adjustments based on patterns
    if ((typeCounts.get('JSON_PARSE_FAILURE') || 0) >= 2) {
        adjustments.push({
            rule: 'ENFORCE_JSON_REPAIR: Extract JSON between outermost { } before parsing. Strip markdown code fences.',
            reason: `${typeCounts.get('JSON_PARSE_FAILURE')} JSON parse failures detected.`,
            appliedDate: new Date().toISOString().split('T')[0],
            impactedSubjects: ['All']
        });
    }
    
    if ((typeCounts.get('THIN_CONTENT') || 0) >= 2) {
        adjustments.push({
            rule: 'MIN_WORD_ENFORCEMENT: If any section < 150 words, trigger targeted expansion pass.',
            reason: `${typeCounts.get('THIN_CONTENT')} thin content failures detected.`,
            appliedDate: new Date().toISOString().split('T')[0],
            impactedSubjects: ['All']
        });
    }
    
    if ((typeCounts.get('LATEX_ERROR') || 0) >= 2) {
        adjustments.push({
            rule: 'LATEX_SAFETY: Use \\text{} wrappers for all units. Prefer simple notation over complex LaTeX.',
            reason: `${typeCounts.get('LATEX_ERROR')} LaTeX rendering failures detected.`,
            appliedDate: new Date().toISOString().split('T')[0],
            impactedSubjects: ['Physics', 'Chemistry', 'Mathematics']
        });
    }
    
    if ((typeCounts.get('KILL_LIST_VIOLATION') || 0) >= 3) {
        adjustments.push({
            rule: 'NEGATIVE_EXAMPLES: Add top 5 kill-list phrases to system prompt as "NEVER USE THESE".',
            reason: `${typeCounts.get('KILL_LIST_VIOLATION')} kill-list violations detected.`,
            appliedDate: new Date().toISOString().split('T')[0],
            impactedSubjects: ['All']
        });
    }
    
    if ((typeCounts.get('API_RATE_LIMIT') || 0) >= 2) {
        adjustments.push({
            rule: 'RATE_LIMIT_PROTECTION: Add 8-second delay between API calls. Reduce batch from 6 to 4.',
            reason: `${typeCounts.get('API_RATE_LIMIT')} rate limit hits detected.`,
            appliedDate: new Date().toISOString().split('T')[0],
            impactedSubjects: ['All']
        });
    }
    
    if ((typeCounts.get('MCQ_QUALITY_FAILURE') || 0) >= 2) {
        adjustments.push({
            rule: 'MCQ_ISOLATION: Generate MCQs in a separate, dedicated API call with MCQ-specific prompt.',
            reason: `${typeCounts.get('MCQ_QUALITY_FAILURE')} MCQ quality failures detected.`,
            appliedDate: new Date().toISOString().split('T')[0],
            impactedSubjects: ['All']
        });
    }
    
    return adjustments;
}

async function main() {
    console.log('\n🔬 Failed Blog Autopsy System v1.0');
    console.log('Analyzing failures and extracting lessons...\n');
    
    if (!fs.existsSync(REPORTS_DIR)) {
        console.log('📭 No reports directory found. Run the blog pipeline first.');
        return;
    }
    
    // Load all pipeline reports
    const reportFiles = fs.readdirSync(REPORTS_DIR)
        .filter(f => f.startsWith('pipeline-') && f.endsWith('.json'))
        .sort();
    
    if (reportFiles.length === 0) {
        console.log('📭 No pipeline reports found. Run the blog generator first.');
        return;
    }
    
    console.log(`📂 Found ${reportFiles.length} pipeline report(s)\n`);
    
    // Load existing lessons
    let existingLessons: Lesson[] = [];
    if (fs.existsSync(LESSONS_FILE)) {
        try {
            existingLessons = JSON.parse(fs.readFileSync(LESSONS_FILE, 'utf-8'));
        } catch { /* start fresh */ }
    }
    
    const existingSlugs = new Set(existingLessons.map(l => `${l.date}-${l.slug}`));
    const newLessons: Lesson[] = [];
    
    for (const file of reportFiles) {
        const dateMatch = file.match(/pipeline-(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : 'unknown';
        
        try {
            const entries: PipelineEntry[] = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8'));
            const failures = entries.filter(e => e.status === 'failed' && e.error);
            
            for (const fail of failures) {
                const key = `${date}-${fail.slug}`;
                if (existingSlugs.has(key)) continue; // Already analyzed
                
                const analysis = categorizeFailure(fail.error!, fail.slug);
                const lesson: Lesson = {
                    date,
                    slug: fail.slug,
                    failureType: analysis.type,
                    rootCause: analysis.rootCause,
                    fix: analysis.fix,
                    priority: analysis.priority
                };
                
                newLessons.push(lesson);
                console.log(`🔬 ${date} | ${fail.slug}`);
                console.log(`   Type: ${analysis.type} (${analysis.priority})`);
                console.log(`   Root cause: ${analysis.rootCause.substring(0, 80)}`);
                console.log(`   Fix: ${analysis.fix.substring(0, 80)}`);
                console.log('');
            }
        } catch {
            // Skip corrupted files
        }
    }
    
    // Merge lessons
    const allLessons = [...existingLessons, ...newLessons];
    
    // Generate strategy adjustments (only from ACTIVE failures, not resolved)
    const activeLessons = allLessons.filter(l => l.failureType !== 'RESOLVED_ERROR' && l.priority !== 'resolved');
    const adjustments = generateStrategyAdjustments(activeLessons);
    
    // Summary
    console.log('═'.repeat(60));
    console.log('📊 AUTOPSY REPORT');
    console.log('═'.repeat(60));
    console.log(`  📂 Reports analyzed:      ${reportFiles.length}`);
    console.log(`  🆕 New lessons extracted:  ${newLessons.length}`);
    console.log(`  📚 Total lessons learned:  ${allLessons.length}`);
    console.log(`  ✅ Resolved:               ${allLessons.length - activeLessons.length}`);
    console.log(`  🎯 Strategy adjustments:   ${adjustments.length}`);
    
    // Failure type breakdown (ACTIVE only — resolved errors are excluded)
    const typeCounts = new Map<string, number>();
    activeLessons.forEach(l => typeCounts.set(l.failureType, (typeCounts.get(l.failureType) || 0) + 1));
    
    if (typeCounts.size > 0) {
        console.log('\n  📋 Active Failure Type Breakdown:');
        Array.from(typeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, count]) => {
                console.log(`     ${count}× ${type}`);
            });
    }
    
    if (adjustments.length > 0) {
        console.log('\n  🎯 Strategy Adjustments:');
        adjustments.forEach(a => {
            console.log(`     📌 ${a.rule.substring(0, 70)}...`);
            console.log(`        Reason: ${a.reason}`);
        });
    }
    
    // Save outputs
    // NEXUS v2: Cap lessons to prevent unbounded growth (keep latest 100)
    const cappedLessons = allLessons.slice(-100);
    if (allLessons.length > 100) {
        console.log(`  ✂️ Trimmed lessons from ${allLessons.length} → 100 (oldest removed)`);
    }
    fs.writeFileSync(LESSONS_FILE, JSON.stringify(cappedLessons, null, 2));
    console.log(`\n📄 Lessons saved: ${LESSONS_FILE}`);
    
    const strategy: GenerationStrategy = {
        lastUpdated: new Date().toISOString(),
        lessonsApplied: allLessons.length,
        adjustments
    };
    fs.writeFileSync(STRATEGY_FILE, JSON.stringify(strategy, null, 2));
    console.log(`📄 Strategy saved: ${STRATEGY_FILE}`);

    // ═══════════════════════════════════════════════════════════════════
    // Generate autopsy-report.json for Discord Pulse (System Pulse embed)
    // This file is read by discord-pulse.ts --pulse
    // Only include ACTIVE (non-resolved) failures in flaws/unpredicted
    // ═══════════════════════════════════════════════════════════════════
    const activeFlawCounts = Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => `${type}: ${count}`);
    
    const unpredictedFlaws = activeLessons
        .filter(l => l.failureType === 'UNKNOWN_FAILURE' || l.failureType.startsWith('LEARNED_'))
        .reduce((acc, l) => {
            const key = l.failureType;
            acc.set(key, (acc.get(key) || 0) + 1);
            return acc;
        }, new Map<string, number>());
    
    const insights: string[] = [];
    if (activeLessons.length === 0) {
        insights.push('No critical issues needing regeneration');
    }
    if (adjustments.length === 0) {
        insights.push('No warnings needing optimization');
    }
    if (activeLessons.length > 0) {
        const topType = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        if (topType) {
            insights.push(`Top failure type: ${topType[0]} (${topType[1]}× — prioritize fix)`);
        }
    }

    const autopsyReport = {
        generatedAt: new Date().toISOString(),
        totalLessons: allLessons.length,
        activeLessons: activeLessons.length,
        resolvedLessons: allLessons.length - activeLessons.length,
        flaws: activeFlawCounts,
        unpredicted: Array.from(unpredictedFlaws.entries()).map(([k, v]) => `${k}: ${v}`),
        insights,
    };

    const autopsyReportPath = path.join(REPORTS_DIR, 'autopsy-report.json');
    fs.writeFileSync(autopsyReportPath, JSON.stringify(autopsyReport, null, 2));
    console.log(`📄 Autopsy report saved: ${autopsyReportPath}`);
    
    console.log('\n✨ Autopsy complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

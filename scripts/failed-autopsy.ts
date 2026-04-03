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
    priority: 'critical' | 'high' | 'medium' | 'low';
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

// Categorize errors into actionable failure types
function categorizeFailure(error: string, slug: string): { type: string; rootCause: string; fix: string; priority: 'critical' | 'high' | 'medium' | 'low' } {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('json') || errorLower.includes('parse') || errorLower.includes('syntax')) {
        return {
            type: 'JSON_PARSE_FAILURE',
            rootCause: 'LLM returned malformed JSON. Likely exceeded token limit or included markdown in JSON body.',
            fix: 'Reduce max_tokens or add stricter JSON validation. Add JSON repair fallback (extract between { and }).',
            priority: 'critical'
        };
    }
    
    if (errorLower.includes('word count') || errorLower.includes('too short') || errorLower.includes('thin content')) {
        return {
            type: 'THIN_CONTENT',
            rootCause: 'Generated content too short. LLM may have truncated output or misunderstood depth requirement.',
            fix: 'Increase min word count enforcement. Add "depth expansion" pass for short sections.',
            priority: 'high'
        };
    }
    
    if (errorLower.includes('kill') || errorLower.includes('banned') || errorLower.includes('phrase')) {
        return {
            type: 'KILL_LIST_VIOLATION',
            rootCause: 'LLM used banned AI-sounding phrases despite prompt instructions.',  
            fix: 'Add kill-list to system prompt as negative examples. Run post-generation sanitizer.',
            priority: 'medium'
        };
    }
    
    if (errorLower.includes('latex') || errorLower.includes('formula') || errorLower.includes('math')) {
        return {
            type: 'LATEX_ERROR',
            rootCause: 'LaTeX formulas malformed or unrenderable. Common with Groq models.',
            fix: 'Add LaTeX validation pass. Use simpler formula syntax. Fallback to text representation.',
            priority: 'high'
        };
    }
    
    if (errorLower.includes('mcq') || errorLower.includes('question')) {
        return {
            type: 'MCQ_QUALITY_FAILURE',
            rootCause: 'Generated MCQs had incorrect answers, duplicate options, or nonsensical questions.',
            fix: 'Add MCQ-specific validation (4 unique options, answer exists in options). Use dedicated MCQ prompt.',
            priority: 'high'
        };
    }
    
    if (errorLower.includes('rate_limit') || errorLower.includes('429') || errorLower.includes('quota')) {
        return {
            type: 'API_RATE_LIMIT',
            rootCause: 'All API keys exhausted. Too many requests in generation window.',
            fix: 'Add delay between requests. Reduce batch size. Add more API keys or use backup model.',
            priority: 'critical'
        };
    }
    
    if (errorLower.includes('timeout') || errorLower.includes('timed out') || errorLower.includes('network')) {
        return {
            type: 'NETWORK_TIMEOUT',
            rootCause: 'API request timed out. Server overload or network instability.',
            fix: 'Increase timeout. Add exponential backoff. Cache partial results.',
            priority: 'medium'
        };
    }
    
    if (errorLower.includes('section') || errorLower.includes('missing')) {
        return {
            type: 'MISSING_SECTION',
            rootCause: 'Required blog section (Trap Questions, Last 5 Min Box, etc) was not generated.',
            fix: 'Generate missing sections in a separate pass. Add section-specific prompts.',
            priority: 'medium'
        };
    }
    
    // Subject-specific patterns
    const subjectFromSlug = slug.includes('physics') ? 'Physics' 
        : slug.includes('chemistry') ? 'Chemistry'
        : slug.includes('biology') ? 'Biology'
        : slug.includes('math') ? 'Mathematics'
        : 'General';
    
    return {
        type: 'UNKNOWN_FAILURE',
        rootCause: `Unclassified failure for ${subjectFromSlug} topic: ${error.substring(0, 100)}`,
        fix: 'Review manually. Consider adding this error pattern to the autopsy categorizer.',
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
    
    // Generate strategy adjustments
    const adjustments = generateStrategyAdjustments(allLessons);
    
    // Summary
    console.log('═'.repeat(60));
    console.log('📊 AUTOPSY REPORT');
    console.log('═'.repeat(60));
    console.log(`  📂 Reports analyzed:      ${reportFiles.length}`);
    console.log(`  🆕 New lessons extracted:  ${newLessons.length}`);
    console.log(`  📚 Total lessons learned:  ${allLessons.length}`);
    console.log(`  🎯 Strategy adjustments:   ${adjustments.length}`);
    
    // Failure type breakdown
    const typeCounts = new Map<string, number>();
    allLessons.forEach(l => typeCounts.set(l.failureType, (typeCounts.get(l.failureType) || 0) + 1));
    
    if (typeCounts.size > 0) {
        console.log('\n  📋 Failure Type Breakdown:');
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
    fs.writeFileSync(LESSONS_FILE, JSON.stringify(allLessons, null, 2));
    console.log(`\n📄 Lessons saved: ${LESSONS_FILE}`);
    
    const strategy: GenerationStrategy = {
        lastUpdated: new Date().toISOString(),
        lessonsApplied: allLessons.length,
        adjustments
    };
    fs.writeFileSync(STRATEGY_FILE, JSON.stringify(strategy, null, 2));
    console.log(`📄 Strategy saved: ${STRATEGY_FILE}`);
    
    console.log('\n✨ Autopsy complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

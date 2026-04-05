/**
 * 🧠 THE ORCHESTRATOR — Self-Improvement Loop
 * 
 * Single entry point that runs the ENTIRE self-improvement nervous system:
 * 
 * Step 1: quality-tracker     → Analyze pipeline quality trends
 * Step 2: failed-autopsy      → Extract lessons from failures
 * Step 3: content-patterns    → Learn structural DNA of blogs
 * Step 4: prompt-evolution    → Generate evolved prompts (THE BRAIN)
 * Step 5: content-decay       → Find declining traffic pages
 * Step 6: self-changelog      → Document everything that happened
 * 
 * Usage: npm run ai:evolve
 * 
 * Each step is idempotent — safe to re-run.
 * The system automatically skips steps that have no data to process.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const LOG_FILE = path.join(REPORTS_DIR, 'self-improve-log.json');

interface StepResult {
    step: string;
    status: 'success' | 'skipped' | 'failed';
    duration: number;
    output: string;
}

function runStep(name: string, script: string): StepResult {
    const start = Date.now();
    try {
        console.log(`\n${'━'.repeat(60)}`);
        console.log(`▶ STEP: ${name}`);
        console.log(`${'━'.repeat(60)}\n`);

        const output = execSync(`npx tsx ${script}`, {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8',
            timeout: 120000, // 2 minute timeout per step
            stdio: ['inherit', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '0' }
        });

        const duration = Date.now() - start;
        console.log(output);
        console.log(`✅ ${name} completed in ${(duration / 1000).toFixed(1)}s\n`);

        return { step: name, status: 'success', duration, output: output.substring(0, 500) };
    } catch (err: any) {
        const duration = Date.now() - start;
        const errOutput = err.stdout?.toString() || err.stderr?.toString() || err.message || '';
        
        // Some steps are expected to have no data — that's OK
        if (errOutput.includes('No pipeline reports') || errOutput.includes('No data') || errOutput.includes('📭')) {
            console.log(`⚪ ${name} skipped (no data available)\n`);
            return { step: name, status: 'skipped', duration, output: 'No data available' };
        }

        console.error(`❌ ${name} failed after ${(duration / 1000).toFixed(1)}s`);
        console.error(`   Error: ${errOutput.substring(0, 200)}\n`);
        return { step: name, status: 'failed', duration, output: errOutput.substring(0, 500) };
    }
}

async function main() {
    const startTime = Date.now();

    console.log('\n' + '█'.repeat(60));
    console.log('█                                                          █');
    console.log('█   🧠 SELF-IMPROVEMENT ORCHESTRATOR v1.0                  █');
    console.log('█   Autonomous Learning Loop for Exam Compass AI           █');
    console.log('█                                                          █');
    console.log('█'.repeat(60) + '\n');
    console.log(`📅 Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`🕐 Time: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`📂 Reports: ${REPORTS_DIR}\n`);

    // Ensure reports directory exists
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

    const results: StepResult[] = [];

    // ══════════════════════════════════════════════════
    // STEP 1: Quality Trends Analysis
    // Reads pipeline reports → computes quality scores → detects declining trends
    // ══════════════════════════════════════════════════
    results.push(runStep(
        '📈 Quality Trends Tracker',
        'scripts/quality-tracker.ts'
    ));

    // ══════════════════════════════════════════════════
    // STEP 2: Failed Blog Autopsy
    // Analyzes failed blog generations → extracts lessons → adjusts strategy
    // ══════════════════════════════════════════════════
    results.push(runStep(
        '🔬 Failed Blog Autopsy',
        'scripts/failed-autopsy.ts'
    ));

    // ══════════════════════════════════════════════════
    // STEP 3: Content Pattern Learning
    // Scans all 150+ blogs → learns structural DNA of winning content
    // ══════════════════════════════════════════════════
    results.push(runStep(
        '📊 Content Pattern Learner',
        'scripts/content-patterns.ts'
    ));

    // ══════════════════════════════════════════════════
    // STEP 4: PROMPT EVOLUTION (THE BRAIN)
    // Uses Gemini meta-cognition to evolve blog generation prompts
    // based on ALL intelligence sources
    // ══════════════════════════════════════════════════
    results.push(runStep(
        '🧬 Prompt Evolution Engine',
        'scripts/prompt-evolution.ts'
    ));

    // ══════════════════════════════════════════════════
    // STEP 5: Content Decay Detection
    // Cross-references GA4 + GSC to find declining-traffic blogs
    // ══════════════════════════════════════════════════
    results.push(runStep(
        '📉 Content Decay Detector',
        'scripts/content-decay.ts'
    ));

    // ══════════════════════════════════════════════════
    // STEP 6: Self-Documenting Changelog
    // AI writes its own changelog of what happened today
    // ══════════════════════════════════════════════════
    results.push(runStep(
        '📝 Self-Documenting Changelog',
        'scripts/self-changelog.ts'
    ));

    // ══════════════════════════════════════════════════
    // FINAL REPORT
    // ══════════════════════════════════════════════════
    const totalDuration = Date.now() - startTime;
    const succeeded = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log('\n' + '█'.repeat(60));
    console.log('█  SELF-IMPROVEMENT LOOP COMPLETE');
    console.log('█'.repeat(60));
    console.log(`\n  ⏱️  Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`  ✅ Succeeded: ${succeeded}`);
    console.log(`  ⚪ Skipped:   ${skipped}`);
    console.log(`  ❌ Failed:    ${failed}`);
    console.log('');

    for (const r of results) {
        const icon = r.status === 'success' ? '✅' : r.status === 'skipped' ? '⚪' : '❌';
        console.log(`  ${icon} ${r.step} (${(r.duration / 1000).toFixed(1)}s)`);
    }

    // Check if evolved prompt was generated
    const evolvedPath = path.join(REPORTS_DIR, 'evolved-prompt.json');
    if (fs.existsSync(evolvedPath)) {
        try {
            const evolved = JSON.parse(fs.readFileSync(evolvedPath, 'utf-8'));
            console.log(`\n  🧬 EVOLVED PROMPT STATUS:`);
            console.log(`     Version: ${evolved.version?.substring(0, 19) || 'unknown'}`);
            console.log(`     Confidence: ${((evolved.confidence || 0) * 100).toFixed(0)}%`);
            console.log(`     Prompt length: ${evolved.evolvedPrompt?.length || 0} chars`);
            if (Array.isArray(evolved.changelog) && evolved.changelog.length > 0) {
                console.log(`     Changes: ${evolved.changelog.length}`);
                evolved.changelog.slice(0, 3).forEach((c: string) => console.log(`       • ${c.substring(0, 70)}`));
            }
        } catch { /* ignore */ }
    }

    // Save execution log
    const log = {
        date: new Date().toISOString(),
        totalDuration,
        summary: { succeeded, skipped, failed, total: results.length },
        steps: results
    };

    // Append to history
    let history: any[] = [];
    if (fs.existsSync(LOG_FILE)) {
        try { history = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); } catch { }
    }
    history.unshift(log);
    history = history.slice(0, 30); // Keep last 30 runs
    fs.writeFileSync(LOG_FILE, JSON.stringify(history, null, 2));

    // Also save to public for dashboard
    const publicReports = path.join(__dirname, '../public/jules-reports');
    if (!fs.existsSync(publicReports)) fs.mkdirSync(publicReports, { recursive: true });
    fs.writeFileSync(path.join(publicReports, 'self-improve-log.json'), JSON.stringify(history, null, 2));

    console.log(`\n  📄 Log saved: ${LOG_FILE}`);
    console.log('\n🏁 Self-improvement loop finished.\n');
}

main().catch(err => {
    console.error('❌ Fatal Orchestrator Error:', err);
    process.exit(1);
});

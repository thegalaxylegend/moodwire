/**
 * 📝 Self-Documenting Changelog System (Feature 7.6)
 * 
 * The AI writes its own changelog:
 * 1. Scans all jules-reports/ for recent activity
 * 2. Summarizes what changed, why, and impact
 * 3. Appends to CHANGELOG.md in a structured format
 * 4. Tracks cumulative statistics
 * 
 * Run: npx tsx scripts/self-changelog.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const CHANGELOG_FILE = path.join(__dirname, '../JULES_CHANGELOG.md');
const TODAY = new Date().toISOString().split('T')[0];
const NOW = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

interface DayActivity {
    blogsGenerated: number;
    blogsPassed: number;
    blogsFailed: number;
    avgScore: number;
    freshnessFixes: number;
    repairsApplied: number;
    linksAdded: number;
    duplicatesFound: number;
    lessonsLearned: number;
    schemasGenerated: number;
}

function loadTodaysActivity(): DayActivity {
    const activity: DayActivity = {
        blogsGenerated: 0, blogsPassed: 0, blogsFailed: 0, avgScore: 0,
        freshnessFixes: 0, repairsApplied: 0, linksAdded: 0,
        duplicatesFound: 0, lessonsLearned: 0, schemasGenerated: 0
    };
    
    if (!fs.existsSync(REPORTS_DIR)) return activity;
    
    // Pipeline report
    const pipelineFile = path.join(REPORTS_DIR, `pipeline-${TODAY}.json`);
    if (fs.existsSync(pipelineFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(pipelineFile, 'utf-8'));
            if (Array.isArray(data)) {
                activity.blogsGenerated = data.length;
                activity.blogsPassed = data.filter((e: any) => e.status !== 'failed').length;
                activity.blogsFailed = data.filter((e: any) => e.status === 'failed').length;
                const scores = data.map((e: any) => e.quality_score || 0);
                activity.avgScore = scores.length > 0 
                    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) 
                    : 0;
            }
        } catch { /* ignore */ }
    }
    
    // Freshness report
    const freshnessFile = path.join(REPORTS_DIR, `freshness-${TODAY}.json`);
    if (fs.existsSync(freshnessFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(freshnessFile, 'utf-8'));
            activity.freshnessFixes = data.summary?.updated || 0;
        } catch { /* ignore */ }
    }
    
    // Repair report
    const repairFile = path.join(REPORTS_DIR, `repair-${TODAY}.json`);
    if (fs.existsSync(repairFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(repairFile, 'utf-8'));
            activity.repairsApplied = data.summary?.totalFixes || 0;
        } catch { /* ignore */ }
    }
    
    // Linking report
    const linkingFile = path.join(REPORTS_DIR, `linking-${TODAY}.json`);
    if (fs.existsSync(linkingFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(linkingFile, 'utf-8'));
            activity.linksAdded = data.summary?.totalLinksAdded || 0;
        } catch { /* ignore */ }
    }
    
    // Duplication report
    const dupFile = path.join(REPORTS_DIR, `duplication-${TODAY}.json`);
    if (fs.existsSync(dupFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(dupFile, 'utf-8'));
            activity.duplicatesFound = data.summary?.highOverlapPairs || 0;
        } catch { /* ignore */ }
    }
    
    // Lessons learned
    const lessonsFile = path.join(REPORTS_DIR, 'lessons-learned.json');
    if (fs.existsSync(lessonsFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(lessonsFile, 'utf-8'));
            activity.lessonsLearned = Array.isArray(data) ? data.length : 0;
        } catch { /* ignore */ }
    }
    
    return activity;
}

function generateEntry(activity: DayActivity): string {
    let entry = `\n## 📅 ${TODAY} (${NOW})\n\n`;
    
    // What happened
    const events: string[] = [];
    
    if (activity.blogsGenerated > 0) {
        events.push(`- 📝 **Generated ${activity.blogsGenerated} blogs** — ${activity.blogsPassed} passed (avg score: ${activity.avgScore}), ${activity.blogsFailed} failed`);
    }
    
    if (activity.freshnessFixes > 0) {
        events.push(`- 🔄 **Content Freshness** — Updated ${activity.freshnessFixes} blogs with current year/dates`);
    }
    
    if (activity.repairsApplied > 0) {
        events.push(`- 🔧 **Smart Repair** — Applied ${activity.repairsApplied} auto-fixes (kill-list, LaTeX, broken links)`);
    }
    
    if (activity.linksAdded > 0) {
        events.push(`- 🔗 **Internal Linking** — Added ${activity.linksAdded} new internal links between blog posts`);
    }
    
    if (activity.duplicatesFound > 0) {
        events.push(`- 🔍 **Duplication Check** — Found ${activity.duplicatesFound} high-overlap blog pairs`);
    }
    
    if (activity.schemasGenerated > 0) {
        events.push(`- 📋 **Schema Markup** — Generated structured data for ${activity.schemasGenerated} blogs`);
    }
    
    if (events.length === 0) {
        events.push('- 💤 **No pipeline activity today** — All systems idle');
    }
    
    entry += '### What Happened\n\n';
    entry += events.join('\n') + '\n';
    
    // Impact assessment
    entry += '\n### Impact\n\n';
    if (activity.blogsGenerated > 0 || activity.repairsApplied > 0) {
        const totalActions = activity.blogsGenerated + activity.freshnessFixes + activity.repairsApplied + activity.linksAdded;
        entry += `- ${totalActions} total autonomous actions taken\n`;
    }
    if (activity.blogsFailed > 0) {
        entry += `- ⚠️ ${activity.blogsFailed} blog(s) failed quality gate — autopsy system will analyze\n`;
    }
    if (activity.duplicatesFound > 0) {
        entry += `- ⚠️ ${activity.duplicatesFound} content overlap warning(s) — may need manual deduplication\n`;
    }
    
    entry += `\n---\n`;
    
    return entry;
}

function getCumulativeStats(): string {
    let stats = '\n## 📊 Cumulative Statistics\n\n';
    
    if (!fs.existsSync(REPORTS_DIR)) return stats + '- No data yet\n';
    
    const pipelineReports = fs.readdirSync(REPORTS_DIR)
        .filter(f => f.startsWith('pipeline-') && f.endsWith('.json'));
    
    let totalGenerated = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const file of pipelineReports) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, file), 'utf-8'));
            if (Array.isArray(data)) {
                totalGenerated += data.length;
                totalPassed += data.filter((e: any) => e.status !== 'failed').length;
                totalFailed += data.filter((e: any) => e.status === 'failed').length;
            }
        } catch { /* ignore */ }
    }
    
    stats += `| Metric | Value |\n`;
    stats += `|---|---|\n`;
    stats += `| Pipeline runs | ${pipelineReports.length} |\n`;
    stats += `| Total blogs generated | ${totalGenerated} |\n`;
    stats += `| Quality gate pass rate | ${totalGenerated > 0 ? Math.round((totalPassed / totalGenerated) * 100) : 0}% |\n`;
    stats += `| Total failures | ${totalFailed} |\n`;
    
    return stats;
}

async function main() {
    console.log('\n📝 Self-Documenting Changelog v1.0\n');
    
    const activity = loadTodaysActivity();
    const newEntry = generateEntry(activity);
    
    // Read existing changelog or create header
    let existing = '';
    if (fs.existsSync(CHANGELOG_FILE)) {
        existing = fs.readFileSync(CHANGELOG_FILE, 'utf-8');
    }
    
    // Check if today's entry already exists
    if (existing.includes(`## 📅 ${TODAY}`)) {
        console.log(`📝 Today's entry already exists. Updating...`);
        // Replace today's entry
        const todayRegex = new RegExp(`## 📅 ${TODAY}[\\s\\S]*?(?=## 📅|## 📊|$)`);
        existing = existing.replace(todayRegex, '');
    }
    
    // Build full changelog
    let header = '';
    if (!existing.includes('# 🤖 Jules AI — Autonomous Changelog')) {
        header = `# 🤖 Jules AI — Autonomous Changelog

> This file is automatically maintained by the self-learning AI system.
> Every pipeline run appends what changed, why, and the impact.

`;
    }
    
    const cumStats = getCumulativeStats();
    
    // Structure: Header → Cumulative Stats → Latest Entry → Previous Entries
    let previousEntries = existing
        .replace(/^# 🤖 Jules AI.*?\n\n.*?\n\n/s, '') // Strip old header
        .replace(/## 📊 Cumulative Statistics[\s\S]*?(?=## 📅|$)/, '') // Strip old stats
        .trim();
    
    const changelog = header + cumStats + '\n' + newEntry + (previousEntries ? '\n' + previousEntries : '') + '\n';
    
    fs.writeFileSync(CHANGELOG_FILE, changelog, 'utf-8');
    
    console.log(`✅ Changelog updated: ${CHANGELOG_FILE}`);
    console.log(`📊 Today's activity:`);
    console.log(`   Blogs generated: ${activity.blogsGenerated}`);
    console.log(`   Repairs applied: ${activity.repairsApplied}`);
    console.log(`   Freshness fixes: ${activity.freshnessFixes}`);
    console.log(`   Links added:     ${activity.linksAdded}`);
    console.log('\n✨ Done!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

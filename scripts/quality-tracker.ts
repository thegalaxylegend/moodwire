/**
 * 📈 Historical Quality Trends Tracker (Feature 2.7)
 * 
 * Analyzes all pipeline reports over time to:
 * 1. Compute average quality scores per day/week
 * 2. Detect quality decline trends
 * 3. Track pass/fail ratios
 * 4. Identify most common failure reasons
 * 5. Generate Discord alert payload if quality drops
 * 
 * Run: npx tsx scripts/quality-tracker.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const OUTPUT_DIR = path.join(__dirname, '../jules-reports');

interface PipelineEntry {
    slug: string;
    status: string;
    quality_score: number;
    retries: number;
    error: string | null;
}

interface DailyReport {
    date: string;
    totalBlogs: number;
    passed: number;
    failed: number;
    avgScore: number;
    passRate: number;
    errors: string[];
}

interface TrendAnalysis {
    overallAvgScore: number;
    totalBlogsAllTime: number;
    totalPassed: number;
    totalFailed: number;
    overallPassRate: number;
    trend: 'improving' | 'stable' | 'declining';
    trendDelta: number;
    dailyReports: DailyReport[];
    topErrors: Array<{ error: string; count: number }>;
    alertNeeded: boolean;
    alertMessage: string;
}

function loadReports(): Map<string, PipelineEntry[]> {
    const reports = new Map<string, PipelineEntry[]>();
    
    if (!fs.existsSync(REPORTS_DIR)) return reports;

    // Helper to load pipeline files from a directory
    const loadFromDir = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir)
            .filter(f => f.startsWith('pipeline-') && f.endsWith('.json'))
            .sort();
        
        for (const file of files) {
            const dateMatch = file.match(/pipeline-(\d{4}-\d{2}-\d{2})/);
            if (!dateMatch) continue;
            if (reports.has(dateMatch[1])) continue; // Don't overwrite newer data
            
            try {
                const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
                if (Array.isArray(data)) {
                    reports.set(dateMatch[1], data);
                }
            } catch {
                // Skip corrupted reports
            }
        }
    };
    
    // Load from main reports directory (today's reports)
    loadFromDir(REPORTS_DIR);
    
    // Load from archive directories (historical reports)
    const archiveDir = path.join(REPORTS_DIR, 'archive');
    if (fs.existsSync(archiveDir)) {
        const archiveDirs = fs.readdirSync(archiveDir)
            .filter(d => fs.statSync(path.join(archiveDir, d)).isDirectory())
            .sort();
        for (const dir of archiveDirs) {
            loadFromDir(path.join(archiveDir, dir));
        }
    }
    
    return reports;
}

function analyzeTrends(reports: Map<string, PipelineEntry[]>): TrendAnalysis {
    const dailyReports: DailyReport[] = [];
    const errorCounts = new Map<string, number>();
    let totalScore = 0;
    let totalBlogs = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [date, entries] of reports) {
        const passed = entries.filter(e => e.status !== 'failed').length;
        const failed = entries.filter(e => e.status === 'failed').length;
        const scores = entries.map(e => e.quality_score || 0);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        
        dailyReports.push({
            date,
            totalBlogs: entries.length,
            passed,
            failed,
            avgScore: Math.round(avgScore * 10) / 10,
            passRate: entries.length > 0 ? Math.round((passed / entries.length) * 100) : 0,
            errors: entries.filter(e => e.error).map(e => e.error!) 
        });
        
        totalScore += scores.reduce((a, b) => a + b, 0);
        totalBlogs += entries.length;
        totalPassed += passed;
        totalFailed += failed;
        
        // Track errors
        for (const entry of entries) {
            if (entry.error) {
                const errorKey = entry.error.substring(0, 80);
                errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
            }
        }
    }
    
    // Calculate trend (compare last 7 days vs previous 7 days)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    let trendDelta = 0;
    
    if (dailyReports.length >= 4) {
        const recent = dailyReports.slice(-Math.min(7, Math.floor(dailyReports.length / 2)));
        const previous = dailyReports.slice(
            -Math.min(14, dailyReports.length),
            -Math.min(7, Math.floor(dailyReports.length / 2))
        );
        
        if (recent.length > 0 && previous.length > 0) {
            const recentAvg = recent.reduce((a, r) => a + r.avgScore, 0) / recent.length;
            const prevAvg = previous.reduce((a, r) => a + r.avgScore, 0) / previous.length;
            trendDelta = Math.round((recentAvg - prevAvg) * 10) / 10;
            
            if (trendDelta > 5) trend = 'improving';
            else if (trendDelta < -5) trend = 'declining';
        }
    }
    
    // Sort errors by frequency
    const topErrors = Array.from(errorCounts.entries())
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    // Determine if alert is needed
    const alertNeeded = trend === 'declining' || 
        (dailyReports.length > 0 && dailyReports[dailyReports.length - 1].passRate < 50);
    
    let alertMessage = '';
    if (trend === 'declining') {
        alertMessage = `⚠️ Quality is DECLINING! Avg score dropped by ${Math.abs(trendDelta)} points over the last week.`;
    } else if (dailyReports.length > 0 && dailyReports[dailyReports.length - 1].passRate < 50) {
        alertMessage = `🚨 Last run had <50% pass rate! Only ${dailyReports[dailyReports.length - 1].passed}/${dailyReports[dailyReports.length - 1].totalBlogs} blogs passed.`;
    }
    
    return {
        overallAvgScore: totalBlogs > 0 ? Math.round((totalScore / totalBlogs) * 10) / 10 : 0,
        totalBlogsAllTime: totalBlogs,
        totalPassed,
        totalFailed,
        overallPassRate: totalBlogs > 0 ? Math.round((totalPassed / totalBlogs) * 100) : 0,
        trend,
        trendDelta,
        dailyReports,
        topErrors,
        alertNeeded,
        alertMessage
    };
}

function generateDiscordPayload(analysis: TrendAnalysis): object {
    const trendEmoji = analysis.trend === 'improving' ? '📈' : analysis.trend === 'declining' ? '📉' : '➡️';
    const color = analysis.trend === 'declining' ? 15548997 : analysis.trend === 'improving' ? 5763719 : 8421504;
    
    return {
        embeds: [{
            title: `${trendEmoji} Jules Quality Trends Report`,
            color,
            fields: [
                { name: '📊 All-Time Stats', value: `Total: ${analysis.totalBlogsAllTime} blogs\nPassed: ${analysis.totalPassed}\nFailed: ${analysis.totalFailed}\nPass Rate: ${analysis.overallPassRate}%`, inline: true },
                { name: '📈 Avg Quality Score', value: `${analysis.overallAvgScore}/100`, inline: true },
                { name: `${trendEmoji} Trend`, value: `${analysis.trend.toUpperCase()} (${analysis.trendDelta > 0 ? '+' : ''}${analysis.trendDelta})`, inline: true },
                ...(analysis.topErrors.length > 0 ? [{
                    name: '🔴 Top Errors',
                    value: analysis.topErrors.slice(0, 3).map(e => `• ${e.error} (×${e.count})`).join('\n'),
                    inline: false
                }] : [])
            ],
            footer: { text: `Report generated: ${new Date().toISOString()}` }
        }]
    };
}

async function main() {
    console.log('\n📈 Quality Trends Tracker v1.0\n');
    
    const reports = loadReports();
    
    if (reports.size === 0) {
        console.log('📭 No pipeline reports found in jules-reports/');
        console.log('   Reports are generated by the daily blog automation pipeline.');
        console.log('   Run the blog generator first to create reports.\n');
        return;
    }
    
    console.log(`📂 Found ${reports.size} daily report(s)\n`);
    
    const analysis = analyzeTrends(reports);
    
    // === DISPLAY REPORT ===
    console.log('═'.repeat(60));
    console.log('📊 QUALITY TRENDS REPORT');
    console.log('═'.repeat(60));
    console.log(`  📅 Reports analyzed:    ${reports.size} days`);
    console.log(`  📄 Total blogs:         ${analysis.totalBlogsAllTime}`);
    console.log(`  ✅ Passed:              ${analysis.totalPassed}`);
    console.log(`  ❌ Failed:              ${analysis.totalFailed}`);
    console.log(`  📊 Overall pass rate:   ${analysis.overallPassRate}%`);
    console.log(`  ⭐ Avg quality score:   ${analysis.overallAvgScore}/100`);
    
    const trendEmoji = analysis.trend === 'improving' ? '📈' : analysis.trend === 'declining' ? '📉' : '➡️';
    console.log(`  ${trendEmoji} Trend:               ${analysis.trend} (${analysis.trendDelta > 0 ? '+' : ''}${analysis.trendDelta} points)`);
    
    if (analysis.topErrors.length > 0) {
        console.log('\n  🔴 Most Common Errors:');
        analysis.topErrors.slice(0, 5).forEach(e => {
            console.log(`     ${e.count}× ${e.error}`);
        });
    }
    
    // Show daily breakdown
    if (analysis.dailyReports.length > 0) {
        console.log('\n  📅 Daily Breakdown:');
        console.log('  ┌──────────────┬───────┬────────┬────────┬───────────┐');
        console.log('  │ Date         │ Total │ Passed │ Failed │ Avg Score │');
        console.log('  ├──────────────┼───────┼────────┼────────┼───────────┤');
        for (const day of analysis.dailyReports.slice(-14)) {
            console.log(`  │ ${day.date}   │ ${String(day.totalBlogs).padStart(5)} │ ${String(day.passed).padStart(6)} │ ${String(day.failed).padStart(6)} │ ${String(day.avgScore).padStart(9)} │`);
        }
        console.log('  └──────────────┴───────┴────────┴────────┴───────────┘');
    }
    console.log('═'.repeat(60));
    
    // === ALERTS ===
    if (analysis.alertNeeded) {
        console.log(`\n🚨 ALERT: ${analysis.alertMessage}`);
    }
    
    // === SAVE OUTPUTS ===
    // Save trend analysis
    const trendPath = path.join(OUTPUT_DIR, 'quality-trends.json');
    fs.writeFileSync(trendPath, JSON.stringify(analysis, null, 2));
    console.log(`\n📄 Trends saved: ${trendPath}`);
    
    // Save Discord payload (can be used by webhook)
    const discordPayload = generateDiscordPayload(analysis);
    const discordPath = path.join(OUTPUT_DIR, 'quality-discord-payload.json');
    fs.writeFileSync(discordPath, JSON.stringify(discordPayload, null, 2));
    console.log(`📄 Discord payload saved: ${discordPath}`);
    
    // If alert needed, try to send Discord notification
    if (analysis.alertNeeded) {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(discordPayload)
                });
                if (response.ok) {
                    console.log('📡 Discord alert sent successfully!');
                }
            } catch (err) {
                console.warn('⚠️ Failed to send Discord alert');
            }
        }
    }
    
    console.log('\n✨ Quality tracking complete!\n');
}

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

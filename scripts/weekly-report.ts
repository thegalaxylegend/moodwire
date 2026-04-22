/**
 * 📊 Weekly Performance Report (NEXUS v2)
 * 
 * Aggregates the last 7 days of pipeline data and sends
 * a consolidated weekly summary to Discord.
 * 
 * Only runs on Sundays (checked internally).
 * 
 * Run: npx tsx scripts/weekly-report.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const PUBLIC_REPORTS = path.join(__dirname, '../public/jules-reports');
const ARCHIVE_DIR = path.join(REPORTS_DIR, 'archive');

const now = new Date();
const dayOfWeek = now.getUTCDay(); // 0 = Sunday

function loadJSON(filePath: string): any | null {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch { /* skip */ }
    return null;
}

async function main() {
    console.log('📊 Weekly Performance Report Generator\n');

    // Only run on Sundays
    if (dayOfWeek !== 0) {
        console.log(`📅 Today is ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}. Weekly report only runs on Sunday.`);
        console.log('✅ Skipping.\n');
        return;
    }

    console.log('📅 It\'s Sunday — generating weekly summary...\n');

    // Gather data from the last 7 days of archives
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setUTCDate(d.getUTCDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }

    // Count blogs generated this week
    let blogsGenerated = 0;
    let totalQualityScore = 0;
    let qualityCount = 0;
    let repairsFixed = 0;
    let decayFlags = 0;

    for (const dateStr of last7Days) {
        const archivePath = path.join(ARCHIVE_DIR, dateStr);
        
        // Pipeline reports
        if (fs.existsSync(archivePath)) {
            const pipelineFiles = fs.readdirSync(archivePath).filter(f => f.startsWith('pipeline-'));
            for (const pf of pipelineFiles) {
                const pipeline = loadJSON(path.join(archivePath, pf));
                if (Array.isArray(pipeline)) {
                    blogsGenerated += pipeline.length;
                    for (const blog of pipeline) {
                        if (blog.quality_score) {
                            totalQualityScore += blog.quality_score;
                            qualityCount++;
                        }
                    }
                }
            }

            // Repair reports
            const repairFiles = fs.readdirSync(archivePath).filter(f => f.startsWith('repair-'));
            for (const rf of repairFiles) {
                const repair = loadJSON(path.join(archivePath, rf));
                if (repair?.summary?.totalFixes) {
                    repairsFixed += repair.summary.totalFixes;
                }
            }

            // Decay reports
            const decayFiles = fs.readdirSync(archivePath).filter(f => f.startsWith('decay-'));
            for (const df of decayFiles) {
                const decay = loadJSON(path.join(archivePath, df));
                if (decay?.summary) {
                    decayFlags += (decay.summary.critical || 0) + (decay.summary.warning || 0);
                }
            }
        }
    }

    const avgQuality = qualityCount > 0 ? Math.round(totalQualityScore / qualityCount) : 0;

    // Get current blog count
    const blogDir = path.join(__dirname, '../src/content/blogs');
    const totalBlogs = fs.existsSync(blogDir) 
        ? fs.readdirSync(blogDir).filter(f => f.endsWith('.md')).length 
        : 0;

    // Get search intelligence summary
    const searchData = loadJSON(path.join(PUBLIC_REPORTS, 'search-intelligence.json'));
    const totalImpressions = searchData?.summary?.totalImpressions || 0;
    const totalClicks = searchData?.summary?.totalClicks || 0;
    const avgCTR = searchData?.summary?.avgCTR || 0;

    // Build Discord embed
    const embed = {
        embeds: [{
            title: `📊 Weekly Performance Report — ${last7Days[6]} to ${last7Days[0]}`,
            color: 3066993, // Green
            fields: [
                {
                    name: '📝 Content',
                    value: [
                        `• **${blogsGenerated}** new blogs generated`,
                        `• **${totalBlogs}** total blog library`,
                        `• **${avgQuality}/100** avg quality score`,
                        `• **${repairsFixed}** auto-repairs applied`,
                    ].join('\n'),
                    inline: true,
                },
                {
                    name: '🔍 Search (Last 7d)',
                    value: [
                        `• **${totalImpressions.toLocaleString()}** impressions`,
                        `• **${totalClicks.toLocaleString()}** clicks`,
                        `• **${avgCTR}%** avg CTR`,
                        `• **${decayFlags}** decay flags`,
                    ].join('\n'),
                    inline: true,
                },
            ],
            footer: { text: 'Jules Nexus v2 — Weekly Intelligence' },
            timestamp: new Date().toISOString(),
        }],
    };

    // Save report
    const reportPath = path.join(REPORTS_DIR, `weekly-${last7Days[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(embed, null, 2));
    console.log(`📄 Report saved: ${reportPath}`);

    // Send to Discord
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(embed),
            });
            if (res.ok) {
                console.log('📡 Weekly report sent to Discord!');
            } else {
                console.warn(`⚠️ Discord response: ${res.status}`);
            }
        } catch (err: any) {
            console.warn(`⚠️ Discord send failed: ${err.message}`);
        }
    } else {
        console.log('ℹ️ No DISCORD_WEBHOOK_URL set — report saved locally only.');
    }

    // Print summary
    console.log('\n═'.repeat(50));
    console.log('📊 WEEKLY SUMMARY');
    console.log('═'.repeat(50));
    console.log(`  📝 Blogs this week: ${blogsGenerated}`);
    console.log(`  📚 Total library: ${totalBlogs}`);
    console.log(`  ⭐ Avg quality: ${avgQuality}/100`);
    console.log(`  🔧 Auto-repairs: ${repairsFixed}`);
    console.log(`  📉 Decay flags: ${decayFlags}`);
    console.log(`  🔍 Impressions: ${totalImpressions.toLocaleString()}`);
    console.log(`  🖱️ Clicks: ${totalClicks.toLocaleString()}`);
    console.log('═'.repeat(50));
    console.log('\n✨ Weekly report complete!\n');
}

main().catch(console.error);

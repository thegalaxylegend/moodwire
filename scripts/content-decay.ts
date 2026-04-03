/**
 * 📉 Content Decay Detector (Module 7.5)
 * 
 * Detects blogs whose traffic is declining and auto-queues regeneration.
 * 
 * How it works:
 * 1. Reads GA4 page-level traffic data (ga4-stats.json)
 * 2. Reads GSC search data (search-intelligence.json) 
 * 3. Cross-references to find pages losing both traffic AND search position
 * 4. Flags pages with >25% traffic decline as "decaying"
 * 5. Generates a decay-regen-queue.json for the blog generator
 * 6. Outputs Discord alert for significant declines
 * 
 * Run: npx tsx scripts/content-decay.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_REPORTS = path.join(__dirname, '../public/jules-reports');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const TODAY = new Date().toISOString().split('T')[0];

const DECAY_THRESHOLD = 0.25; // 25% decline triggers flag
const MIN_IMPRESSIONS_FOR_SIGNAL = 50; // Need at least 50 impressions to have signal

interface DecayResult {
    slug: string;
    url: string;
    signals: string[];
    severity: 'critical' | 'warning' | 'monitor';
    metrics: {
        impressions: number;
        clicks: number;
        ctr: number;
        avgPosition: number;
        ga4Views: number;
    };
    recommended_action: string;
}

function loadJSON(filePath: string): any | null {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch { /* skip */ }
    return null;
}

function detectDecay(): DecayResult[] {
    console.log('🔍 Scanning for content decay signals...\n');

    const searchData = loadJSON(path.join(PUBLIC_REPORTS, 'search-intelligence.json'));
    const ga4Data = loadJSON(path.join(PUBLIC_REPORTS, 'ga4-stats.json'));
    const previousDecay = loadJSON(path.join(REPORTS_DIR, 'decay-history.json'));

    const results: DecayResult[] = [];

    // Get all blog files for cross-reference
    const blogFiles = fs.existsSync(BLOG_DIR) 
        ? new Set(fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')))
        : new Set<string>();

    // Build a map of GA4 page views
    const ga4PageViews = new Map<string, number>();
    if (ga4Data?.topPages) {
        for (const page of ga4Data.topPages) {
            const slug = page.page?.split('/').pop() || '';
            if (slug) ga4PageViews.set(slug, page.views || 0);
        }
    }

    // Analyze search data for each page
    if (searchData?.pages) {
        for (const [url, data] of Object.entries(searchData.pages) as any[]) {
            const slug = url.split('/').pop() || '';
            if (!slug || !blogFiles.has(slug)) continue;

            const signals: string[] = [];
            let severity: 'critical' | 'warning' | 'monitor' = 'monitor';

            // Retrieve metrics
            const impressions = data.impressions || 0;
            const clicks = data.clicks || 0;
            const ctr = parseFloat(data.ctr) || 0;
            const avgPosition = data.avgPosition || 0;
            const ga4Views = ga4PageViews.get(slug) || 0;

            // Skip pages with insufficient data
            if (impressions < MIN_IMPRESSIONS_FOR_SIGNAL) continue;

            // === DECAY SIGNALS ===

            // Signal 1: High impressions but very low CTR (< 1.5%)
            if (impressions > 100 && ctr < 1.5) {
                signals.push(`Low CTR: ${ctr}% on ${impressions} impressions → title/meta needs optimization`);
                severity = 'warning';
            }

            // Signal 2: High impressions but zero/near-zero clicks
            if (impressions > 200 && clicks < 3) {
                signals.push(`Ghost page: ${impressions} impressions but only ${clicks} clicks → content may not match search intent`);
                severity = 'critical';
            }

            // Signal 3: Bad average position (> 20) with some impressions
            if (avgPosition > 20 && impressions > MIN_IMPRESSIONS_FOR_SIGNAL) {
                signals.push(`Weak ranking: avg position ${avgPosition.toFixed(1)} → content depth insufficient`);
                severity = severity === 'critical' ? 'critical' : 'warning';
            }

            // Signal 4: Page appears in GSC but has zero GA4 views (indexed but not visited)
            if (impressions > 100 && ga4Views === 0) {
                signals.push(`Orphan traffic: indexed with ${impressions} impressions but 0 GA4 views → possible crawl/render issue`);
                severity = 'critical';
            }

            // Signal 5: Previously flagged and still declining
            if (previousDecay) {
                const prevEntry = Array.isArray(previousDecay) 
                    ? previousDecay.find((d: any) => d.slug === slug)
                    : null;
                if (prevEntry) {
                    signals.push(`Repeat decay: Was flagged previously and hasn't recovered`);
                    severity = 'critical';
                }
            }

            // Signal 6: Content freshness — check if blog is old and thin
            const blogPath = path.join(BLOG_DIR, `${slug}.md`);
            if (fs.existsSync(blogPath)) {
                const content = fs.readFileSync(blogPath, 'utf-8');
                const body = content.replace(/^---[\s\S]*?---\n*/m, '');
                const wordCount = body.split(/\s+/).filter(w => w.length > 0).length;

                if (wordCount < 1200) {
                    signals.push(`Thin content: only ${wordCount} words → expand with deeper explanations`);
                    severity = severity === 'critical' ? 'critical' : 'warning';
                }

                // Check for stale year references
                const currentYear = new Date().getFullYear();
                const staleYearMatch = body.match(new RegExp(`(${currentYear - 2}|${currentYear - 1})\\s*(JEE|NEET|CBSE|exam)`, 'gi'));
                if (staleYearMatch) {
                    signals.push(`Stale references: contains outdated year references`);
                }
            }

            // Only add if there are decay signals
            if (signals.length > 0) {
                let recommended_action = 'MONITOR';
                if (severity === 'critical') {
                    recommended_action = 'REGENERATE: Full content overhaul with deeper theory + updated meta tags';
                } else if (severity === 'warning') {
                    recommended_action = 'OPTIMIZE: Rewrite title/meta + expand thin sections + add internal links';
                }

                results.push({
                    slug, url, signals, severity,
                    metrics: { impressions, clicks, ctr, avgPosition, ga4Views },
                    recommended_action
                });
            }
        }
    }

    // Sort by severity (critical first), then by impressions (highest impact first)
    const severityOrder = { critical: 0, warning: 1, monitor: 2 };
    results.sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return b.metrics.impressions - a.metrics.impressions;
    });

    return results;
}

function generateRegenQueue(decayResults: DecayResult[]): any[] {
    return decayResults
        .filter(d => d.severity === 'critical' || d.severity === 'warning')
        .map(d => ({
            slug: d.slug,
            reason: d.signals[0], // Primary signal
            severity: d.severity,
            impressions: d.metrics.impressions,
            currentCTR: d.metrics.ctr,
            action: d.recommended_action
        }));
}

function generateDiscordAlert(decayResults: DecayResult[]): object | null {
    const critical = decayResults.filter(d => d.severity === 'critical');
    const warning = decayResults.filter(d => d.severity === 'warning');

    if (critical.length === 0 && warning.length === 0) return null;

    return {
        embeds: [{
            title: `📉 Content Decay Alert — ${TODAY}`,
            color: critical.length > 0 ? 15548997 : 16776960, // Red or Yellow
            fields: [
                {
                    name: '🚨 Critical',
                    value: critical.length > 0 
                        ? critical.slice(0, 5).map(d => `• \`${d.slug}\`: ${d.signals[0]}`).join('\n')
                        : 'None',
                    inline: false
                },
                {
                    name: '⚠️ Warnings',
                    value: warning.length > 0
                        ? warning.slice(0, 5).map(d => `• \`${d.slug}\`: ${d.signals[0]}`).join('\n')
                        : 'None',
                    inline: false
                },
                {
                    name: '📊 Summary',
                    value: `${critical.length} critical, ${warning.length} warnings, ${decayResults.length} total signals`,
                    inline: false
                }
            ],
            footer: { text: `Exam Compass Content Decay Detector v1.0` }
        }]
    };
}

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('📉 CONTENT DECAY DETECTOR v1.0');
    console.log('═'.repeat(60) + '\n');

    const decayResults = detectDecay();

    // Summary
    const critical = decayResults.filter(d => d.severity === 'critical');
    const warnings = decayResults.filter(d => d.severity === 'warning');
    const monitors = decayResults.filter(d => d.severity === 'monitor');

    console.log('═'.repeat(60));
    console.log('📊 DECAY ANALYSIS REPORT');
    console.log('═'.repeat(60));
    console.log(`  🚨 Critical (needs regeneration):  ${critical.length}`);
    console.log(`  ⚠️  Warning (needs optimization):   ${warnings.length}`);
    console.log(`  👀 Monitor (watch list):            ${monitors.length}`);

    if (critical.length > 0) {
        console.log('\n  🚨 CRITICAL DECAYS:');
        for (const d of critical.slice(0, 10)) {
            console.log(`     📉 ${d.slug}`);
            d.signals.forEach(s => console.log(`        └─ ${s}`));
        }
    }

    if (warnings.length > 0) {
        console.log('\n  ⚠️ WARNINGS:');
        for (const d of warnings.slice(0, 10)) {
            console.log(`     ⚠️ ${d.slug}: ${d.signals[0]}`);
        }
    }

    // Save outputs
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

    // Full decay report
    const reportPath = path.join(REPORTS_DIR, `decay-${TODAY}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
        date: TODAY,
        summary: { critical: critical.length, warning: warnings.length, monitor: monitors.length },
        results: decayResults
    }, null, 2));
    console.log(`\n  📄 Report: ${reportPath}`);

    // Decay history (for tracking repeat offenders)
    fs.writeFileSync(path.join(REPORTS_DIR, 'decay-history.json'), JSON.stringify(decayResults, null, 2));

    // Regen queue
    const regenQueue = generateRegenQueue(decayResults);
    if (regenQueue.length > 0) {
        const queuePath = path.join(REPORTS_DIR, `decay-regen-queue.json`);
        fs.writeFileSync(queuePath, JSON.stringify(regenQueue, null, 2));
        console.log(`  📋 Regen queue: ${queuePath} (${regenQueue.length} pages)`);
    }

    // Discord alert
    const discordPayload = generateDiscordAlert(decayResults);
    if (discordPayload) {
        const discordPath = path.join(REPORTS_DIR, 'decay-discord-payload.json');
        fs.writeFileSync(discordPath, JSON.stringify(discordPayload, null, 2));
        console.log(`  📡 Discord alert: ${discordPath}`);

        // Try sending
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                const res = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(discordPayload)
                });
                if (res.ok) console.log('  📡 Discord alert SENT!');
            } catch { console.warn('  ⚠️ Discord send failed'); }
        }
    }

    // Save to public for admin dashboard
    if (!fs.existsSync(PUBLIC_REPORTS)) fs.mkdirSync(PUBLIC_REPORTS, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC_REPORTS, 'content-decay.json'), JSON.stringify({
        date: TODAY,
        summary: { critical: critical.length, warning: warnings.length, monitor: monitors.length },
        topDecays: decayResults.slice(0, 15)
    }, null, 2));

    console.log('\n✨ Content decay analysis complete!\n');
}

export { main as detectDecay };

main().catch(err => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

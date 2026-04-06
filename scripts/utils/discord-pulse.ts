
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORTS_DIR = path.join(__dirname, '../../jules-reports');
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordEmbed(embed: any) {
    if (!WEBHOOK_URL) {
        console.warn("⚠️ DISCORD_WEBHOOK_URL not set. Skipping notification.");
        return;
    }
    try {
        await axios.post(WEBHOOK_URL, { embeds: [embed] });
        console.log(`✅ Discord Pulse: Delivered.`);
    } catch (err) {
        console.error("❌ Discord Pulse Failed:", err);
    }
}

async function handleNewBlogs() {
    // Collect from current run (heuristic: find blogs with today's date)
    const BLOG_DIR = path.join(__dirname, '../../src/content/blogs');
    const today = new Date().toISOString().split('T')[0];
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    const newBlogs = files.filter(f => {
        const content = fs.readFileSync(path.join(BLOG_DIR, f), 'utf-8');
        return content.includes(`date: "${today}"`) || content.includes(`date: '${today}'`);
    });

    if (newBlogs.length === 0) return;

    const embed = {
        title: "📑 New Content Deployment: Successful",
        description: `Successfully published ${newBlogs.length} new high-yield blogs.`,
        color: 0x2ECC71, // Green
        fields: newBlogs.slice(0, 6).map(f => ({
            name: f.replace('.md', '').toUpperCase(),
            value: `[View Live](https://examcompass.pages.dev/blog/${f.replace('.md', '')})`,
            inline: true
        })),
        footer: { text: "Professional Content Auditor | Jules System" }
    };

    await sendDiscordEmbed(embed);
}

async function handleRefinedBlogs() {
    // Collect from patch-generator OR quality-patch logs
    const patchLog = path.join(REPORTS_DIR, 'patch-report.json');
    if (!fs.existsSync(patchLog)) return;

    const patchData = JSON.parse(fs.readFileSync(patchLog, 'utf-8'));
    const refined = patchData.refined_blogs || [];

    if (refined.length === 0) return;

    const embed = {
        title: "🧬 Content Refinement: Status Report",
        description: `Grouped summary of ${refined.length} blogs rehabilitated in this run.`,
        color: 0x3498DB, // Blue
        fields: refined.slice(0, 6).map((r: any) => ({
            name: `${r.slug.toUpperCase()}`,
            value: `**Improv**: ${r.sections?.join(', ') || 'N/A'}\n[URL](https://examcompass.pages.dev/blog/${r.slug})`,
            inline: false
        })),
        footer: { text: "Professional Content Auditor | Jules System" }
    };

    await sendDiscordEmbed(embed);
}

async function handleSystemPulse() {
    const syllabus = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'syllabus-completion.json'), 'utf-8') || "{}");
    const evolved = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'evolved-prompt.json'), 'utf-8') || "{}");
    const autopsy = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, 'autopsy-report.json'), 'utf-8') || "{}");
    const stats = fs.readdirSync(path.join(__dirname, '../../src/content/blogs')).filter(f => f.endsWith('.md')).length;

    const embed = {
        title: "🛰️ System Pulse: 360° Audit Report",
        description: "Professional synthesis of pipeline performance and content integrity.",
        color: 0xE67E22, // Orange
        fields: [
            { name: "📊 Syllabus Coverage", value: `Overall: **${syllabus.overall?.percentage || 0}%**\nClass 12: **${syllabus.byClass?.['Class 12']?.percentage || 0}%** | Class 11: **${syllabus.byClass?.['Class 11']?.percentage || 0}%**`, inline: false },
            { name: "🧬 Prompt Evolution", value: (evolved.changelog || []).map((c: string) => `• ${c}`).join('\n') || "No evolution changes this run.", inline: false },
            { name: "📏 Total Quantum", value: `${stats} Blogs live in repository.`, inline: true },
            { name: "🕵️ Auditor: Unexpected Flaws", value: (autopsy.unpredicted || []).map((f: string) => `• ${f}`).join('\n') || "No unpredicted flaws detected.", inline: false },
            { name: "⚠️ Auditor: Known Flaws", value: (autopsy.flaws || []).map((f: string) => `• ${f}`).join('\n') || "Safe run.", inline: false },
            { name: "💡 Auditor: Insights", value: (autopsy.insights || []).map((i: string) => `• ${i}`).join('\n') || "N/A", inline: false }
        ],
        footer: { text: "Professional Content Auditor | Jules System" }
    };

    await sendDiscordEmbed(embed);
}

const flag = process.argv[2];
if (flag === "--new") handleNewBlogs();
else if (flag === "--refined") handleRefinedBlogs();
else if (flag === "--pulse") handleSystemPulse();
else {
    console.log("Usage: node discord-pulse.ts [--new|--refined|--pulse]");
}

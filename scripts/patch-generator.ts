
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';
import { checkBlogQuality, jsonToMarkdown, standardizeMarkdown, BlogPostJSON, QualityReport, Section } from './utils/jules-quality.js';
import { godSafeParse } from './utils/god-json.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');

import { nodeRouter } from './utils/nodeRouter.ts';

async function generatePatch(topic: string, sectionName: string): Promise<any> {
    console.log(`🩹 Generating patch for: ${sectionName}...`);
    const system = `You are a JEE/NEET Ranker. Output ONLY valid JSON for a missing blog section.
    Rules: Double-escape LaTeX \\\\frac{} and use Markdown for the body.`;
    const user = `Generate the missing section "${sectionName}" for the topic "${topic}".
    Return as JSON: { "heading": "${sectionName}", "body": "Detailed content...", "table": { "headers": [], "rows": [[]] } }`;

    try {
        const result = await nodeRouter.route(
            [{ role: "system", content: system }, { role: "user", content: user }],
            'T1',
            { jsonMode: true, temperature: 0.7 }
        );
        return godSafeParse(result);
    } catch (err: any) {
        console.error(`🚨 [PatchGen] LLM Routing failed: ${err.message}`);
        return null;
    }
}

// --- MAIN PATCH ENGINE ---
async function patchSystem() {
    console.log("🛠️ Jules Self-Healing: Starting Patch Engine...");

    const latestReportFile = fs.readdirSync(REPORTS_DIR)
        .filter(f => f.startsWith('pipeline-') && f.endsWith('.json'))
        .sort().reverse()[0];

    if (!latestReportFile) return console.log("📭 No pipeline report found.");

    const reportPath = path.join(REPORTS_DIR, latestReportFile);
    const reportList = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    const patchable = reportList.filter((b: any) => 
        b.status === "failed" && 
        b.quality_report?.regenerate_all === false && 
        b.quality_report?.patch_missing_sections?.length > 0
    );

    console.log(`🔍 Found ${patchable.length} patchable blogs.`);

    // Always write patch-report.json so Discord --refined pulse has something to read
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const patchReportPath = path.join(REPORTS_DIR, 'patch-report.json');
    const patchedBlogsList: any[] = [];

    for (const blog of patchable) {
        const filePath = path.join(BLOG_DIR, `${blog.slug}.md`);
        if (!fs.existsSync(filePath)) continue;

        console.log(`\n🩹 Patching: ${blog.slug}`);
        const originalContent = fs.readFileSync(filePath, 'utf-8');
        
        // Extract title/topic from filename/content
        const topic = blog.slug.replace(/-/g, ' ');

        const patches: Section[] = [];
        for (const sectionName of blog.quality_report.patch_missing_sections) {
            const patch = await generatePatch(topic, sectionName);
            if (patch) patches.push(patch);
            await sleep(2000);
        }

        if (patches.length > 0) {
            // Append patches to the bottom of the content but before the footer
            const footerSplit = "---";
            const parts = originalContent.split(footerSplit);
            
            // Reconstruct the JSON object for quality check
            // (In a real scenario, we'd parse the whole MD, but for patching we can just append)
            const patchMarkdown = patches.map(p => `\n## ${p.heading}\n\n${p.body}\n`).join('\n');
            
            // Very basic injection before the last horizontal rule (footer)
            let newContent = originalContent;
            const lastHrIdx = originalContent.lastIndexOf("\n---\n\n### 🚀 Ready to Ace");
            if (lastHrIdx !== -1) {
                newContent = originalContent.slice(0, lastHrIdx) + patchMarkdown + originalContent.slice(lastHrIdx);
            } else {
                newContent += patchMarkdown;
            }

            fs.writeFileSync(filePath, newContent);
            console.log(`✅ Patched and Updated: ${blog.slug}`);
            
            // Update report status (Local only)
            blog.status = "patched";
            patchedBlogsList.push({
                slug: blog.slug,
                sections: blog.quality_report.patch_missing_sections,
                patchedAt: new Date().toISOString()
            });
        }
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportList, null, 2));

    // Always write patch-report.json (even if empty) so Discord pulse can read it
    fs.writeFileSync(patchReportPath, JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        refined_blogs: patchedBlogsList,
        total: patchedBlogsList.length
    }, null, 2));
    console.log(`📄 Patch report saved: ${patchReportPath}`);
    console.log("\n✨ Self-Healing cycle complete.");
}

patchSystem().catch(console.error);

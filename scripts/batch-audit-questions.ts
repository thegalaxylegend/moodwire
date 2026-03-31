
import { generateInspiredQuestion } from '../src/services/questionEngine';
import { SYLLABUS_DB } from '../src/lib/constants';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ENVIRONMENT FOR NODE ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
        clear: () => null,
    };
}

// polyfill import.meta.env
if (typeof (global as any).import === 'undefined') {
    (global as any).import = { meta: { env: process.env } };
}

// Since import.meta.env is a Vite thing, we need to bridge it for Node
// We'll manually populate what's needed for the engine
const env = {
    VITE_GROQ_API_KEY: process.env.GROQ_API_KEY,
    VITE_GROQ_API_KEY_2: process.env.VITE_GROQ_API_KEY_2,
    VITE_GROQ_API_KEY_3: process.env.VITE_GROQ_API_KEY_3,
    VITE_GROQ_API_KEY_4: process.env.VITE_GROQ_API_KEY_4,
    VITE_GROQ_API_KEY_5: process.env.VITE_GROQ_API_KEY_5,
    VITE_GROQ_API_KEY_6: process.env.VITE_GROQ_API_KEY_6,
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
};

// Injection hack for the modules that use import.meta.env
(global as any).importMetaEnv = env;

async function runAudit() {
    console.log("🚀 Starting 100-Question Audit...");
    
    const results: any[] = [];
    const class11Topics: any[] = [];
    const class12Topics: any[] = [];

    // Select topics
    Object.entries(SYLLABUS_DB).forEach(([subject, topics]) => {
        topics.forEach(t => {
            if (t.class === 'Class 11' && class11Topics.length < 50) {
                class11Topics.push({ subject, ...t });
            } else if (t.class === 'Class 12' && class12Topics.length < 50) {
                class12Topics.push({ subject, ...t });
            }
        });
    });

    const allTasks = [...class11Topics, ...class12Topics];
    let correctCount = 0;
    let repairedCount = 0;
    let failedCount = 0;

    const reportPath = path.join(process.cwd(), 'audit_report_100_questions.md');
    let mdContent = `# 100-Question Generation Audit Report\n\n`;
    mdContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    mdContent += `## Executive Summary\n`;
    mdContent += `| Status | Count | Description |\n`;
    mdContent += `| :--- | :--- | :--- |\n`;
    mdContent += `| ✅ Correct | {{CORRECT}} | Passed verifier on first try |\n`;
    mdContent += `| 🛠️ Repaired | {{REPAIRED}} | Model B corrected Model A |\n`;
    mdContent += `| ❌ Failed | {{FAILED}} | Rejected by verifier or Error |\n\n`;
    mdContent += `--- \n\n`;

    fs.writeFileSync(reportPath, mdContent);

    for (let i = 0; i < allTasks.length; i++) {
        const task = allTasks[i];
        console.log(`[${i+1}/100] Generating for ${task.class} | ${task.subject} | ${task.topic}...`);
        
        try {
            // We use different exams for variety
            const exam = task.class === 'Class 11' ? 'JEE-Mains' : 'NEET';
            const result = await generateInspiredQuestion({
                exam,
                subject: task.subject,
                topic: task.topic,
                difficulty: 'Medium'
            });

            let status = "";
            let statusEmoji = "";

            if (result) {
                // Check if it was refixed (we can infer from confidence score we just implemented)
                const isRefixed = result.confidence === 0.70;
                if (isRefixed) {
                    repairedCount++;
                    status = "REPAIRED";
                    statusEmoji = "🛠️";
                } else {
                    correctCount++;
                    status = "CORRECT";
                    statusEmoji = "✅";
                }

                let entry = `### ${i+1}. ${statusEmoji} ${task.topic} (${task.class})\n`;
                entry += `**Status**: ${status}\n\n`;
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Options**: ${result.options.join(' | ')}\n\n`;
                entry += `> **Correct Answer**: ${result.correct_answer}\n\n`;
                entry += `> **Confidence**: ${result.confidence}\n\n`;
                entry += `--- \n\n`;
                fs.appendFileSync(reportPath, entry);
            } else {
                failedCount++;
                status = "FAILED";
                statusEmoji = "❌";
                fs.appendFileSync(reportPath, `### ${i+1}. ${statusEmoji} ${task.topic} (${task.class})\n**Status**: REJECTED/FAILED\n\n--- \n\n`);
            }
        } catch (err) {
            failedCount++;
            console.error(`Error generating question ${i+1}:`, err);
            fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${task.topic} (${task.class})\n**Error**: ${err.message}\n\n--- \n\n`);
        }
        
        // Brief sleep to avoid hitting rate limits too hard
        await new Promise(r => setTimeout(r, 500));
    }

    // Final Summary Update
    let finalMd = fs.readFileSync(reportPath, 'utf8');
    finalMd = finalMd.replace('{{CORRECT}}', correctCount.toString());
    finalMd = finalMd.replace('{{REPAIRED}}', repairedCount.toString());
    finalMd = finalMd.replace('{{FAILED}}', failedCount.toString());
    fs.writeFileSync(reportPath, finalMd);

    console.log("✅ Audit Complete!");
    console.log(`Summary: Correct: ${correctCount}, Repaired: ${repairedCount}, Failed: ${failedCount}`);
}

runAudit().catch(err => {
    console.error("FATAL AUDIT ERROR:", err);
    process.exit(1);
});

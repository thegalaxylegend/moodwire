
import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function runReAudit() {
    console.log("🚀 Starting 20-Question Remediation Re-Audit (70B Verifier)...");
    
    // Targeted list of topics including known prior failures
    const topics = [
        { topic: 'Units and Measurements', subject: 'Physics', class: 'Class 11' },
        { topic: 'Motion in a Straight Line', subject: 'Physics', class: 'Class 11' },
        { topic: 'Gravitation', subject: 'Physics', class: 'Class 11' },
        { topic: 'Thermodynamics', subject: 'Physics', class: 'Class 11' },
        { topic: 'Bohr Model', subject: 'Physics', class: 'Class 12' },
        { topic: 'Redox Reactions', subject: 'Chemistry', class: 'Class 11' },
        { topic: 'Chemical Equilibrium', subject: 'Chemistry', class: 'Class 11' },
        { topic: 'States of Matter', subject: 'Chemistry', class: 'Class 11' },
        { topic: 'Trigonometric Functions', subject: 'Mathematics', class: 'Class 11' },
        { topic: 'Complex Numbers', subject: 'Mathematics', class: 'Class 11' },
        { topic: 'Binomial Theorem', subject: 'Mathematics', class: 'Class 11' },
        { topic: 'Determinants', subject: 'Mathematics', class: 'Class 12' },
        { topic: 'Vector Algebra', subject: 'Mathematics', class: 'Class 12' },
        { topic: 'Biological Classification', subject: 'Biology', class: 'Class 11' },
        { topic: 'Evolution', subject: 'Biology', class: 'Class 12' },
        { topic: 'Principles of Inheritance', subject: 'Biology', class: 'Class 12' },
        { topic: 'Molecular Basis of Inheritance', subject: 'Biology', class: 'Class 12' },
        { topic: 'Electrostatics', subject: 'Physics', class: 'Class 12' },
        { topic: 'Current Electricity', subject: 'Physics', class: 'Class 12' },
        { topic: 'Organic Chemistry: Basic Principles', subject: 'Chemistry', class: 'Class 11' }
    ];

    const reportPath = path.join(process.cwd(), 're_audit_20_questions_report.md');
    let mdContent = `# 20-Question Remediation Re-Audit Report\n\n`;
    mdContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    mdContent += `**Summary of Improvements**: 70B Verifier, Chain-of-Thought prompts, and Heuristic Garbage Filters.\n\n`;
    mdContent += `## Executive Summary\n`;
    mdContent += `| Status | Count | Description |\n`;
    mdContent += `| :--- | :--- | :--- |\n`;
    mdContent += `| ✅ Correct | {{CORRECT}} | Passed 70B verifier on first try |\n`;
    mdContent += `| 🛠️ Repaired | {{REPAIRED}} | 70B Model fixed errors in 70B Generator |\n`;
    mdContent += `| ❌ Rejected | {{REJECTED}} | Heuristic or Verifier blocked question |\n\n`;
    mdContent += `--- \n\n`;
    fs.writeFileSync(reportPath, mdContent);

    let correctCount = 0;
    let repairedCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < topics.length; i++) {
        const t = topics[i];
        console.log(`[${i+1}/20] Auditing ${t.topic}...`);
        
        try {
            const result = await generateInspiredQuestion({
                exam: 'JEE-Mains',
                subject: t.subject,
                topic: t.topic,
                difficulty: 'Medium',
                // @ts-ignore
                noCache: true 
            });

            let status = "";
            let statusEmoji = "";

            if (result) {
                if (result.confidence === 0.70) {
                    repairedCount++;
                    status = "🛠️ REFIXED BY 70B";
                    statusEmoji = "🛠️";
                } else {
                    correctCount++;
                    status = "✅ APPROVED BY 70B";
                    statusEmoji = "✅";
                }

                let entry = `### ${i+1}. ${statusEmoji} ${t.topic} (${t.class})\n`;
                entry += `**Status**: ${status}\n\n`;
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Options**: ${Array.isArray(result.options) ? result.options.join(' | ') : result.options}\n\n`;
                entry += `> **Correct Answer**: ${result.correct_answer}\n\n`;
                entry += `> **Confidence**: ${result.confidence}\n\n`;
                entry += `> **Internal Logic**: (Derived by 70B Verifier during check)\n\n`;
                entry += `--- \n\n`;
                fs.appendFileSync(reportPath, entry);
            } else {
                rejectedCount++;
                fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic} (${t.class})\n**Status**: REJECTED/FAILED\n\n--- \n\n`);
            }
        } catch (err: any) {
            rejectedCount++;
            fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic} (${t.class})\n**Error**: ${err.message}\n\n--- \n\n`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }

    let finalMd = fs.readFileSync(reportPath, 'utf8');
    finalMd = finalMd.replace('{{CORRECT}}', correctCount.toString());
    finalMd = finalMd.replace('{{REPAIRED}}', repairedCount.toString());
    finalMd = finalMd.replace('{{REJECTED}}', rejectedCount.toString());
    fs.writeFileSync(reportPath, finalMd);

    console.log("✅ Re-Audit Complete!");
}

runReAudit();


import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function runFinalAudit() {
    console.log("🚀 Starting FINAL 20-Question Accuracy Audit (Sanity Check + 70B)...");
    
    // Diverse and challenging topics
    const topics = [
        { topic: 'Wave Optics', subject: 'Physics', class: 'Class 12' },
        { topic: 'Nuclei', subject: 'Physics', class: 'Class 12' },
        { topic: 'Dual Nature of Radiation', subject: 'Physics', class: 'Class 12' },
        { topic: 'Chemical Kinetics', subject: 'Chemistry', class: 'Class 12' },
        { topic: 'Surface Chemistry', subject: 'Chemistry', class: 'Class 12' },
        { topic: 'Biomolecules', subject: 'Chemistry', class: 'Class 12' },
        { topic: 'Probability', subject: 'Mathematics', class: 'Class 12' },
        { topic: 'Differential Equations', subject: 'Mathematics', class: 'Class 12' },
        { topic: '3D Geometry', subject: 'Mathematics', class: 'Class 12' },
        { topic: 'Biotechnology: Principles', subject: 'Biology', class: 'Class 12' },
        { topic: 'Human Health and Disease', subject: 'Biology', class: 'Class 12' },
        { topic: 'Work, Energy and Power', subject: 'Physics', class: 'Class 11' },
        { topic: 'Oscillations', subject: 'Physics', class: 'Class 11' },
        { topic: 'Some Basic Concepts of Chemistry', subject: 'Chemistry', class: 'Class 11' },
        { topic: 'Hydrogen', subject: 'Chemistry', class: 'Class 11' },
        { topic: 'Limits and Derivatives', subject: 'Mathematics', class: 'Class 11' },
        { topic: 'Statistics', subject: 'Mathematics', class: 'Class 11' },
        { topic: 'Plant Kingdom', subject: 'Biology', class: 'Class 11' },
        { topic: 'Cell Cycle and Cell Division', subject: 'Biology', class: 'Class 11' },
        { topic: 'Environmental Issues', subject: 'Biology', class: 'Class 12' }
    ];

    const reportPath = path.join(process.cwd(), 'final_audit_20_questions_report.md');
    let mdContent = `# FINAL 20-Question Accuracy Audit Report\n\n`;
    mdContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    mdContent += `**Safety Layers**: 70B Verifier + **STEP 0 Sanity Check** + Heuristic Garbage Filters.\n\n`;
    mdContent += `## Executive Summary\n`;
    mdContent += `| Status | Count | Description |\n`;
    mdContent += `| :--- | :--- | :--- |\n`;
    mdContent += `| ✅ Approved | {{CORRECT}} | Passed all safety walls (Stability, Sanity, Derivation) |\n`;
    mdContent += `| 🛠️ Repaired | {{REPAIRED}} | 70B Verifier corrected a flawed generation |\n`;
    mdContent += `| ❌ Rejected | {{REJECTED}} | Blocked by Sanity Check or Heuristics (Bad Data Filtered) |\n\n`;
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

            if (result) {
                if (result.confidence === 0.70) {
                    repairedCount++;
                    const entry = `### ${i+1}. 🛠️ ${t.topic} (${t.class})\n**Status**: REFIXED\n\n> **Question**: ${result.question}\n\n> **Ans**: ${result.correct_answer}\n\n--- \n\n`;
                    fs.appendFileSync(reportPath, entry);
                } else {
                    correctCount++;
                    const entry = `### ${i+1}. ✅ ${t.topic} (${t.class})\n**Status**: APPROVED\n\n> **Question**: ${result.question}\n\n> **Ans**: ${result.correct_answer}\n\n--- \n\n`;
                    fs.appendFileSync(reportPath, entry);
                }
            } else {
                rejectedCount++;
                fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic} (${t.class})\n**Status**: REJECTED BY SANITY CHECK\n\n--- \n\n`);
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

    console.log("✅ Final Audit Complete!");
}

runFinalAudit();

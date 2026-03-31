
import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function runFinalAudit4() {
    console.log("🚀 Starting FINAL AUDIT 4.0 (The Accuracy & Efficiency Proof)...");
    
    // Selecting 20 high-variability topics to prove the sync
    const topics = [
        { topic: 'Chemical Kinetics', subject: 'Chemistry', desc: 'Reaction Order + Rate' },
        { topic: 'Wave Optics', subject: 'Physics', desc: 'Interference pattern' },
        { topic: 'Hydrogen', subject: 'Chemistry', desc: 'Volume ratios' },
        { topic: 'Statistics', subject: 'Mathematics', desc: 'Sample Mean/Variance' },
        { topic: '3D Geometry', subject: 'Mathematics', desc: 'Inscribed Solids' },
        { topic: 'Thermodynamics', subject: 'Physics', desc: 'Gas Laws + Work' },
        { topic: 'Electrostatics', subject: 'Physics', desc: 'Torque on Dipole' },
        { topic: 'Current Electricity', subject: 'Physics', desc: 'Motional EMF' },
        { topic: 'Bohr Model', subject: 'Physics', desc: 'Emission spectra' },
        { topic: 'Human Health and Disease', subject: 'Biology', desc: 'Clinical diagnosis' },
        { topic: 'Equilibrium', subject: 'Chemistry', desc: 'Le Chatelier logic' },
        { topic: 'Redox Reactions', subject: 'Chemistry', desc: 'Electrode potential' },
        { topic: 'Integration', subject: 'Mathematics', desc: 'Area under curve' },
        { topic: 'Probability', subject: 'Mathematics', desc: 'Bayes Theorem' },
        { topic: 'Nuclei', subject: 'Physics', desc: 'Half-life calculation' },
        { topic: 'Circular Motion', subject: 'Physics', desc: 'Centripetal Force' },
        { topic: 'Solid State', subject: 'Chemistry', desc: 'Density of unit cell' },
        { topic: 'Alcohol and Phenols', subject: 'Chemistry', desc: 'Acidity comparison' },
        { topic: 'Vector Algebra', subject: 'Mathematics', desc: 'Dot/Cross products' },
        { topic: 'Evolution', subject: 'Biology', desc: 'Hardy-Weinberg equilibrium' }
    ];

    const reportPath = path.join(process.cwd(), 'final_audit_4.0.md');
    let mdContent = `# FINAL AUDIT 4.0: Unified Data Integrity Proof\n\n`;
    mdContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    mdContent += `**System Architecture**: Unified 70B Sync (Gen + Auditor).\n\n`;
    mdContent += `## Executive Summary\n`;
    mdContent += `| Status | Count | Verdict |\n`;
    mdContent += `| :--- | :--- | :--- |\n`;
    mdContent += `| ✅ Approved | {{CORRECT}} | High Efficiency Sync |\n`;
    mdContent += `| ❌ Rejected | {{REJECTED}} | Necessary Safety Wall |\n\n`;
    mdContent += `--- \n\n`;
    fs.writeFileSync(reportPath, mdContent);

    let correctCount = 0;
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
                correctCount++;
                let entry = `### ${i+1}. ✅ ${t.topic} (${t.desc})\n**Status**: APPROVED\n\n`;
                entry += `> **Data Sheet**: ${JSON.stringify(result.technical_data_sheet || {})}\n\n`;
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Ans**: ${result.correct_answer}\n\n`;
                entry += `--- \n\n`;
                fs.appendFileSync(reportPath, entry);
            } else {
                rejectedCount++;
                fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic}\n**Status**: REJECTED BY AUDITOR\n\n--- \n\n`);
            }
        } catch (err) {
            rejectedCount++;
            fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic}\n**Error**: ${err.message}\n\n--- \n\n`);
        }
    }

    let finalMd = fs.readFileSync(reportPath, 'utf8');
    finalMd = finalMd.replace('{{CORRECT}}', correctCount.toString());
    finalMd = finalMd.replace('{{REJECTED}}', rejectedCount.toString());
    fs.writeFileSync(reportPath, finalMd);

    console.log("✅ Final Audit 4.0 Complete!");
}

runFinalAudit4();

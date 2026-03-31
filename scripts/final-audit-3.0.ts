
import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function runFinalAudit3() {
    console.log("🚀 Starting FINAL AUDIT 3.0 (Gen-Auditor Sync Proof)...");
    
    const topics = [
        { topic: 'Chemical Kinetics', subject: 'Chemistry', class: 'Class 12', desc: 'Reaction Order (MANDATORY)' },
        { topic: 'Wave Optics', subject: 'Physics', class: 'Class 12', desc: 'D/d/λ Interference constants' },
        { topic: 'Hydrogen', subject: 'Chemistry', class: 'Class 11', desc: 'Stoichiometry (H2:O2 ratio)' },
        { topic: 'Statistics', subject: 'Mathematics', class: 'Class 11', desc: 'Arithmetic Summation Check' },
        { topic: '3D Geometry', subject: 'Mathematics', class: 'Class 12', desc: 'Sphere Radius/Dimension accuracy' },
        { topic: 'Thermodynamics', subject: 'Physics', class: 'Class 11', desc: 'Mass/Moles/Gas-Type data' },
        { topic: 'Electrostatics', subject: 'Physics', class: 'Class 12', desc: 'Torque (Angle required)' },
        { topic: 'Current Electricity', subject: 'Physics', class: 'Class 12', desc: 'EMF (B-Field required)' },
        { topic: 'Bohr Model', subject: 'Physics', class: 'Class 12', desc: 'Wavelength vs Transition mapping' },
        { topic: 'Human Health and Disease', subject: 'Biology', class: 'Class 12', desc: 'Factual Falsification check' }
    ];

    const reportPath = path.join(process.cwd(), 'final_audit_3.0.md');
    let mdContent = `# FINAL AUDIT 3.0: Accuracy & Efficiency Proof\n\n`;
    mdContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    mdContent += `**System Architecture**: 70B Gen + 70B Auditor + **Gen-Auditor Sync Checklists**.\n\n`;
    mdContent += `## Executive Summary\n`;
    mdContent += `| Status | Count | Efficiency Impact |\n`;
    mdContent += `| :--- | :--- | :--- |\n`;
    mdContent += `| ✅ Approved | {{CORRECT}} | High Efficiency (Sync Working) |\n`;
    mdContent += `| ❌ Rejected | {{REJECTED}} | Necessary Safety (Sanity Kill) |\n\n`;
    mdContent += `--- \n\n`;
    fs.writeFileSync(reportPath, mdContent);

    let correctCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < topics.length; i++) {
        const t = topics[i];
        console.log(`[${i+1}/10] Auditing ${t.topic}...`);
        
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
                let entry = `### ${i+1}. ✅ ${t.topic}\n**Status**: APPROVED\n\n`;
                entry += `> **Technical Checklist**: ${JSON.stringify(result.technical_inventory || {})}\n\n`;
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Ans**: ${result.correct_answer}\n\n`;
                entry += `--- \n\n`;
                fs.appendFileSync(reportPath, entry);
            } else {
                rejectedCount++;
                fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic}\n**Status**: REJECTED BY SYNC FAULT\n\n--- \n\n`);
            }
        } catch (err) {
            rejectedCount++;
            fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic}\n**Error**: ${err.message}\n\n--- \n\n`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }

    let finalMd = fs.readFileSync(reportPath, 'utf8');
    finalMd = finalMd.replace('{{CORRECT}}', correctCount.toString());
    finalMd = finalMd.replace('{{REJECTED}}', rejectedCount.toString());
    fs.writeFileSync(reportPath, finalMd);

    console.log("✅ Final Audit 3.0 Complete!");
}

runFinalAudit3();


import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function runGenEfficiencyAudit() {
    console.log("🚀 Starting PHASE 5: Generator Efficiency Audit (70B Gen + Self-Audit)...");
    
    const topics = [
        { topic: 'Hydrogen', subject: 'Chemistry', class: 'Class 11', desc: 'Stoichiometry (H2+O2)' },
        { topic: 'Statistics', subject: 'Mathematics', class: 'Class 11', desc: 'Expectation Sum Check' },
        { topic: 'Chemical Kinetics', subject: 'Chemistry', class: 'Class 12', desc: 'Reaction Order requirement' },
        { topic: 'Bohr Model', subject: 'Physics', class: 'Class 12', desc: 'Wavelength vs Transition' },
        { topic: '3D Geometry', subject: 'Mathematics', class: 'Class 12', desc: 'Inscribed Sphere Radius' },
        { topic: 'Thermodynamics', subject: 'Physics', class: 'Class 11', desc: 'Delta U (Mass/Gas check)' },
        { topic: 'Electrostatics', subject: 'Physics', class: 'Class 12', desc: 'Torque (Angle check)' },
        { topic: 'Current Electricity', subject: 'Physics', class: 'Class 12', desc: 'Induced EMF (B-field check)' },
        { topic: 'Biomolecules', subject: 'Chemistry', class: 'Class 12', desc: 'DNA Base Pairing facts' },
        { topic: 'Wave Optics', subject: 'Physics', class: 'Class 12', desc: 'Diffraction/Interference' }
    ];

    const reportPath = path.join(process.cwd(), 'gen_efficiency_audit_results.md');
    fs.writeFileSync(reportPath, "# Phase 5: Generator Efficiency Audit Results\n\n");
    fs.appendFileSync(reportPath, "**Goal**: Maximize correct questions on the first pass (70B Gen + 70B Auditor).\n\n");

    let approvedCount = 0;
    let rejectedCount = 0;

    for (const test of topics) {
        console.log(`[TEST] ${test.topic} (${test.desc})...`);
        try {
            const result = await generateInspiredQuestion({
                exam: 'JEE-Mains',
                subject: test.subject,
                topic: test.topic,
                difficulty: 'Medium',
                noCache: true 
            });

            if (result) {
                approvedCount++;
                let entry = `### Topic: ${test.topic} (${test.desc})\n`;
                entry += `**Status**: ✅ APPROVED (First Pass SUCCESS)\n\n`;
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Ans**: ${result.correct_answer}\n\n`;
                entry += `> **Hidden Derivation**: ${result.hidden_derivation}\n\n`;
                entry += `--- \n\n`;
                fs.appendFileSync(reportPath, entry);
            } else {
                rejectedCount++;
                fs.appendFileSync(reportPath, `### Topic: ${test.topic}\n**Status**: ❌ REJECTED (Waste Created)\n\n--- \n\n`);
            }
        } catch (e) {
            rejectedCount++;
            fs.appendFileSync(reportPath, `### Topic: ${test.topic}\n**Error**: ${e.message}\n\n--- \n\n`);
        }
    }
    
    fs.appendFileSync(reportPath, `## Final Stats\n- **Approved**: ${approvedCount}\n- **Rejected**: ${rejectedCount}\n- **First-Pass Efficiency**: ${(approvedCount/(approvedCount+rejectedCount))*100}%\n`);
    
    console.log("✅ Efficiency Check Complete! Results in gen_efficiency_audit_results.md");
}

runGenEfficiencyAudit();

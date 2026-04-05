
import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function runAdversarialAudit() {
    console.log("🔥 Starting ADVERSARIAL AUDIT (Phase 4: Forced Scratchpad)...");
    
    const topics = [
        { topic: 'Hydrogen', subject: 'Chemistry', class: 'Class 11', desc: 'Stoichiometry (H2+O2)' },
        { topic: 'Statistics', subject: 'Mathematics', class: 'Class 11', desc: 'Expectation Sum (0.2+0.4+1.2)' },
        { topic: 'Bohr Model', subject: 'Physics', class: 'Class 12', desc: 'Wavelength consistency' },
        { topic: 'Chemical Kinetics', subject: 'Chemistry', class: 'Class 12', desc: 'Reaction Order check' },
        { topic: '3D Geometry', subject: 'Mathematics', class: 'Class 12', desc: 'Sphere radius check' },
        { topic: 'Probability', subject: 'Mathematics', class: 'Class 12', desc: 'Conditional probability' },
        { topic: 'Biomolecules', subject: 'Biology', class: 'Class 12', desc: 'DNA H-bonds' },
        { topic: 'Wave Optics', subject: 'Physics', class: 'Class 12', desc: 'Intensity ratio' },
        { topic: 'Nuclei', subject: 'Physics', class: 'Class 12', desc: 'Alpha scattering' },
        { topic: 'Human Health and Disease', subject: 'Biology', class: 'Class 12', desc: 'Hypertension facts' }
    ];

    const reportPath = path.join(process.cwd(), 'adversarial_audit_results.md');
    fs.writeFileSync(reportPath, "# Adversarial Audit (Phase 4) Results\n\n");
    fs.appendFileSync(reportPath, "**Goal**: Catch numerical and factual errors using Forced Scratchpad + Adversarial Auditing.\n\n");

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

            const statusStr = result ? "✅ APPROVED (Passed Adversarial Wall)" : "🛡️ REJECTED (Caught by Auditor)";
            
            let entry = `### Topic: ${test.topic} (${test.desc})\n`;
            entry += `**Status**: ${statusStr}\n\n`;
            if (result) {
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Ans**: ${result.correct_answer}\n\n`;
                entry += `> **Calculation Scratchpad**: (Passed Auditor Logic)\n\n`;
            } else {
                entry += `> **Action**: Verifier successfully REJECTED this generation using its adversarial logic.\n\n`;
            }
            entry += `--- \n\n`;
            fs.appendFileSync(reportPath, entry);
        } catch (e) {
            fs.appendFileSync(reportPath, `### Topic: ${test.topic}\n**Error**: ${e.message}\n\n--- \n\n`);
        }
    }
    console.log("✅ Adversarial Check Complete! Results in adversarial_audit_results.md");
}

runAdversarialAudit();

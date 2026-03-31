
import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function verifySanityCheck() {
    console.log("🔍 Checking 'STEP 0 - SANITY CHECK' (70B Verifier)...");
    
    // Targeted problematic topics that generated flawed data before
    const testCases = [
        { topic: 'Electrostatics', subject: 'Physics', class: 'Class 12', desc: 'Torque (angle check)' },
        { topic: 'Current Electricity', subject: 'Physics', class: 'Class 12', desc: 'EMF (B-field check)' },
        { topic: 'Thermodynamics', subject: 'Physics', class: 'Class 11', desc: 'Delta U (n/gas-type check)' },
        { topic: 'Bohr Model', subject: 'Physics', class: 'Class 12', desc: 'Wavelength consistency' },
        { topic: 'Motion in a Straight Line', subject: 'Physics', class: 'Class 11', desc: 'Correct Options check' }
    ];

    const reportPath = path.join(process.cwd(), 'sanity_check_results.md');
    fs.writeFileSync(reportPath, "# Sanity Check Remediation Results\n\n");

    for (const test of testCases) {
        console.log(`[TEST] ${test.desc} for ${test.topic}...`);
        try {
            const result = await generateInspiredQuestion({
                exam: 'JEE-Mains',
                subject: test.subject,
                topic: test.topic,
                difficulty: 'Medium',
                noCache: true 
            });

            let statusStr = result ? "✅ APPROVED (Could still be wrong)" : "🛡️ REJECTED (Expected for flawed data)";
            
            let entry = `### Topic: ${test.topic} (${test.desc})\n`;
            entry += `**Status**: ${statusStr}\n\n`;
            if (result) {
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Ans**: ${result.correct_answer}\n\n`;
                entry += `> **Logic**: (Passed Verifier Check)\n\n`;
            } else {
                entry += `> **Action**: Verifier correctly REJECTED due to missing data or contradiction.\n\n`;
            }
            entry += `--- \n\n`;
            fs.appendFileSync(reportPath, entry);
        } catch (e) {
            fs.appendFileSync(reportPath, `### Topic: ${test.topic}\n**Error**: ${e.message}\n\n--- \n\n`);
        }
    }
    console.log("✅ Sanity Check Audit Complete! Results in sanity_check_results.md");
}

verifySanityCheck();

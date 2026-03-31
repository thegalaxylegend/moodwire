
import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function verifyRemediation() {
    console.log("🔍 Checking Accuracy Remediation (70B Verifier)...");
    
    const testCases = [
        { topic: 'Units and Measurements', subject: 'Physics', class: 'Class 11', desc: 'Eccentricity unit check' },
        { topic: 'Motion in a Straight Line', subject: 'Physics', class: 'Class 11', desc: 'v=u+at calculation' },
        { topic: 'Gravitation', subject: 'Physics', class: 'Class 11', desc: 'GPE ratio calculation' },
        { topic: 'Trigonometric Functions', subject: 'Mathematics', class: 'Class 11', desc: 'tan(A+B) undefined check' },
        { topic: 'Complex Numbers', subject: 'Mathematics', class: 'Class 11', desc: '|z^2|+|z| check' },
        { topic: 'Evolution', subject: 'Biology', class: 'Class 12', desc: 'Placeholder rejection check' },
        { topic: 'Radioactivity', subject: 'Physics', class: 'Class 12', desc: 'Half-life calculation' },
    ];

    const reportPath = path.join(process.cwd(), 'remediation_check_results.md');
    fs.writeFileSync(reportPath, "# Accuracy Remediation Check Results\n\n");

    for (const test of testCases) {
        console.log(`[TEST] ${test.desc} for ${test.topic}...`);
        try {
            const result = await generateInspiredQuestion({
                exam: 'JEE-Mains',
                subject: test.subject,
                topic: test.topic,
                difficulty: 'Medium',
                noCache: true // Force new generation to bypass old bad data
            });

            let statusStr = result ? (result.confidence === 0.70 ? "🛠️ REFIXED" : "✅ APPROVED") : "❌ REJECTED (Expected for some)";
            
            let entry = `### Topic: ${test.topic} (${test.desc})\n`;
            entry += `**Status**: ${statusStr}\n\n`;
            if (result) {
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Ans**: ${result.correct_answer}\n\n`;
                entry += `> **Confidence**: ${result.confidence}\n\n`;
            } else {
                entry += `> **Action**: Verifier correctly rejected/failed this attempt.\n\n`;
            }
            entry += `--- \n\n`;
            fs.appendFileSync(reportPath, entry);
        } catch (e) {
            fs.appendFileSync(reportPath, `### Topic: ${test.topic}\n**Error**: ${e.message}\n\n--- \n\n`);
        }
    }
    console.log("✅ Check Complete! Results in remediation_check_results.md");
}

verifyRemediation();

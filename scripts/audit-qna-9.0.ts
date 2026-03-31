
import { generateInspiredQuestion, StoredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

async function runQnaAudit() {
    console.log("🚀 Starting FINAL QNA AUDIT (20 Questions)...");
    
    const topics = [
        { topic: 'Chemical Kinetics', subject: 'Chemistry', ability: 7, difficulty: 'Medium' as const },
        { topic: 'Wave Optics', subject: 'Physics', ability: 4, difficulty: 'Medium' as const },
        { topic: 'Hydrogen', subject: 'Chemistry', ability: 5, difficulty: 'Medium' as const },
        { topic: 'Statistics', subject: 'Mathematics', ability: 8, difficulty: 'Hard' as const },
        { topic: 'Thermodynamics', subject: 'Physics', ability: 3, difficulty: 'Easy' as const },
        { topic: 'Electrostatics', subject: 'Physics', ability: 6, difficulty: 'Medium' as const },
        { topic: 'Bohr Model', subject: 'Physics', ability: 5, difficulty: 'Medium' as const },
        { topic: 'Equilibrium', subject: 'Chemistry', ability: 7, difficulty: 'Medium' as const },
        { topic: 'Redox Reactions', subject: 'Chemistry', ability: 5, difficulty: 'Medium' as const },
        { topic: 'Probability', subject: 'Mathematics', ability: 4, difficulty: 'Easy' as const },
        { topic: 'Integration', subject: 'Mathematics', ability: 9, difficulty: 'Hard' as const },
        { topic: 'Nuclei', subject: 'Physics', ability: 6, difficulty: 'Medium' as const },
        { topic: 'Solid State', subject: 'Chemistry', ability: 4, difficulty: 'Easy' as const },
        { topic: 'Vector Algebra', subject: 'Mathematics', ability: 8, difficulty: 'Hard' as const },
        { topic: 'Evolution', subject: 'Biology', ability: 5, difficulty: 'Medium' as const },
        { topic: 'Human Health', subject: 'Biology', ability: 3, difficulty: 'Easy' as const },
        { topic: 'Circular Motion', subject: 'Physics', ability: 7, difficulty: 'Medium' as const },
        { topic: 'Alcohol and Phenols', subject: 'Chemistry', ability: 6, difficulty: 'Medium' as const },
        { topic: 'Current Electricity', subject: 'Physics', ability: 9, difficulty: 'Hard' as const },
        { topic: '3D Geometry', subject: 'Mathematics', ability: 5, difficulty: 'Medium' as const }
    ];

    const reportPath = path.join(process.cwd(), 'QA_AUDIT_9.0.md');
    let mdContent = `# FINAL QNA AUDIT: Master Accuracy Validation (9.0)\n\n`;
    mdContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    mdContent += `**System State**: 70B Model Enforcement, Balanced Independent Auditor, Retry Loops Active.\n\n`;
    mdContent += `## Executive Summary\n`;
    mdContent += `| Status | Count |\n`;
    mdContent += `| :--- | :--- |\n`;
    mdContent += `| ✅ Approved | {{CORRECT}} |\n`;
    mdContent += `| 🛠️ Repaired | {{REPAIRED}} |\n`;
    mdContent += `| ❌ Rejected | {{REJECTED}} |\n\n`;
    mdContent += `--- \n\n`;
    fs.writeFileSync(reportPath, mdContent);

    let correctCount = 0;
    let repairedCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < topics.length; i++) {
        const t = topics[i];
        console.log(`[${i+1}/20] Generating ${t.topic}...`);
        
        // Add a 2s delay between questions to help with rate limits
        await new Promise(r => setTimeout(r, 2000));

        try {
            const result = await (generateInspiredQuestion as any)({
                exam: 'JEE-Mains',
                subject: t.subject,
                topic: t.topic,
                difficulty: t.difficulty,
                abilityScore: t.ability,
                noCache: true 
            }) as StoredQuestion | null;

            if (result) {
                const wasRepaired = result.confidence === 0.70;
                if (wasRepaired) repairedCount++;
                else correctCount++;

                let entry = `### ${i+1}. ${wasRepaired ? '🛠️' : '✅'} ${t.topic} (${t.difficulty})\n`;
                entry += `**Status**: ${wasRepaired ? 'REPAIRED' : 'APPROVED'}\n\n`;
                entry += `**Q**: ${result.question}\n\n`;
                
                if (Array.isArray(result.options)) {
                    result.options.forEach((opt, idx) => {
                        entry += `${String.fromCharCode(65 + idx)}) ${opt}\n`;
                    });
                } else if (typeof result.options === 'object') {
                    Object.entries(result.options).forEach(([key, opt]) => {
                        entry += `${key}) ${opt}\n`;
                    });
                }
                
                entry += `\n**Correct Answer**: ${result.correct_answer}\n\n`;
                entry += `**Explanation**: ${result.explanation}\n\n`;
                entry += `**Formula**: \`${result.numerical_formula || 'N/A'}\`\n\n`;
                entry += `**Tags**: ${result.concept_tags?.join(', ') || 'N/A'}\n\n`;
                entry += `**Error Trap**: ${result.error_trap_type || 'N/A'}\n\n`;
                entry += `--- \n\n`;
                fs.appendFileSync(reportPath, entry);
                console.log(`[${i+1}/20] ✅ SUCCESS`);
            } else {
                rejectedCount++;
                fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic}\n**Status**: REJECTED (Quality Gate / Rate Limit)\n\n--- \n\n`);
                console.log(`[${i+1}/20] ❌ REJECTED`);
            }
        } catch (err: any) {
            rejectedCount++;
            fs.appendFileSync(reportPath, `### ${i+1}. ❌ ${t.topic}\n**Error**: ${err.message}\n\n--- \n\n`);
            console.log(`[${i+1}/20] ❌ ERROR: ${err.message}`);
        }

        // Update count for executive summary
        let currentMd = fs.readFileSync(reportPath, 'utf8');
        let updatedMd = currentMd.replace(/✅ Approved \| \d+/, `✅ Approved | ${correctCount}`);
        updatedMd = updatedMd.replace(/🛠️ Repaired \| \d+/, `🛠️ Repaired | ${repairedCount}`);
        updatedMd = updatedMd.replace(/❌ Rejected \| \d+/, `❌ Rejected | ${rejectedCount}`);
    }

    let finalMd = fs.readFileSync(reportPath, 'utf8');
    finalMd = finalMd.replace('{{CORRECT}}', correctCount.toString());
    finalMd = finalMd.replace('{{REPAIRED}}', repairedCount.toString());
    finalMd = finalMd.replace('{{REJECTED}}', rejectedCount.toString());
    fs.writeFileSync(reportPath, finalMd);

    console.log("✅ Audit Complete! Results saved to QA_AUDIT_9.0.md");
}

runQnaAudit();

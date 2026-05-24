import 'dotenv/config';
import { generateInspiredQuestion, StoredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- TOPIC ROTATION (STRICT ADVANCED) ---
const TOPICS = [
    { topic: 'Wave Optics', subject: 'Physics', difficulty: 'Hard' as const },
    { topic: 'Chemical Kinetics', subject: 'Chemistry', difficulty: 'Hard' as const },
    { topic: 'Probability', subject: 'Mathematics', difficulty: 'Hard' as const },
    { topic: 'Rotational Motion', subject: 'Physics', difficulty: 'Hard' as const },
    { topic: 'Electrochemistry', subject: 'Chemistry', difficulty: 'Hard' as const },
    { topic: 'Integration', subject: 'Mathematics', difficulty: 'Hard' as const },
    { topic: 'Nuclei', subject: 'Physics', difficulty: 'Hard' as const },
    { topic: 'Redox Reactions', subject: 'Chemistry', difficulty: 'Hard' as const },
    { topic: 'Vector Algebra', subject: 'Mathematics', difficulty: 'Hard' as const },
    { topic: 'Current Electricity', subject: 'Physics', difficulty: 'Hard' as const },
];

async function runFinalAudit() {
    console.log('🚀 INITIALIZING FINAL V3.3 HARDENED AUDIT...');
    console.log('📋 Target: 20 Approved Questions (JEE Advanced/Hard).');
    console.log('─'.repeat(80));

    const reportPath = path.join(process.cwd(), 'FINAL_V3.3_AUDIT.md');
    let mdContent = `# FINAL JEE-ADVANCED AUDIT — Hardened Engine v3.3\n\n`;
    mdContent += `**Generated on**: ${new Date().toLocaleString()}\n\n`;
    mdContent += `**System Accuracy Target**: 93%+\n\n`;
    mdContent += `| # | Topic | Subject | Confidence | Logic Match |\n`;
    mdContent += `| :--- | :--- | :--- | :--- | :--- |\n`;
    fs.writeFileSync(reportPath, mdContent);

    let approvedCount = 0;
    let index = 0;

    while (approvedCount < 20) {
        const t = TOPICS[index % TOPICS.length];
        console.log(`[${approvedCount + 1}/20] Generating: ${t.topic}...`);
        
        try {
            const result = await generateInspiredQuestion({
                exam: 'JEE-Advanced',
                subject: t.subject,
                topic: t.topic,
                difficulty: t.difficulty,
                abilityScore: 10
            }) as StoredQuestion | null;

            if (result && result.confidence >= 0.70) {
                approvedCount++;
                const matchIcon = result.verification_details?.verifier_matches ? '✅' : '⚠️';
                console.log(`  ✅ APPROVED (Confidence: ${result.confidence.toFixed(2)})`);

                const row = `| ${approvedCount} | ${t.topic} | ${t.subject} | ${result.confidence.toFixed(2)} | ${matchIcon} |\n`;
                fs.appendFileSync(reportPath, row);

                let detail = `\n### ${approvedCount}. ${t.topic} (${t.subject})\n`;
                detail += `**Question**: ${result.question}\n\n`;
                detail += `**Correct Ans**: ${result.correct_answer}\n\n`;
                detail += `**Independent Reasoning**: ${result.explanation.slice(0, 300)}...\n\n`;
                detail += `---\n`;
                fs.appendFileSync(reportPath, detail);
            } else {
                console.log(`  ❌ Rejected by Hardened Heuristics. Retrying...`);
            }
        } catch (e: any) {
            console.error(`  💥 ERROR: ${e.message}`);
            if (e.message.includes('rate limit')) await new Promise(r => setTimeout(r, 10000));
        }

        index++;
        await new Promise(r => setTimeout(r, 1500)); // Rate limit buffer
    }

    console.log('═'.repeat(80));
    console.log(`🏆 Audit Complete! Result saved to ${reportPath}`);
}

runFinalAudit().catch(console.error);

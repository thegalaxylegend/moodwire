import 'dotenv/config';
import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER / LOCALSTORAGE ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

const originalLog = console.log;
const originalWarn = console.warn;

async function runSingleTest() {
    originalLog("🚀 Generating a single JEE Advanced Question to test the Load Balancer...");

    const topic = { topic: 'Rotational Dynamics: Rolling Motion', subject: 'Physics' };
    const currentLbLogs: string[] = [];
    const currentWarnings: string[] = [];

    // Intercept logs for this run
    console.log = (...args: any[]) => {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        if (msg.includes('[LoadBalancer]') || msg.includes('[AI Orchestrator]') || msg.includes('[QuestionEngine]')) {
            currentLbLogs.push(msg);
        }
        originalLog(...args);
    };

    console.warn = (...args: any[]) => {
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        if (msg.includes('[LoadBalancer]') || msg.includes('[AI Orchestrator]') || msg.includes('[QuestionEngine]')) {
            currentWarnings.push(msg);
        }
        originalWarn(...args);
    };

    const startTime = Date.now();
    let qResult: any = null;
    let qError: string | undefined = undefined;

    try {
        qResult = await generateInspiredQuestion({
            exam: `JEE Advanced (Class 12) [Single-Test-${Date.now()}]`,
            subject: topic.subject,
            topic: topic.topic,
            difficulty: 'Hard',
            abilityScore: 2700,
            // @ts-ignore
            noCache: true
        });
    } catch (err: any) {
        qError = err.message || String(err);
        originalWarn(`❌ Error generating ${topic.topic}: ${qError}`);
    }

    const endTime = Date.now();
    const timeTakenMs = endTime - startTime;

    // Restore original console
    console.log = originalLog;
    console.warn = originalWarn;

    let status = 'REJECTED';
    if (qResult) {
        if (qResult.verification_details?.consistency_check_passed === false || currentWarnings.some(w => w.includes('Consistency fix'))) {
            status = 'REFIXED';
        } else {
            status = 'APPROVED';
        }
    }

    const reportPath = path.join(process.cwd(), 'latest_question.md');
    
    let mdContent = `# Latest Generated Question Report\n\n`;
    mdContent += `**Timestamp**: ${new Date().toLocaleString()}\n`;
    mdContent += `**Subject**: ${topic.subject}\n`;
    mdContent += `**Topic**: ${topic.topic}\n`;
    mdContent += `**Status**: ${status === 'APPROVED' ? '✅ APPROVED' : status === 'REFIXED' ? '🛠️ REFIXED (Auto-Corrected)' : '❌ REJECTED'}\n`;
    mdContent += `**Generation Latency**: ${(timeTakenMs / 1000).toFixed(2)}s\n\n`;

    if (qResult) {
        mdContent += `## Question\n> ${qResult.question}\n\n`;
        mdContent += `## Options\n`;
        const opts = Array.isArray(qResult.options) ? qResult.options : Object.values(qResult.options || {});
        opts.forEach((opt: any, oIdx: number) => {
            mdContent += `- **${String.fromCharCode(65 + oIdx)}**: ${opt}\n`;
        });
        mdContent += `\n**Correct Answer**: ${qResult.correct_answer}\n\n`;
        mdContent += `## Explanation\n> ${qResult.explanation || 'No explanation provided.'}\n\n`;
        mdContent += `## Hidden Derivation / Expert Working\n> ${qResult.hidden_derivation || 'No derivation provided.'}\n\n`;
        mdContent += `## Verification Details\n`;
        mdContent += `- **Consistency Check**: ${qResult.verification_details?.consistency_check_passed ? 'Passed' : 'Failed'}\n`;
        mdContent += `- **Unit Check**: ${qResult.verification_details?.unit_check_passed ? 'Passed' : 'Failed'}\n`;
        mdContent += `- **Verifier Answer Matches**: ${qResult.verification_details?.verifier_matches ? 'Yes' : 'No'}\n`;
        mdContent += `- **Verifier Answer**: ${qResult.verification_details?.verifier_answer || 'N/A'}\n\n`;
    } else {
        mdContent += `## Error Details\n`;
        if (qError) {
            mdContent += `\`\`\`text\n${qError}\n\`\`\`\n\n`;
        } else {
            mdContent += `Question generation returned null without a fatal error.\n\n`;
        }
    }

    mdContent += `## Load Balancer Logs\n\`\`\`text\n`;
    currentLbLogs.forEach(l => mdContent += `${l}\n`);
    currentWarnings.forEach(w => mdContent += `[WARN/REJECT] ${w}\n`);
    mdContent += `\`\`\`\n`;

    fs.writeFileSync(reportPath, mdContent);
    originalLog(`\n🏁 Single Question Test Complete!`);
    originalLog(`📄 Report saved to: ${reportPath}`);
}

runSingleTest().catch(err => {
    console.error("Fatal Error running test:", err);
});

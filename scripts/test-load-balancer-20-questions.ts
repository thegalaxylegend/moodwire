import 'dotenv/config';
import { generateInspiredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- MOCK BROWSER / LOCALSTORAGE ---
if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

// Intercept console logs/warns to capture Load Balancer routing and Verifier rejections
const originalLog = console.log;
const originalWarn = console.warn;

interface QuestionLog {
    topic: string;
    subject: string;
    timeTakenMs: number;
    status: string;
    questionText?: string;
    correctAnswer?: string;
    lbLogs: string[];
    warnings: string[];
    error?: string;
}

async function runLoadBalancerTest() {
    originalLog("🚀 Starting Comprehensive Load Balancer & 20-Question Generation Test (JEE Advanced Level)...");

    const topics = [
        // Physics (7)
        { topic: 'Rotational Dynamics: Rolling Motion', subject: 'Physics' },
        { topic: 'Electrostatics: Multi-Dielectric Capacitors', subject: 'Physics' },
        { topic: 'Thermodynamics: Cyclic Process Efficiency', subject: 'Physics' },
        { topic: 'Electromagnetic Induction: Motional EMF in Non-Uniform Field', subject: 'Physics' },
        { topic: 'Wave Optics: Thin Film Interference', subject: 'Physics' },
        { topic: 'Modern Physics: Bohr Model with Recoil', subject: 'Physics' },
        { topic: 'Gravitation: Elliptical Orbit Dynamics', subject: 'Physics' },

        // Chemistry (7)
        { topic: 'Ionic Equilibrium: Buffer Capacity & Solubility Product', subject: 'Chemistry' },
        { topic: 'Electrochemistry: Nernst Equation & Concentration Cells', subject: 'Chemistry' },
        { topic: 'Chemical Kinetics: Parallel & Sequential Reactions', subject: 'Chemistry' },
        { topic: 'Coordination Compounds: Crystal Field Splitting Energy', subject: 'Chemistry' },
        { topic: 'Organic Chemistry: Aldol & Cannizzaro Crossed Reactions', subject: 'Chemistry' },
        { topic: 'Thermodynamics: Gibbs Free Energy & Non-Ideal Solutions', subject: 'Chemistry' },
        { topic: 'Solid State: Bragg\'s Law & Void Fraction Calculations', subject: 'Chemistry' },

        // Mathematics (6)
        { topic: 'Definite Integration: Reduction Formulae & Leibniz Rule', subject: 'Mathematics' },
        { topic: 'Complex Numbers: Geometry of Roots of Unity', subject: 'Mathematics' },
        { topic: 'Matrices & Determinants: Cayley-Hamilton Theorem Applications', subject: 'Mathematics' },
        { topic: 'Differential Equations: Orthogonal Trajectories', subject: 'Mathematics' },
        { topic: 'Vector Algebra: Triple Product Geometry', subject: 'Mathematics' },
        { topic: 'Probability: Bayes Theorem with Markov Chains', subject: 'Mathematics' }
    ];

    const logs: QuestionLog[] = [];
    let totalTimeMs = 0;
    let approvedCount = 0;
    let refixedCount = 0;
    let rejectedCount = 0;

    const reportPath = path.join(process.cwd(), 'load_balancer_20_questions_test_report.md');
    fs.writeFileSync(reportPath, `# ExamCompass Load Balancer & JEE Advanced Question Generation Test Report\n\n`);
    fs.appendFileSync(reportPath, `**Date**: ${new Date().toLocaleString()}\n`);
    fs.appendFileSync(reportPath, `**Target Level**: JEE Advanced (Class 12)\n`);
    fs.appendFileSync(reportPath, `**Ability Score Target**: 2700 / 3000 (Band 12 — Expert Synthesis)\n\n`);
    fs.appendFileSync(reportPath, `## Executive Summary\n\n`);
    fs.appendFileSync(reportPath, `| Metric | Value |\n| :--- | :--- |\n`);
    fs.appendFileSync(reportPath, `| Total Questions Attempted | 20 |\n`);
    fs.appendFileSync(reportPath, `| Status: ✅ APPROVED | {{APPROVED}} |\n`);
    fs.appendFileSync(reportPath, `| Status: 🛠️ REFIXED | {{REFIXED}} |\n`);
    fs.appendFileSync(reportPath, `| Status: ❌ REJECTED | {{REJECTED}} |\n`);
    fs.appendFileSync(reportPath, `| Average Generation Latency | {{AVG_TIME}}s |\n\n`);
    fs.appendFileSync(reportPath, `--- \n\n## Detailed Question Audit & Load Balancer Logs\n\n`);

    for (let i = 0; i < topics.length; i++) {
        const t = topics[i];
        originalLog(`\n-------------------------------------------------------------`);
        originalLog(`[${i + 1}/20] Generating JEE Advanced Question for: ${t.topic}...`);

        const currentLbLogs: string[] = [];
        const currentWarnings: string[] = [];

        // Intercept logs for this question
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
            // Pass a unique exam string with timestamp to bypass DB cache entirely and force live generation
            qResult = await generateInspiredQuestion({
                exam: `JEE Advanced (Class 12) [LB-Test-${Date.now()}]`,
                subject: t.subject,
                topic: t.topic,
                difficulty: 'Hard',
                abilityScore: 2700,
                // @ts-ignore
                noCache: true
            });
        } catch (err: any) {
            qError = err.message || String(err);
            originalWarn(`❌ Error generating ${t.topic}: ${qError}`);
        }

        const endTime = Date.now();
        const timeTakenMs = endTime - startTime;
        totalTimeMs += timeTakenMs;

        // Restore original console
        console.log = originalLog;
        console.warn = originalWarn;

        let status = 'REJECTED';
        if (qResult) {
            if (qResult.verification_details?.consistency_check_passed === false || currentWarnings.some(w => w.includes('Consistency fix'))) {
                status = 'REFIXED';
                refixedCount++;
            } else {
                status = 'APPROVED';
                approvedCount++;
            }
        } else {
            rejectedCount++;
        }

        logs.push({
            topic: t.topic,
            subject: t.subject,
            timeTakenMs,
            status,
            questionText: qResult?.question,
            correctAnswer: qResult?.correct_answer,
            lbLogs: currentLbLogs,
            warnings: currentWarnings,
            error: qError
        });

        originalLog(`⏱️ Time taken: ${(timeTakenMs / 1000).toFixed(2)}s | Status: ${status}`);

        // Write entry to Markdown report
        let mdEntry = `### ${i + 1}. ${t.topic} (${t.subject})\n\n`;
        mdEntry += `**Status**: ${status === 'APPROVED' ? '✅ APPROVED' : status === 'REFIXED' ? '🛠️ REFIXED (Auto-Corrected)' : '❌ REJECTED'}\n`;
        mdEntry += `**Generation Latency**: ${(timeTakenMs / 1000).toFixed(2)}s\n\n`;

        if (qResult) {
            mdEntry += `#### Question\n> ${qResult.question}\n\n`;
            mdEntry += `#### Options\n`;
            const opts = Array.isArray(qResult.options) ? qResult.options : Object.values(qResult.options || {});
            opts.forEach((opt: any, oIdx: number) => {
                mdEntry += `- **${String.fromCharCode(65 + oIdx)}**: ${opt}\n`;
            });
            mdEntry += `\n**Correct Answer**: ${qResult.correct_answer}\n\n`;
            mdEntry += `#### Hidden Derivation / Expert Working\n> ${qResult.hidden_derivation || qResult.explanation}\n\n`;
        } else if (qError) {
            mdEntry += `**Fatal Error**: \`${qError}\`\n\n`;
        }

        mdEntry += `#### Load Balancer & Verification Logs\n\`\`\`text\n`;
        currentLbLogs.forEach(l => mdEntry += `[LOG] ${l}\n`);
        currentWarnings.forEach(w => mdEntry += `[WARN/REJECT] ${w}\n`);
        mdEntry += `\`\`\`\n\n---\n\n`;

        fs.appendFileSync(reportPath, mdEntry);

        // Small pause between questions
        await new Promise(r => setTimeout(r, 500));
    }

    const avgTimeSec = ((totalTimeMs / 20) / 1000).toFixed(2);

    // Update summary table in Markdown
    let finalMd = fs.readFileSync(reportPath, 'utf8');
    finalMd = finalMd.replace('{{APPROVED}}', approvedCount.toString());
    finalMd = finalMd.replace('{{REFIXED}}', refixedCount.toString());
    finalMd = finalMd.replace('{{REJECTED}}', rejectedCount.toString());
    finalMd = finalMd.replace('{{AVG_TIME}}', avgTimeSec);
    fs.writeFileSync(reportPath, finalMd);

    originalLog(`\n🏁 Load Balancer & Question Generation Test Complete!`);
    originalLog(`📊 Summary: ✅ ${approvedCount} Approved | 🛠️ ${refixedCount} Refixed | ❌ ${rejectedCount} Rejected`);
    originalLog(`⏱️ Average Time per Question: ${avgTimeSec}s`);
    originalLog(`📄 Full Report saved to: ${reportPath}`);
}

runLoadBalancerTest().catch(err => {
    console.error("Fatal Error running test:", err);
});

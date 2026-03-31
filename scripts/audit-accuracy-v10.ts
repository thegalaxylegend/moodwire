import 'dotenv/config';
import { generateInspiredQuestion, StoredQuestion } from '../src/services/questionEngine';
import * as fs from 'fs';
import * as path from 'path';

// --- NODE/VITE SHAM ---
if (typeof (import.meta as any).env === 'undefined') {
    (import.meta as any).env = process.env;
}

// --- MOCK BROWSER ENVIRONMENT ---
if (typeof (global as any).localStorage === 'undefined') {
    (global as any).localStorage = { getItem: () => null, setItem: () => null };
}

// --- AUDIT CONFIGURATION ---
const AUDIT_TOPICS = [
    // PHYSICS — Known failure-prone topics
    { topic: 'Wave Optics', subject: 'Physics', ability: 5, difficulty: 'Medium' as const, expectedTrap: 'Single slit vs circular aperture formula confusion' },
    { topic: 'Atoms', subject: 'Physics', ability: 6, difficulty: 'Medium' as const, expectedTrap: 'Bohr model E = -13.6/n² (NOT /n)' },
    { topic: 'Kinetic Theory', subject: 'Physics', ability: 5, difficulty: 'Medium' as const, expectedTrap: 'KE proportional to T (NOT T²)' },
    { topic: 'Nuclei', subject: 'Physics', ability: 6, difficulty: 'Medium' as const, expectedTrap: 'β decay mass number unchanged' },
    { topic: 'Electrostatics', subject: 'Physics', ability: 7, difficulty: 'Hard' as const, expectedTrap: 'E between plates = σ/ε₀ not σ/2ε₀' },
    { topic: 'Thermodynamics', subject: 'Physics', ability: 4, difficulty: 'Easy' as const, expectedTrap: 'Carnot temp in Kelvin not Celsius' },
    { topic: 'Current Electricity', subject: 'Physics', ability: 8, difficulty: 'Hard' as const, expectedTrap: 'V = E - Ir sign convention' },
    { topic: 'Circular Motion', subject: 'Physics', ability: 6, difficulty: 'Medium' as const, expectedTrap: 'Centripetal force is not a separate force' },
    { topic: 'Gravitation', subject: 'Physics', ability: 5, difficulty: 'Medium' as const, expectedTrap: 'GPE is negative' },
    { topic: 'Oscillations', subject: 'Physics', ability: 5, difficulty: 'Medium' as const, expectedTrap: 'Period independent of mass for pendulum' },
    
    // CHEMISTRY — Known failure-prone topics
    { topic: 'Redox Reactions', subject: 'Chemistry', ability: 6, difficulty: 'Medium' as const, expectedTrap: 'Cr₂O₇²⁻ has TWO Cr atoms = 6e⁻ total' },
    { topic: 'Chemical Kinetics', subject: 'Chemistry', ability: 7, difficulty: 'Medium' as const, expectedTrap: 'First order t½ independent of concentration' },
    { topic: 'Equilibrium', subject: 'Chemistry', ability: 6, difficulty: 'Medium' as const, expectedTrap: 'pH is dimensionless' },
    { topic: 'Electrochemistry', subject: 'Chemistry', ability: 7, difficulty: 'Hard' as const, expectedTrap: 'E°_cell = E°_cathode - E°_anode' },
    { topic: 'Hydrogen', subject: 'Chemistry', ability: 4, difficulty: 'Easy' as const, expectedTrap: '2Na → 1H₂ stoichiometry' },
    { topic: 'Solid State', subject: 'Chemistry', ability: 5, difficulty: 'Medium' as const, expectedTrap: 'FCC has 4 atoms per unit cell' },
    { topic: 'Solutions', subject: 'Chemistry', ability: 6, difficulty: 'Medium' as const, expectedTrap: 'Van\'t Hoff factor for electrolytes' },
    
    // MATHEMATICS — Known failure-prone topics
    { topic: 'Probability', subject: 'Mathematics', ability: 5, difficulty: 'Medium' as const, expectedTrap: 'Geometric: P(X>k) = (1-p)^k' },
    { topic: 'Statistics', subject: 'Mathematics', ability: 7, difficulty: 'Medium' as const, expectedTrap: 'E(X) = Σ xᵢP(xᵢ) step by step' },
    { topic: 'Conic Sections', subject: 'Mathematics', ability: 6, difficulty: 'Medium' as const, expectedTrap: 'Eccentricity is DIMENSIONLESS' },
    { topic: 'Vector Algebra', subject: 'Mathematics', ability: 7, difficulty: 'Hard' as const, expectedTrap: 'Cross product anti-commutative' },
    { topic: 'Complex Numbers', subject: 'Mathematics', ability: 5, difficulty: 'Medium' as const, expectedTrap: 'i² = -1 cycle' },
    { topic: 'Integrals', subject: 'Mathematics', ability: 8, difficulty: 'Hard' as const, expectedTrap: 'Integration by parts ILATE rule' },
    
    // BIOLOGY — Placeholder detection topics
    { topic: 'Evolution', subject: 'Biology', ability: 5, difficulty: 'Medium' as const, expectedTrap: 'Must contain specific biology terms' },
    { topic: 'Human Health', subject: 'Biology', ability: 4, difficulty: 'Easy' as const, expectedTrap: 'Must reference specific diseases/pathogens' },
];

// --- REPORT TYPES ---
interface AuditResult {
    index: number;
    topic: string;
    subject: string;
    status: 'APPROVED' | 'REJECTED' | 'ERROR';
    confidence: number;
    question?: string;
    correctAnswer?: string;
    formula?: string;
    derivation?: string;
    verificationDetails?: any;
    errorMessage?: string;
    expectedTrap?: string;
    timeMs: number;
}

// --- MAIN AUDIT FUNCTION ---
async function runAudit() {
    console.log('🚀 Starting ACCURACY AUDIT v12.0 (v3.2 Engine)...');
    console.log(`📋 Testing ${AUDIT_TOPICS.length} topics across Physics, Chemistry, Mathematics, Biology`);
    console.log('─'.repeat(80));

    // CHECK ENVIRONMENT
    const groqKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    console.log('🔍 Environment Check:');
    console.log(`   - GROQ KEY: ${groqKey ? '✅ found (' + groqKey.slice(0, 4) + '...)' : '❌ MISSING'}`);
    console.log(`   - GEMINI KEY: ${geminiKey ? '✅ found (' + geminiKey.slice(0, 4) + '...)' : '❌ MISSING'}`);
    console.log('─'.repeat(80));

    if (!groqKey) {
        throw new Error('STOPPING: VITE_GROQ_API_KEY must be set in .env for audit.');
    }

    const results: AuditResult[] = [];
    const reportPath = path.join(process.cwd(), 'QA_AUDIT_12.0.md');

    // Initialize report
    let mdContent = `# QA AUDIT 12.0 — Question Engine v3.2\n\n`;
    mdContent += `**Generated on**: ${new Date().toLocaleString()}\n\n`;
    mdContent += `**Engine Version**: v3.2 (Mantissa fix + Verifier math-only + JSON safety + Unit validator fix)\n\n`;
    mdContent += `---\n\n`;
    fs.writeFileSync(reportPath, mdContent);

    for (let i = 0; i < AUDIT_TOPICS.length; i++) {
        const t = AUDIT_TOPICS[i];
        const startTime = Date.now();
        
        console.log(`[${i + 1}/${AUDIT_TOPICS.length}] Generating: ${t.topic} (${t.subject}, ${t.difficulty})...`);

        // Rate-limit aware generation with one retry after cooldown
        let result: StoredQuestion | null = null;
        let genError: any = null;
        
        for (let rateLimitRetry = 0; rateLimitRetry < 2; rateLimitRetry++) {
            try {
                result = await (generateInspiredQuestion as any)({
                    exam: t.subject === 'Biology' ? 'NEET' : 'JEE-Mains',
                    subject: t.subject,
                    topic: t.topic,
                    difficulty: t.difficulty,
                    abilityScore: t.ability,
                    noCache: true
                }) as StoredQuestion | null;
                genError = null;
                break; // Success
            } catch (err: any) {
                genError = err;
                const isRateLimit = err?.message?.includes('rate limit') || 
                                    err?.message?.includes('Rate limit') ||
                                    err?.message?.includes('429') ||
                                    err?.message?.includes('RESOURCE_EXHAUSTED') ||
                                    err?.message?.includes('quota');
                if (isRateLimit && rateLimitRetry === 0) {
                    console.log(`  ⏳ Rate limited — waiting 65s before retry...`);
                    await new Promise(r => setTimeout(r, 65000));
                    continue;
                }
                break; // Non-rate-limit error or second attempt
            }
        }

        try {
            const timeMs = Date.now() - startTime;

            if (genError) {
                throw genError;
            }

            if (result) {
                const auditResult: AuditResult = {
                    index: i + 1,
                    topic: t.topic,
                    subject: t.subject,
                    status: 'APPROVED',
                    confidence: result.confidence,
                    question: result.question,
                    correctAnswer: result.correct_answer,
                    formula: result.numerical_formula || result.formula_used,
                    derivation: result.hidden_derivation || (result.step_by_step_solution || []).join('\n'),
                    verificationDetails: result.verification_details,
                    expectedTrap: t.expectedTrap,
                    timeMs
                };
                results.push(auditResult);

                const icon = result.confidence >= 0.85 ? '✅' : result.confidence >= 0.70 ? '🟡' : '🟠';
                console.log(`  ${icon} APPROVED (confidence: ${result.confidence.toFixed(2)}, ${timeMs}ms)`);

                // Write to report
                let entry = `### ${i + 1}. ${icon} ${t.topic} (${t.subject})\n\n`;
                entry += `| Field | Value |\n|---|---|\n`;
                entry += `| **Status** | APPROVED |\n`;
                entry += `| **Confidence** | ${result.confidence.toFixed(2)} |\n`;
                entry += `| **Difficulty** | ${t.difficulty} |\n`;
                entry += `| **Time** | ${timeMs}ms |\n`;
                entry += `| **Expected Trap** | ${t.expectedTrap} |\n\n`;
                entry += `> **Question**: ${result.question}\n\n`;
                entry += `> **Answer**: ${result.correct_answer}\n\n`;
                entry += `> **Formula**: \`${result.formula_used || result.numerical_formula || 'N/A'}\`\n\n`;
                if (result.step_by_step_solution) {
                    entry += `> **Steps**:\n`;
                    result.step_by_step_solution.forEach((step: string, idx: number) => {
                        entry += `> ${idx + 1}. ${step}\n`;
                    });
                    entry += '\n';
                }
                if (result.verification_details) {
                    entry += `> **Verification**: Verifier matches: ${result.verification_details.verifier_matches}, `;
                    entry += `Consistency: ${result.verification_details.consistency_check_passed}, `;
                    entry += `Units: ${result.verification_details.unit_check_passed}\n\n`;
                }
                entry += `---\n\n`;
                fs.appendFileSync(reportPath, entry);

            } else {
                results.push({
                    index: i + 1,
                    topic: t.topic,
                    subject: t.subject,
                    status: 'REJECTED',
                    confidence: 0,
                    expectedTrap: t.expectedTrap,
                    timeMs
                });
                console.log(`  ❌ REJECTED (all retries failed, ${timeMs}ms)`);

                let entry = `### ${i + 1}. ❌ ${t.topic} (${t.subject})\n\n`;
                entry += `**Status**: REJECTED (all validation layers failed after max retries)\n\n`;
                entry += `**Expected Trap**: ${t.expectedTrap}\n\n`;
                entry += `---\n\n`;
                fs.appendFileSync(reportPath, entry);
            }
        } catch (err: any) {
            const timeMs = Date.now() - startTime;
            results.push({
                index: i + 1,
                topic: t.topic,
                subject: t.subject,
                status: 'ERROR',
                confidence: 0,
                errorMessage: err.message,
                expectedTrap: t.expectedTrap,
                timeMs
            });
            console.log(`  💥 ERROR: ${err.message} (${timeMs}ms)`);

            let entry = `### ${i + 1}. 💥 ${t.topic} (${t.subject})\n\n`;
            entry += `**Status**: ERROR\n**Message**: ${err.message}\n\n`;
            entry += `---\n\n`;
            fs.appendFileSync(reportPath, entry);
        }

        // Delay between topics to avoid rate limits (4s for free tier)
        if (i < AUDIT_TOPICS.length - 1) {
            await new Promise(r => setTimeout(r, 4000));
        }
    }

    // --- GENERATE EXECUTIVE SUMMARY ---
    const approved = results.filter(r => r.status === 'APPROVED');
    const rejected = results.filter(r => r.status === 'REJECTED');
    const errors = results.filter(r => r.status === 'ERROR');
    const highConfidence = approved.filter(r => r.confidence >= 0.85);
    const avgConfidence = approved.length > 0
        ? approved.reduce((s, r) => s + r.confidence, 0) / approved.length
        : 0;
    const avgTime = results.reduce((s, r) => s + r.timeMs, 0) / results.length;

    // Per-subject breakdown
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    const subjectStats = subjects.map(subj => {
        const subjResults = results.filter(r => r.subject === subj);
        const subjApproved = subjResults.filter(r => r.status === 'APPROVED');
        return {
            subject: subj,
            total: subjResults.length,
            approved: subjApproved.length,
            rate: subjResults.length > 0 ? ((subjApproved.length / subjResults.length) * 100).toFixed(1) : 'N/A'
        };
    });

    let summary = `## Executive Summary\n\n`;
    summary += `| Metric | Value |\n|---|---|\n`;
    summary += `| **Total Questions** | ${results.length} |\n`;
    summary += `| **Approved** | ${approved.length} (${((approved.length / results.length) * 100).toFixed(1)}%) |\n`;
    summary += `| **Rejected** | ${rejected.length} |\n`;
    summary += `| **Errors** | ${errors.length} |\n`;
    summary += `| **High Confidence (≥0.85)** | ${highConfidence.length} |\n`;
    summary += `| **Avg Confidence** | ${avgConfidence.toFixed(2)} |\n`;
    summary += `| **Avg Generation Time** | ${(avgTime / 1000).toFixed(1)}s |\n\n`;

    summary += `### Per-Subject Breakdown\n\n`;
    summary += `| Subject | Total | Approved | Rate |\n|---|---|---|---|\n`;
    for (const s of subjectStats) {
        summary += `| ${s.subject} | ${s.total} | ${s.approved} | ${s.rate}% |\n`;
    }
    summary += '\n';

    // Per-difficulty breakdown
    const difficulties = ['Easy', 'Medium', 'Hard'];
    summary += `### Per-Difficulty Breakdown\n\n`;
    summary += `| Difficulty | Total | Approved | Rate |\n|---|---|---|---|\n`;
    for (const diff of difficulties) {
        const diffResults = results.filter(r => AUDIT_TOPICS[r.index - 1]?.difficulty === diff);
        const diffApproved = diffResults.filter(r => r.status === 'APPROVED');
        const rate = diffResults.length > 0 ? ((diffApproved.length / diffResults.length) * 100).toFixed(1) : 'N/A';
        summary += `| ${diff} | ${diffResults.length} | ${diffApproved.length} | ${rate}% |\n`;
    }
    summary += '\n';

    // Verdict
    const overallRate = (approved.length / results.length) * 100;
    if (overallRate >= 90) {
        summary += `### 🏆 VERDICT: TARGET MET (${overallRate.toFixed(1)}% ≥ 90%)\n\n`;
    } else if (overallRate >= 80) {
        summary += `### 🟡 VERDICT: CLOSE TO TARGET (${overallRate.toFixed(1)}%). Needs iteration on failing topics.\n\n`;
    } else {
        summary += `### ❌ VERDICT: BELOW TARGET (${overallRate.toFixed(1)}%). Review failing topics and add targeted fixes.\n\n`;
    }

    // Prepend summary to report
    const existingReport = fs.readFileSync(reportPath, 'utf8');
    const headerEnd = existingReport.indexOf('---\n\n') + 5;
    const updatedReport = existingReport.slice(0, headerEnd) + '\n' + summary + existingReport.slice(headerEnd);
    fs.writeFileSync(reportPath, updatedReport);

    // Console summary
    console.log('\n' + '═'.repeat(80));
    console.log('AUDIT v12.0 RESULTS:');
    console.log(`  ✅ Approved: ${approved.length}/${results.length} (${overallRate.toFixed(1)}%)`);
    console.log(`  ❌ Rejected: ${rejected.length}/${results.length}`);
    console.log(`  💥 Errors: ${errors.length}/${results.length}`);
    console.log(`  📊 Avg Confidence: ${avgConfidence.toFixed(2)}`);
    console.log(`  ⏱️  Avg Time: ${(avgTime / 1000).toFixed(1)}s`);
    console.log(`  📝 Report: ${reportPath}`);
    console.log('═'.repeat(80));
}

runAudit().catch(console.error);

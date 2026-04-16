import { db } from '../lib/firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    serverTimestamp,
    limit,
    orderBy
} from 'firebase/firestore';

export interface AuditAnomaly {
    questionId: string;
    topic: string;
    failRate: number;
    avgEloOfFailures: number;
    reason: string;
    detectedAt: any;
}

export const auditService = {
    /**
     * Scans recent test results to identify potentially "broken" questions.
     * Logic: Identify questions where top-tier students (High Elo) have a significantly 
     * higher fail rate than expected, or where the universal success rate is < 5%.
     */
    runPerformanceAudit: async () => {
        console.log("🛠️ [Audit] Launching Autonomous Quality Scan...");
        
        // In a production environment, this would be a Cloud Function.
        // For the client-side implementation, we scan the 'mock_results' collection.
        const resultsRef = collection(db, 'mock_results');
        const recentResultsQ = query(resultsRef, orderBy('completedAt', 'desc'), limit(100));
        
        const snap = await getDocs(recentResultsQ);
        if (snap.empty) return { count: 0, anomalies: [] };

        const anomalies: AuditAnomaly[] = [];
        const questionStats: Record<string, { total: number; failed: number; highEloFailures: number; eloSum: number; topic: string }> = {};

        snap.docs.forEach(doc => {
            const data = doc.data();
            const userElo = data.userElo || 1000;
            const results = data.results || [];

            results.forEach((res: any) => {
                const qid = res.questionId;
                if (!questionStats[qid]) {
                    questionStats[qid] = { total: 0, failed: 0, highEloFailures: 0, eloSum: 0, topic: res.topic || 'Unknown' };
                }

                questionStats[qid].total++;
                if (!res.isCorrect) {
                    questionStats[qid].failed++;
                    questionStats[qid].eloSum += userElo;
                    if (userElo > 1600) {
                        questionStats[qid].highEloFailures++;
                    }
                }
            });
        });

        // Analyze stats
        for (const [qid, stats] of Object.entries(questionStats)) {
            const failRate = stats.failed / stats.total;
            const avgEloOfFailures = stats.failed > 0 ? stats.eloSum / stats.failed : 0;

            let isAnomalous = false;
            let reason = "";

            // Signal A: Impossible Question (Zero success rate in sample size > 5)
            if (stats.total >= 5 && failRate > 0.95) {
                isAnomalous = true;
                reason = "Extremely high failure rate (>95%). Possible hallucination or incorrect key.";
            }

            // Signal B: High-Ability Failure (Top students failing common question)
            if (stats.highEloFailures >= 2 && stats.total < 20) {
                isAnomalous = true;
                reason = "Multiple high-elo failures detected. Check for ambiguity.";
            }

            if (isAnomalous) {
                const anomaly: AuditAnomaly = {
                    questionId: qid,
                    topic: stats.topic,
                    failRate,
                    avgEloOfFailures,
                    reason,
                    detectedAt: serverTimestamp()
                };
                anomalies.push(anomaly);
                
                // Quarantine the question in the global audit pool
                await addDoc(collection(db, 'audit_quarantine'), anomaly);
            }
        }

        console.log(`✅ [Audit] Scan Complete. Detected ${anomalies.length} potential anomalies.`);
        return { count: anomalies.length, anomalies };
    }
};

# Claude Prompt: Rank Predictor Optimization

**Hey Claude!**

I am building an advanced Indian Competitive Exam Score Predictor module for an EdTech application. I need you to rewrite and highly optimize my `scoreToRank` function using hyper-accurate, real-world 2024/2025 candidate distribution curves. 

**Exams I need highly accurate interpolation for:**
1. JEE Mains (Max 300, ~14,00,000 candidates)
2. NEET (Max 720, ~25,00,000 candidates - *Please handle the massive inflation at the 700+ marks!*)
3. JEE Advanced (Max 360, ~1,50,000 candidates)
4. BITSAT (Max 390, ~3,00,000 candidates)
5. UPSC (Max 2025, ~15,000 mains candidates)
6. CLAT / GATE / Others (Optional but appreciated)

### How Our Code Currently Works (Context for you):
Our `PredictionService` is written in TypeScript. Here is the lifecycle of a prediction request:
1. **`applyNormalizationBias`**: First, the raw mock score is normalized for test difficulty. We specifically bypass this reduction if the score is in the top 5% (to avoid crushing perfect scorers).
2. **`calculateGrowthProjection`**: Next, it applies a growth factor based on the student's `topicStrength` and `consistencyFactor` over the remaining time until the exam. This yields a slightly higher `projectedScore`.
3. **`scoreToRank`**: Finally, this method maps that `projectedScore` to a rank (`predictedRank`) using piecewise interpolations (manually mapped brackets).

At the bottom of this file is my exact current code. I need you to output a rewritten, flawlessly accurate `scoreToRank` method that uses real-world percentiles and brackets instead of my rough estimates. It must remain in the same class format and take `(score: number, examType: string, constants: any)`.

---

```typescript
export const getExamConstants = (examType: string) => {
    const type = examType.toLowerCase();
    if (type.includes('neet') || type.includes('medical')) return { MAX_SCORE: 720, CANDIDATES: 2500000, VOLATILITY: 0.08, GROWTH: 0.10 };
    if (type.includes('advanced')) return { MAX_SCORE: 360, CANDIDATES: 150000, VOLATILITY: 0.20, GROWTH: 0.15 };
    if (type.includes('mains') || type.includes('jee')) return { MAX_SCORE: 300, CANDIDATES: 1400000, VOLATILITY: 0.15, GROWTH: 0.12 };
    if (type.includes('bitsat')) return { MAX_SCORE: 390, CANDIDATES: 300000, VOLATILITY: 0.12, GROWTH: 0.10 };
    if (type.includes('clat') || type.includes('law')) return { MAX_SCORE: 120, CANDIDATES: 100000, VOLATILITY: 0.10, GROWTH: 0.10 };
    if (type.includes('gate')) return { MAX_SCORE: 100, CANDIDATES: 100000, VOLATILITY: 0.18, GROWTH: 0.12 };
    if (type.includes('upsc')) return { MAX_SCORE: 2025, CANDIDATES: 15000, VOLATILITY: 0.05, GROWTH: 0.05 };
    return { MAX_SCORE: 100, CANDIDATES: 1500000, VOLATILITY: 0.05, GROWTH: 0.08 };
};

public scoreToRank(score: number, examType: string, constants?: any): { percentile: number; rank: number } {
    const c = constants || getExamConstants(examType);
    const type = examType.toLowerCase();
    let rank = c.CANDIDATES;

    if (type.includes('neet') || type.includes('medical')) {
        if (score >= 715) rank = 1 + (720 - score) * 15;
        // ... (Please provide accurate brackets)
    } else if (type.includes('mains') || type.includes('jee')) {
        if (score >= 298) rank = 1 + (300 - score) * 5; 
        // ... (Please provide accurate brackets)
    }
    // ... Please fill out the rest of the exams!

    rank = Math.max(1, Math.min(Math.round(rank), c.CANDIDATES));
    const percentile = Math.max(0, 100 - (rank / c.CANDIDATES) * 100);
    return { percentile, rank };
}
```

# 📡 SQUAD DISPATCH: #005 (DEEPSEEK)
**TASK:** High-Precision Rank Prediction Logic (v3.0)
**SQUAD ROLE:** THE LOGIC SPECIALIST

---

### 🧠 Task for The Logic Specialist:
"DeepSeek, I need you to refine our `PredictionService` logic. I am providing you with the current source code so you can rewrite the math precisely.

**Current `predictRank` logic:**
Uses an exponential curve: `currentScore + (gap * (1 - 1 / growthFactor))`.

**New Requirements for v3.0:**
1. **Dynamic Volatility:** As the exam gets closer (e.g., if `monthsUntilExam` < 2), the `GROWTH_RATE` should hit a plateu and the `DIFFICULTY_VOLATILITY` should increase by 25%.
2. **Consistency Multiplier:** If `consistencyFactor` is > 0.9, add a 'Momentum Bonus' to the learning curve.
3. **NEET Specific:** Add a logic to filter 'Score Compression' at the 650+ range (where many students score the same).

**Code Source to Refine:**
```typescript
private calculateGrowthProjection(currentScore, topicStrength, consistency, months, examType) {
    const constants = examType === 'JEE' ? this.JEE_CONSTANTS : this.NEET_CONSTANTS;
    const learningCurve = 1 - Math.exp(-topicStrength * 3);
    const effectiveGrowthRate = constants.GROWTH_RATE * consistency * learningCurve;
    const growthFactor = Math.pow(1 + effectiveGrowthRate, months);
    const maxAchievable = constants.MAX_SCORE * (0.7 + 0.3 * topicStrength);
    const gap = maxAchievable - currentScore;
    const projectedScore = currentScore + (gap * (1 - 1 / growthFactor));
    return Math.min(projectedScore, constants.MAX_SCORE);
}
```

Please rewrite the entire `PredictionService` class in TypeScript with these upgrades."

---
*Antigravity (Lead Engineer) is ready to upgrade the brain.*

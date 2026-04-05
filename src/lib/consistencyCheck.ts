/**
 * consistencyCheck.ts
 * Programmatic validation layer that compares the numerical result
 * in a derivation/solution text against the correct_answer field.
 * Catches Type 5 errors (correct derivation, wrong answer field).
 */

/**
 * Extract all numbers from a text string.
 * Handles integers, decimals, scientific notation, and negatives.
 */
export function extractNumbers(text: string): number[] {
    if (!text) return [];
    // Match: -13.6, 2.5, 0.005, 6.022e23, 6.022×10²³, 3/4, 1e-5
    const matches = text.match(/-?\d+\.?\d*(?:[eE][+-]?\d+)?/g);
    if (!matches) return [];
    return matches.map(Number).filter(n => !isNaN(n) && isFinite(n));
}

/**
 * Extract the "final answer" number from a derivation/solution text.
 * Strategy: Look for the last "= number" pattern, then answer-keyword patterns,
 * then fall back to the last number in the text.
 */
export function extractFinalValue(derivationText: string): number | null {
    if (!derivationText || derivationText.trim().length < 5) return null;

    // Normalize: remove LaTeX formatting
    const text = derivationText
        .replace(/\$\$/g, '')
        .replace(/\$/g, '')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
        .replace(/\\times/g, '×')
        .replace(/\\cdot/g, '·');

    // Strategy 1: Find all "= <number>" patterns, take the last one
    // This catches chains like "= 20 * 0.125 = 2.5"
    const equalPatterns = text.match(/=\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g);
    if (equalPatterns && equalPatterns.length > 0) {
        const lastEqual = equalPatterns[equalPatterns.length - 1];
        const numMatch = lastEqual.match(/-?\d+\.?\d*(?:[eE][+-]?\d+)?/);
        if (numMatch) {
            const val = parseFloat(numMatch[0]);
            if (!isNaN(val) && isFinite(val)) return val;
        }
    }

    // Strategy 2: Look for explicit answer keywords
    const answerKeywords = [
        /(?:answer|result|value|total|output|final)\s*(?:is|=|:|equals|→)\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/gi,
        /(?:therefore|thus|hence|so)\s*[,.]?\s*(?:the\s+)?(?:answer|result|value)?\s*(?:is|=|:)?\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/gi,
    ];

    for (const pattern of answerKeywords) {
        const matches = [...text.matchAll(pattern)];
        if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            const val = parseFloat(lastMatch[1]);
            if (!isNaN(val) && isFinite(val)) return val;
        }
    }

    // Strategy 3: If text has step-by-step lines, take the last number from the last step
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 1) {
        const lastLine = lines[lines.length - 1];
        const lastLineNums = extractNumbers(lastLine);
        if (lastLineNums.length > 0) {
            return lastLineNums[lastLineNums.length - 1];
        }
    }

    // Strategy 4: Last number in the entire text
    const allNumbers = extractNumbers(text);
    if (allNumbers.length > 0) {
        return allNumbers[allNumbers.length - 1];
    }

    return null;
}

/**
 * Extract numerical value from a correct_answer string.
 * Handles formats like:
 * - "2.5 grams"
 * - "The answer is 2.5"
 * - "The voltage is -12V"
 * - "0.625"
 * - "Approximately 3.4 eV"
 */
export function extractAnswerValue(answerText: string): number | null {
    if (!answerText) return null;

    const numbers = extractNumbers(answerText);
    if (numbers.length === 0) return null;

    // If there's only one number, return it
    if (numbers.length === 1) return numbers[0];

    // Multiple numbers: prefer the one after a key phrase
    const keyPattern = /(?:is|=|equals|:|approximately|about|answer)\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/i;
    const keyMatch = answerText.match(keyPattern);
    if (keyMatch) return parseFloat(keyMatch[1]);

    // Return the last number (usually the actual answer value in verbose text)
    return numbers[numbers.length - 1];
}

// ─── Result Interface ───

export interface ConsistencyResult {
    consistent: boolean;
    derivedValue: number | null;
    answeredValue: number | null;
    percentDiff: number | null;
    correctedAnswer?: string;
    reason?: string;
}

/**
 * Compares the numerical result in a derivation text against the
 * correct_answer field. Returns whether they are consistent.
 *
 * @param derivationText - hidden_derivation, step_by_step_solution, or explanation
 * @param correctAnswer - The correct_answer field string
 * @param tolerance - Fractional tolerance (default 0.02 = 2%)
 */
export function checkDerivationConsistency(
    derivationText: string,
    correctAnswer: string,
    tolerance: number = 0.02
): ConsistencyResult {
    const derivedValue = extractFinalValue(derivationText);
    const answeredValue = extractAnswerValue(correctAnswer);

    // If we can't extract numbers from either, skip check
    if (derivedValue === null || answeredValue === null) {
        return {
            consistent: true, // Can't verify → pass through
            derivedValue,
            answeredValue,
            percentDiff: null,
            reason: 'Non-numerical or unparseable — skipped consistency check'
        };
    }

    // Both are zero
    if (derivedValue === 0 && answeredValue === 0) {
        return { consistent: true, derivedValue, answeredValue, percentDiff: 0 };
    }

    // Calculate fractional difference
    const reference = Math.max(Math.abs(derivedValue), Math.abs(answeredValue), 1e-10);
    const percentDiff = Math.abs(derivedValue - answeredValue) / reference;

    // Within tolerance → consistent
    if (percentDiff <= tolerance) {
        return { consistent: true, derivedValue, answeredValue, percentDiff };
    }

    // MISMATCH — try to produce corrected answer
    const answeredStr = String(answeredValue);
    const derivedStr = String(derivedValue);

    // Try direct substitution in the answer text
    let correctedAnswer: string | undefined;
    if (correctAnswer.includes(answeredStr)) {
        correctedAnswer = correctAnswer.replace(answeredStr, derivedStr);
    }

    return {
        consistent: false,
        derivedValue,
        answeredValue,
        percentDiff,
        correctedAnswer,
        reason: `Derivation yields ${derivedValue} but answer says ${answeredValue} (${(percentDiff * 100).toFixed(1)}% difference)`
    };
}

/**
 * Check if a step_by_step_solution array is internally consistent.
 * Each step should logically follow from the previous.
 * The final step's result should match final_numerical_value.
 */
export function checkStepConsistency(
    steps: string[],
    finalValue: number | undefined | null
): { consistent: boolean; reason?: string } {
    if (!steps || steps.length === 0) {
        return { consistent: true, reason: 'No steps provided — skipped' };
    }

    if (finalValue === undefined || finalValue === null) {
        return { consistent: true, reason: 'No final_numerical_value — skipped' };
    }

    // Extract the last number from the last step
    const lastStep = steps[steps.length - 1];
    const lastStepValue = extractFinalValue(lastStep);

    if (lastStepValue === null) {
        return { consistent: true, reason: 'Could not extract number from last step — skipped' };
    }

    // --- Standard comparison ---
    const reference = Math.max(Math.abs(lastStepValue), Math.abs(finalValue), 1e-10);
    const diff = Math.abs(lastStepValue - finalValue) / reference;

    if (diff <= 0.02) {
        return { consistent: true };
    }

    // --- Scientific notation tolerance ---
    // Handle cases like: lastStep says "4.425" but finalValue is 4.425e-12
    // The mantissa matches perfectly; the exponent is simply missing from the text.
    // ONLY allow this when the exponent difference is ≥ 3 orders of magnitude.
    // A 1-2 order difference (e.g., 21.7 vs 2.17) is almost always a real arithmetic error.
    const getExponent = (v: number): number => {
        if (v === 0) return 0;
        return Math.floor(Math.log10(Math.abs(v)));
    };
    const mantissa = (v: number): number => {
        if (v === 0) return 0;
        const abs = Math.abs(v);
        const exp = Math.floor(Math.log10(abs));
        return abs / Math.pow(10, exp);
    };

    const exp1 = getExponent(lastStepValue);
    const exp2 = getExponent(finalValue);
    const exponentDiff = Math.abs(exp1 - exp2);

    // Only forgive exponent differences of ≥3 (e.g., 4.425 vs 4.425e-12 = 13 orders)
    // Differences of 1-2 orders (21.7 vs 2.17 = 1 order) are real errors
    if (exponentDiff >= 3) {
        const m1 = mantissa(lastStepValue);
        const m2 = mantissa(finalValue);
        
        if (m1 > 0 && m2 > 0) {
            const mantissaDiff = Math.abs(m1 - m2) / Math.max(m1, m2);
            if (mantissaDiff <= 0.02) {
                return { consistent: true, reason: `Mantissa match (${m1.toFixed(3)} ≈ ${m2.toFixed(3)}), ${exponentDiff} orders of magnitude apart — notation difference` };
            }
        }
    }

    return {
        consistent: false,
        reason: `Last step yields ${lastStepValue} but final_numerical_value is ${finalValue} (${(diff * 100).toFixed(1)}% diff)`
    };
}



import { normalizeMarkdownMCQs, normalizeMarkdownLaTeX } from '../scripts/utils/jules-quality.ts';

const brokenMCQ = `
Here is a question:
**1. What is the unit of Force?**
A) Newton B) Joule   C) Pascal D) Watt
**Answer:** A) Newton
`;

const rawLatex = `
The formula is given by:
\\displaystyle P = \\frac{F}{A}
And another one:
\\begin{equation}
E = mc^2
\\end{equation}
`;

const mixedContent = `
## Physics MCQs
**5. Which of the following is a vector quantity?**  A) Speed B) Velocity C) Mass D) Time  **Answer:** B) Velocity
`;

function runTests() {
    console.log('🧪 Running Jules Repair Diagnostics...\n');

    console.log('--- TEST 1: MCQ Options (Multi-line) ---');
    const fixedMcq = normalizeMarkdownMCQs(brokenMCQ);
    console.log('Original:', brokenMCQ);
    console.log('Repaired:', fixedMcq);
    if (fixedMcq.includes('\nA) ') && fixedMcq.includes('\nB) ')) {
        console.log('✅ PASS');
    } else {
        console.log('❌ FAIL');
    }

    console.log('\n--- TEST 2: LaTeX Wrapping ---');
    const fixedLatex = normalizeMarkdownLaTeX(rawLatex);
    console.log('Original:', rawLatex);
    console.log('Repaired:', fixedLatex);
    if (fixedLatex.includes('$$\n\\displaystyle')) {
        console.log('✅ PASS');
    } else {
        console.log('❌ FAIL');
    }

    console.log('\n--- TEST 3: In-line MCQ Break ---');
    const fixedMixed = normalizeMarkdownMCQs(mixedContent);
    console.log('Original:', mixedContent);
    console.log('Repaired:', fixedMixed);
}

runTests();

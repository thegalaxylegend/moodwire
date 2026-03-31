/**
 * factValidator.ts
 * Validates conceptual/biology/non-numerical questions.
 * Catches Type 4 errors (placeholder garbage, structurally broken questions).
 * 
 * For biology questions, this provides heuristic validation now.
 * A future RAG pipeline with NCERT content will provide deeper factual checks.
 */

// ─── Interfaces ───

export interface FactCheckResult {
    valid: boolean;
    reason?: string;
    severity?: 'critical' | 'warning';
}

// ─── Placeholder Detection Patterns ───

const PLACEHOLDER_PATTERNS: RegExp[] = [
    /\b(placeholder|lorem ipsum|template|sample question|example question|test question)\b/i,
    /\b(best describes the (core )?concept of)\b/i,
    /\bpractice question:/i,
    /\bfundamental principle of\b/i,
    /\b(which of the following is|what is the definition of)\b.*\b(correct|true|false)\b/i,
    /\b(insert|todo|tbd|fixme|xxx)\b/i,
];

const LAZY_OPTION_PATTERNS: RegExp[] = [
    /^[A-D]$/i,                              // Single letter: "A", "B"
    /^[A-D][.:)\s]/i,                        // Letter-prefix: "A.", "D: value"
    /^option\s*[A-D]$/i,                     // "Option A"
    /^all\s+of\s+the\s+above$/i,            // "All of the above"
    /^none\s+of\s+the\s+above$/i,           // "None of the above"
    /^both\s+[A-D]\s+and\s+[A-D]$/i,       // "Both A and B"
    /^placeholder$/i,                         // "Placeholder"
];

// ─── Subject-Specific Biology Terms ───
// A question about a biology topic should contain at least one of these terms
const BIOLOGY_TERMS: Record<string, string[]> = {
    'Evolution': ['evolution', 'natural selection', 'darwin', 'adaptation', 'speciation', 'fossil', 'genetic drift', 'hardy weinberg', 'mutation', 'variation'],
    'Human Health': ['disease', 'pathogen', 'immunity', 'vaccine', 'antibody', 'antigen', 'AIDS', 'HIV', 'cancer', 'drug', 'malaria', 'typhoid', 'bacteria', 'virus', 'immune'],
    'Cell Division': ['mitosis', 'meiosis', 'cell cycle', 'chromosome', 'spindle', 'metaphase', 'anaphase', 'daughter cell', 'cytokinesis'],
    'Genetics': ['gene', 'allele', 'genotype', 'phenotype', 'mendel', 'cross', 'dominant', 'recessive', 'chromosome', 'DNA', 'RNA', 'heredity'],
    'Ecology': ['ecosystem', 'food chain', 'food web', 'trophic', 'biodiversity', 'population', 'community', 'habitat', 'niche', 'succession'],
    'Reproduction': ['gamete', 'zygote', 'embryo', 'fertilization', 'pollination', 'ovule', 'seed', 'sperm', 'egg', 'reproductive'],
    'Biotechnology': ['recombinant', 'plasmid', 'restriction enzyme', 'PCR', 'gel electrophoresis', 'transgenic', 'cloning', 'vector', 'DNA ligase'],
};

// ─── Validation Functions ───

/**
 * Validates a conceptual/biology/non-numerical question for basic quality.
 * 
 * @param subject - The subject (Biology, Chemistry, etc.)
 * @param topic - The specific topic
 * @param question - The question text
 * @param correctAnswer - The correct answer string
 * @param options - Array of option strings
 */
export function checkConceptualQuestion(
    subject: string,
    topic: string,
    question: string,
    correctAnswer: string,
    options: string[] | Record<string, string>
): FactCheckResult {
    const optionsArray = Array.isArray(options) 
        ? options 
        : Object.values(options);
    
    const combinedText = question + ' ' + correctAnswer + ' ' + optionsArray.join(' ');

    // ── Check 1: Placeholder patterns ──
    for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(combinedText)) {
            return {
                valid: false,
                reason: `Placeholder/template pattern detected: "${pattern.source}"`,
                severity: 'critical'
            };
        }
    }

    // ── Check 2: Lazy option patterns ──
    const lazyOptions = optionsArray.filter(opt => {
        const trimmed = (typeof opt === 'string' ? opt : '').trim();
        return LAZY_OPTION_PATTERNS.some(p => p.test(trimmed));
    });
    if (lazyOptions.length > 0) {
        return {
            valid: false,
            reason: `Lazy/placeholder options found: ${JSON.stringify(lazyOptions)}`,
            severity: 'critical'
        };
    }

    // ── Check 3: Option minimum length ──
    const avgOptionLength = optionsArray.reduce((sum, opt) => 
        sum + (typeof opt === 'string' ? opt.trim().length : 0), 0
    ) / Math.max(optionsArray.length, 1);
    
    if (avgOptionLength < 10) {
        return {
            valid: false,
            reason: `Options too short (avg ${avgOptionLength.toFixed(0)} chars). Likely placeholder content.`,
            severity: 'critical'
        };
    }

    // ── Check 4: Option uniqueness ──
    const normalizedOptions = optionsArray.map(opt => 
        (typeof opt === 'string' ? opt : '').toLowerCase().trim()
    );
    const uniqueOptions = new Set(normalizedOptions);
    if (uniqueOptions.size < optionsArray.length) {
        return {
            valid: false,
            reason: `Duplicate options detected (${uniqueOptions.size} unique out of ${optionsArray.length})`,
            severity: 'critical'
        };
    }

    // ── Check 5: Option similarity — no two options should be >90% similar ──
    for (let i = 0; i < normalizedOptions.length; i++) {
        for (let j = i + 1; j < normalizedOptions.length; j++) {
            const similarity = calculateSimilarity(normalizedOptions[i], normalizedOptions[j]);
            if (similarity > 0.90 && normalizedOptions[i].length > 5) {
                return {
                    valid: false,
                    reason: `Options ${i + 1} and ${j + 1} are ${(similarity * 100).toFixed(0)}% similar — likely duplicates`,
                    severity: 'warning'
                };
            }
        }
    }

    // ── Check 6: Answer must be in options ──
    if (!optionsArray.includes(correctAnswer)) {
        // Try partial match
        const partialMatch = optionsArray.some(opt => 
            opt.includes(correctAnswer) || correctAnswer.includes(opt)
        );
        if (!partialMatch) {
            return {
                valid: false,
                reason: `correct_answer "${correctAnswer.slice(0, 50)}..." not found in any option`,
                severity: 'critical'
            };
        }
    }

    // ── Check 7: Biology-specific term validation ──
    if (subject.toLowerCase() === 'biology') {
        const topicLower = topic.toLowerCase();
        const questionLower = question.toLowerCase();
        
        // Find matching biology topic
        let hasRelevantTerms = false;
        for (const [bioTopic, terms] of Object.entries(BIOLOGY_TERMS)) {
            if (topicLower.includes(bioTopic.toLowerCase()) || bioTopic.toLowerCase().includes(topicLower)) {
                // Check if question contains at least one relevant term
                hasRelevantTerms = terms.some(term => 
                    questionLower.includes(term.toLowerCase())
                );
                if (!hasRelevantTerms) {
                    return {
                        valid: false,
                        reason: `Biology question about "${topic}" doesn't contain any topic-specific terms. Likely generic/placeholder.`,
                        severity: 'warning'
                    };
                }
                break;
            }
        }
    }

    // ── Check 8: Question must be substantive ──
    if (question.trim().length < 40) {
        return {
            valid: false,
            reason: `Question too short (${question.trim().length} chars). Minimum 40 for conceptual questions.`,
            severity: 'warning'
        };
    }

    // ── Check 9: Question should not be identical to any option ──
    const questionNorm = question.toLowerCase().trim();
    for (const opt of normalizedOptions) {
        if (opt.length > 20 && (questionNorm.includes(opt) || opt.includes(questionNorm))) {
            return {
                valid: false,
                reason: `Question text is too similar to an option — likely copy-paste error`,
                severity: 'warning'
            };
        }
    }

    return { valid: true };
}

// ─── Utility Functions ───

/**
 * Simple character-level similarity between two strings.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
function calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Use longest common subsequence ratio
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    let matches = 0;
    const longerChars = longer.split('');
    const shorterChars = shorter.split('');
    
    let j = 0;
    for (let i = 0; i < longerChars.length && j < shorterChars.length; i++) {
        if (longerChars[i] === shorterChars[j]) {
            matches++;
            j++;
        }
    }

    return matches / longer.length;
}

/**
 * Determine if a question is numerical or conceptual.
 * Numerical questions involve calculations; conceptual ones involve facts.
 */
export function isNumericalQuestion(
    question: string,
    subject: string,
    options: string[]
): boolean {
    const questionLower = question.toLowerCase();
    
    // Strong numerical indicators
    const numericalKeywords = [
        'calculate', 'find the value', 'determine the', 'compute',
        'what is the numerical', 'how many', 'how much',
        'what will be the', 'the value of',
    ];
    
    if (numericalKeywords.some(kw => questionLower.includes(kw))) {
        return true;
    }

    // Check if options contain numbers
    const optionsWithNumbers = options.filter(opt => {
        const nums = opt.match(/\d+\.?\d*/g);
        return nums && nums.length > 0;
    });
    
    if (optionsWithNumbers.length >= 3) {
        return true; // Most options have numbers → numerical question
    }

    // Biology is almost always conceptual
    if (subject.toLowerCase() === 'biology') {
        return false;
    }

    return false; // Default to conceptual if unsure
}

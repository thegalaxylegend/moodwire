export interface DomainValidationResult {
    valid: boolean;
    reason?: string;
}

export type DomainValidator = (questionText: string, options: string[], derivation: string) => DomainValidationResult;

/**
 * Domain-specific deterministic validators.
 * This is the foundation for the "AST / Equation Extraction Layer" and
 * "Question Type Specific Validators" (e.g. mechanicsValidator, electrostaticsValidator).
 * 
 * Instead of relying on LLM semantic verification (which is vulnerable to the "Verifier Agreement Illusion"),
 * we map specific topics to deterministic code that checks for required physical constraints.
 */
const domainRegistry: Record<string, DomainValidator> = {
    'rolling_motion': (questionText, _options, derivation) => {
        const textLower = (questionText + derivation).toLowerCase();
        
        // Ensure no-slip condition / rolling without slipping is mentioned or implied
        if (!textLower.includes('rolling') && !textLower.includes('no slip') && !textLower.includes('without slipping')) {
            return { valid: false, reason: "Rolling motion question must explicitly state 'rolling' or 'without slipping'." };
        }

        // Ensure rotational kinetic energy or moment of inertia is considered
        if (!textLower.includes('inertia') && !textLower.includes('mr²') && !textLower.includes('mr^2') && !textLower.includes('rotational')) {
            return { valid: false, reason: "Rolling motion derivation missing moment of inertia or rotational KE considerations." };
        }

        return { valid: true };
    },
    'thermodynamics': (questionText, _options, derivation) => {
        const textLower = (questionText + derivation).toLowerCase();
        
        // Ensure cyclic processes close properly or specific heat capacities are used
        if (textLower.includes('cycle') && !textLower.includes('net work') && !textLower.includes('efficiency')) {
            return { valid: false, reason: "Thermodynamic cycle question lacks work/efficiency constraints." };
        }
        
        return { valid: true };
    }
};

/**
 * Normalizes topic strings to map to the registry.
 */
const normalizeTopic = (topic: string): string => {
    const t = topic.toLowerCase();
    if (t.includes('roll') || t.includes('rotational dynamics')) return 'rolling_motion';
    if (t.includes('thermo')) return 'thermodynamics';
    return 'generic';
};

/**
 * Runs the domain-specific deterministic validator for a given topic.
 */
export const runDomainSpecificValidation = (topic: string, questionText: string, options: string[], derivation: string): DomainValidationResult => {
    const key = normalizeTopic(topic);
    const validator = domainRegistry[key];
    
    if (validator) {
        return validator(questionText, options, derivation);
    }
    
    // If no specific validator exists yet, pass by default (fallback to Tier 1 generic checks)
    return { valid: true };
};

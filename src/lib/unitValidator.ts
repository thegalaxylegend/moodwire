/**
 * unitValidator.ts
 * Validates that dimensionless quantities don't have units in the answer.
 * Catches Type 6 errors (e.g., eccentricity = "Meter").
 */

// ─── Dimensionless Quantities in JEE/NEET Syllabus ───

const DIMENSIONLESS_QUANTITIES: string[] = [
    // Mathematics
    'eccentricity', 'probability', 'percentage',
    
    // Physics — Mechanics
    'coefficient of friction', 'coefficient of restitution',
    'poisson ratio', 'poissons ratio', "poisson's ratio",
    'strain', 'relative density', 'specific gravity',
    
    // Physics — Electromagnetism
    'relative permittivity', 'dielectric constant',
    'relative permeability', 'susceptibility',
    'power factor', 'quality factor', 'q factor',
    
    // Physics — Optics
    'refractive index', 'magnification', 'numerical aperture',
    'f-number', 'f number', 'resolving power',
    
    // Physics — Thermal
    'emissivity', 'absorptivity', 'transmissivity',
    'compressibility factor',
    
    // Physics — Nuclear/Quantum
    'atomic number', 'mass number', 'quantum number',
    'principal quantum number', 'azimuthal quantum number',
    'magnetic quantum number', 'spin quantum number',
    'neutron number', 'proton number',
    
    // Physics — Waves
    'mach number', 'fresnel number',
    
    // Physics — Fluid
    'reynolds number', 'froude number',
    
    // Chemistry
    'oxidation number', 'oxidation state', 'coordination number',
    'ph', 'poh', 'pka', 'pkb', 'pka value', 'pkb value',
    'mole fraction', 'mass fraction', 'volume fraction',
    'degree of dissociation', 'degree of ionization',
    'vant hoff factor', "van't hoff factor", 'i factor',
    'bond order',
    
    // General
    'efficiency', 'yield', 'fraction', 'proportion',
];

// ─── Common Unit Indicators ───

const UNIT_INDICATORS: string[] = [
    // SI base units
    'meter', 'metre', 'meters', 'metres', 'm ',
    'kilogram', 'kg', 'gram', 'grams', 'g ',
    'second', 'seconds', 'sec', ' s ',
    'ampere', 'amperes', 'amp',
    'kelvin', ' k ',
    'mole', 'moles', 'mol',
    'candela',
    
    // SI derived units
    'newton', 'newtons', ' n ',
    'joule', 'joules', ' j ',
    'watt', 'watts', ' w ',
    'pascal', 'pascals', ' pa ',
    'hertz', ' hz',
    'coulomb', 'coulombs', ' c ',
    'volt', 'volts', ' v ',
    'ohm', 'ohms', ' ω ',
    'farad', 'farads',
    'tesla', ' t ',
    'weber', 'webers',
    'henry', 'henrys', 'henries',
    'lumen', 'lumens',
    'lux',
    'becquerel',
    'sievert',
    
    // Common non-SI units
    'litre', 'liter', 'litres', 'liters', ' l ',
    'calorie', 'calories', 'cal',
    'electronvolt', 'electron volt', ' ev ',
    'atmosphere', 'atm',
    'bar', 'torr',
    
    // Compound units
    'm/s', 'km/h', 'km/s', 'cm/s',
    'rad/s', 'rev/s',
    'kg/m', 'g/ml', 'g/cm',
    'n/m', 'j/k',
    'mol/l', 'mol/L', 'm/l',
    
    // Angular
    'radian', 'radians', 'rad',
    'degree', 'degrees', '°',
    
    // Length
    'cm', 'mm', 'km', 'nm', 'angstrom', 'å',
    'inch', 'feet', 'foot',
    
    // Area/Volume
    'm²', 'm³', 'cm²', 'cm³',
    
    // Temperature
    'celsius', '°c', '°C', 'fahrenheit', '°f',
];

// ─── Public Interface ───

export interface UnitValidation {
    valid: boolean;
    reason?: string;
}

/**
 * Validates that the answer doesn't assign units to dimensionless quantities.
 * 
 * @param topicName - The topic of the question
 * @param answerText - The correct_answer string
 * @param questionText - The question text (for context)
 */
export function validateUnits(
    topicName: string,
    answerText: string,
    questionText: string
): UnitValidation {
    const combined = (topicName + ' ' + questionText).toLowerCase();
    const answerLower = answerText.toLowerCase();

    // Check if we're dealing with a dimensionless quantity
    const matchedDimensionless = DIMENSIONLESS_QUANTITIES.find(dq => 
        combined.includes(dq.toLowerCase())
    );

    if (matchedDimensionless) {
        // Check if the answer contains unit indicators
        // Be careful: some unit words can appear in non-unit contexts
        // Only flag if there's a NUMBER followed by a UNIT
        const numberUnitPattern = /\d+\.?\d*\s*(meter|metre|kg|gram|second|newton|joule|watt|pascal|hertz|coulomb|volt|ohm|tesla|litre|liter|calorie|eV|atm|cm|mm|km|nm|mol\/l|m\/s|rad\/s|angstrom)/i;
        
        const hasUnitAfterNumber = numberUnitPattern.test(answerText);
        
        if (hasUnitAfterNumber) {
            return {
                valid: false,
                reason: `Dimensionless quantity "${matchedDimensionless}" detected but answer contains units: "${answerText}"`
            };
        }

        // Also check for standalone unit words at the end of the answer
        const trailingUnit = /\d+\.?\d*\s+(meters?|metres?|kg|grams?|seconds?|newtons?|joules?|watts?|volts?|ohms?|cm|mm|km)\s*$/i;
        if (trailingUnit.test(answerText.trim())) {
            return {
                valid: false,
                reason: `Dimensionless quantity "${matchedDimensionless}" has trailing unit in answer: "${answerText}"`
            };
        }
    }

    // Additional check: if the answer is just a unit name with no value
    // e.g., correct_answer = "Meter" for eccentricity
    if (matchedDimensionless) {
        const pureUnit = UNIT_INDICATORS.some(unit => {
            const trimmedUnit = unit.trim().toLowerCase();
            return trimmedUnit.length > 2 && answerLower.trim() === trimmedUnit;
        });
        if (pureUnit) {
            return {
                valid: false,
                reason: `Answer is a pure unit "${answerText}" for dimensionless quantity "${matchedDimensionless}"`
            };
        }
    }

    return { valid: true };
}

/**
 * Check if the question involves a dimensionless quantity.
 * Useful for flagging questions that need extra unit scrutiny.
 */
export function isDimensionlessQuestion(topic: string, question: string): boolean {
    const combined = (topic + ' ' + question).toLowerCase();
    return DIMENSIONLESS_QUANTITIES.some(dq => combined.includes(dq.toLowerCase()));
}

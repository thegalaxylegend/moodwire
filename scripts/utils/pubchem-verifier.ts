/**
 * ⚗️ PubChem Chemistry Verifier (Feature 2.6)
 *
 * Uses the NIH PubChem PUG REST API to fetch verified chemical data.
 * No API key required. Used to validate and enrich Chemistry blogs.
 * 
 * PubChem API: https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/property/.../JSON
 * Rate limit: Max 5 requests/second (very generous)
 */

export interface CompoundData {
    name: string;
    formula: string;        // e.g. "C6H12O6"
    weight: string;         // e.g. "180.16" g/mol
    iupacName: string;      // Systematic IUPAC name
    cid: number;            // PubChem Compound ID
    link: string;           // Direct PubChem page link
}

/**
 * Fetches verified chemical data for a compound by common name.
 * Returns null if compound not found.
 */
export async function fetchCompoundData(compoundName: string): Promise<CompoundData | null> {
    try {
        const encoded = encodeURIComponent(compoundName.trim());
        const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;

        const response = await fetch(url);
        if (!response.ok) return null;

        const data: any = await response.json();
        const props = data?.PropertyTable?.Properties?.[0];
        if (!props) return null;

        return {
            name: compoundName,
            formula: props.MolecularFormula,
            weight: props.MolecularWeight,
            iupacName: props.IUPACName,
            cid: props.CID,
            link: `https://pubchem.ncbi.nlm.nih.gov/compound/${props.CID}`
        };
    } catch {
        return null;
    }
}

/**
 * Scans a blog body for chemical names and builds a "Chemical Quick Reference" table.
 * Common NCERT Chemistry compounds are recognized.
 */
const CBSE_COMPOUNDS = [
    'glucose', 'fructose', 'sucrose', 'water', 'ethanol', 'methanol',
    'sodium chloride', 'hydrochloric acid', 'sulphuric acid', 'nitric acid',
    'sodium hydroxide', 'calcium carbonate', 'ammonia', 'carbon dioxide',
    'benzene', 'acetone', 'acetic acid', 'urea', 'chloroform',
    'sodium bicarbonate', 'potassium permanganate', 'hydrogen peroxide'
];

export async function buildChemistryTable(blogBody: string): Promise<string | null> {
    const bodyLower = blogBody.toLowerCase();
    
    // Find which CBSE compounds are mentioned in this blog
    const mentioned = CBSE_COMPOUNDS.filter(c => bodyLower.includes(c));
    if (mentioned.length === 0) return null;

    // Fetch data for up to 4 compounds (rate limit caution)
    const limit = Math.min(4, mentioned.length);
    const rows: string[] = [];
    
    for (let i = 0; i < limit; i++) {
        const data = await fetchCompoundData(mentioned[i]);
        if (data) {
            rows.push(`| **${data.name}** | $$${data.formula}$$ | ${data.weight} g/mol | [PubChem ↗](${data.link}) |`);
        }
        // Small delay to respect 5 req/sec limit
        if (i < limit - 1) await new Promise(r => setTimeout(r, 250));
    }

    if (rows.length === 0) return null;

    return `\n## ⚗️ Chemical Quick Reference (Verified via PubChem)\n\n| Compound | Formula | Mol. Weight | Source |\n|:---|:---:|:---:|:---:|\n${rows.join('\n')}\n`;
}

// CLI test
if (process.argv[1].includes('pubchem-verifier')) {
    const compound = process.argv[2] || 'glucose';
    fetchCompoundData(compound).then(data => {
        if (data) {
            console.log(`✅ ${data.name}: ${data.formula} (${data.weight} g/mol)`);
            console.log(`   IUPAC: ${data.iupacName}`);
            console.log(`   Link: ${data.link}`);
        } else {
            console.log('❌ Compound not found.');
        }
    });
}

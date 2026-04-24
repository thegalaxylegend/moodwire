/**
 * 🐌 Unified Slug Utility
 * 
 * Ensures consistent URL/Slug generation across the entire Jules pipeline.
 * Standardizes how prepositions and special characters are handled to prevent 404s.
 */

export function slugify(text: string): string {
    if (!text) return "";
    
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\bn\b/g, 'and')        // Fix shorthand 'n' -> 'and'
        .replace(/&/g, 'and')           // Standardize ampersand
        .replace(/\+/g, 'plus')         // Standardize plus
        .replace(/['"]/g, '')           // Remove quotes
        .replace(/[^\w\s-]/g, '')       // Remove all other special chars
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/-+/g, '-')            // Remove double hyphens
        .replace(/^-+/, '')             // Remove leading hyphens
        .replace(/-+$/, '');            // Remove trailing hyphens
}

/**
 * 🛠️ Link Repair Logic
 * 
 * Tries to find the correct slug for a broken/mangled link.
 */
export function fuzzyMatchSlug(mangledSlug: string, existingSlugs: Set<string>): string | null {
    if (existingSlugs.has(mangledSlug)) return mangledSlug;

    // Try common mangling repairs
    const candidates = [
        mangledSlug.replace(/-n-/g, '-and-'),
        mangledSlug.replace(/-n-/g, '-in-'),
        mangledSlug.replace(/-n-/g, '-of-'),
        mangledSlug.replace(/-n-/g, '-on-'),
        mangledSlug.replace(/-n-/g, '-'), // Try just removing it
        mangledSlug.replace(/-and-/g, '-n-'), // Inverse
    ];

    for (const cand of candidates) {
        if (existingSlugs.has(cand)) return cand;
    }

    return null;
}

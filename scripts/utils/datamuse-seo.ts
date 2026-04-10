/**
 * 🔍 Datamuse SEO Keyword Enricher (Feature 2.7)
 *
 * Uses the Datamuse word API to find semantically related keywords.
 * No API key required. Used to improve blog meta descriptions and tags 
 * for LSI (Latent Semantic Indexing) SEO.
 *
 * Datamuse API: https://api.datamuse.com/words
 * Rate limit: No hard limit for reasonable use (< 100k/day)
 */

export interface KeywordSuggestion {
    word: string;
    score: number;      // Datamuse relevance score
    tags?: string[];    // e.g. ["syn", "adj"]
}

/**
 * Fetches semantically related words for a topic — used for LSI SEO.
 * 'ml' = words with similar meaning, 'rel_trg' = topically related
 */
export async function fetchRelatedKeywords(topic: string, limit: number = 10): Promise<string[]> {
    try {
        const encoded = encodeURIComponent(topic.trim());
        // 'ml' = "means like" — finds synonyms and related concepts
        const url = `https://api.datamuse.com/words?ml=${encoded}&max=${limit}`;
        
        const response = await fetch(url);
        if (!response.ok) return [];

        const data: KeywordSuggestion[] = await response.json() as KeywordSuggestion[];
        
        // Filter to high-confidence suggestions only (score > 1000)
        return data
            .filter(k => k.score > 1000)
            .map(k => k.word)
            .slice(0, limit);
    } catch {
        return [];
    }
}

/**
 * Fetches words that are frequently used in the same context (topically related).
 * Great for finding supporting vocabulary for academic content.
 */
export async function fetchTopicKeywords(topic: string, limit: number = 15): Promise<string[]> {
    try {
        const encoded = encodeURIComponent(topic.trim());
        // 'rel_trg' = "trigger words" — commonly associated terms
        const url = `https://api.datamuse.com/words?rel_trg=${encoded}&max=${limit}`;
        
        const response = await fetch(url);
        if (!response.ok) return [];

        const data: KeywordSuggestion[] = await response.json() as KeywordSuggestion[];
        return data.map(k => k.word).slice(0, limit);
    } catch {
        return [];
    }
}

/**
 * Generates SEO-optimized keyword string for a blog's meta tags.
 * Combines both related and topical keywords.
 */
export async function buildSEOKeywords(topic: string, subject: string): Promise<string> {
    const [related, topical] = await Promise.all([
        fetchRelatedKeywords(topic, 8),
        fetchTopicKeywords(topic, 8)
    ]);

    const combined = [...new Set([topic, subject, ...related, ...topical])];
    return combined.slice(0, 15).join(', ');
}

// CLI test
if (process.argv[1].includes('datamuse-seo')) {
    const topic = process.argv[2] || 'photosynthesis';
    fetchRelatedKeywords(topic).then(keywords => {
        console.log(`📊 Related keywords for "${topic}":`);
        console.log(keywords.join(', '));
    });
}

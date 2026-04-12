/**
 * AcademicSearchService
 * 
 * A specialized service for academic grounding and mathematical verification.
 * Focuses on Category A APIs (No API Key required).
 */

export interface ArXivResult {
    title: string;
    summary: string;
    published: string;
    url: string;
}

export interface WikiResult {
    title: string;
    extract: string;
}

export interface NewtonResult {
    operation: string;
    expression: string;
    result: string;
}

// Stateless In-Memory Cache to prevent redundant hits in a single run
const _cache = new Map<string, any>();

export const AcademicSearchService = {
    /**
     * Search arXiv for research papers.
     * @param query The search query (e.g. "quantum mechanics")
     */
    searchArXiv: async (query: string, maxResults: number = 2): Promise<ArXivResult[]> => {
        const cacheKey = `arxiv:${query}`;
        if (_cache.has(cacheKey)) return _cache.get(cacheKey);

        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}`;
            
            const response = await fetch(url);
            if (!response.ok) return [];
            
            const xml = await response.text();
            
            // Minimalist XML parsing (browser/node compatible)
            const results: ArXivResult[] = [];
            const entries = xml.split('<entry>');
            
            for (let i = 1; i < entries.length; i++) {
                const entry = entries[i];
                const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || 'No Title';
                // Truncate summary to 400 chars to save LLM context tokens
                const summary = entry.match(/<summary>(.*?)<\/summary>/s)?.[1] || '';
                const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
                const link = entry.match(/<link href="(.*?)"/)?.[1] || '';
                
                results.push({
                    title: title.trim(),
                    summary: summary.trim().substring(0, 400).replace(/\n/g, ' ') + '...',
                    published: published.trim(),
                    url: link
                });
            }
            
            _cache.set(cacheKey, results);
            return results;
        } catch (error) {
            console.error('AcademicSearchService: arXiv search failed', error);
            return [];
        }
    },

    /**
     * Newton Math API: Simplify, Factor, Derive, Integrate.
     * @param operation 'simplify' | 'factor' | 'derive' | 'integrate'
     * @param expression The math expression (e.g. "x^2 + 2x + 1")
     */
    mathOperation: async (operation: string, expression: string): Promise<string | null> => {
        try {
            // URL encode the expression (Newton requires this for characters like ^ and +)
            const encodedExpression = encodeURIComponent(expression);
            const url = `https://newton.vercel.app/api/v2/${operation}/${encodedExpression}`;
            
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const data: NewtonResult = await response.json();
            return data.result;
        } catch (error) {
            console.error(`AcademicSearchService: Newton ${operation} failed`, error);
            return null;
        }
    },

    /**
     * Open Library Search: Find textbooks and classic academic works.
     * @param query The book title or author
     */
    searchBooks: async (query: string, limit: number = 2): Promise<any[]> => {
        const cacheKey = `books:${query}`;
        if (_cache.has(cacheKey)) return _cache.get(cacheKey);

        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=${limit}`;
            
            const response = await fetch(url);
            if (!response.ok) return [];
            
            const data = await response.json();
            const results = data.docs.map((doc: any) => ({
                title: doc.title,
                author: doc.author_name?.[0] || 'Unknown Author',
                year: doc.first_publish_year,
                key: doc.key
            }));
            
            _cache.set(cacheKey, results);
            return results;
        } catch (error) {
            console.error('AcademicSearchService: Open Library search failed', error);
            return [];
        }
    },

    /**
     * Wikipedia Summary API: Fetch high-level concept overviews.
     */
    getWikiSummary: async (query: string): Promise<WikiResult | null> => {
        const cacheKey = `wiki:${query}`;
        if (_cache.has(cacheKey)) return _cache.get(cacheKey);

        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`);
            if (!response.ok) return null;
            
            const data = await response.json();
            const result = {
                title: data.title,
                extract: data.extract.substring(0, 500) // Truncate to save tokens
            };
            
            _cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('AcademicSearchService: Wikipedia fetch failed', error);
            return null;
        }
    },

    /**
     * Semantic Scholar Search: Best-in-class academic citation and abstract search.
     * Note: Requires VITE_SEMANTIC_SCHOLAR_KEY for high limits.
     */
    searchSemanticScholar: async (query: string, limit: number = 2): Promise<any[]> => {
        const cacheKey = `semantic:${query}`;
        if (_cache.has(cacheKey)) return _cache.get(cacheKey);

        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&limit=${limit}&fields=title,abstract,url,year`;
            
            // @ts-ignore
            const apiKey = typeof process !== 'undefined' ? process.env.VITE_SEMANTIC_SCHOLAR_KEY : import.meta.env.VITE_SEMANTIC_SCHOLAR_KEY;
            
            const response = await fetch(url, {
                headers: apiKey ? { 'x-api-key': apiKey } : {}
            });

            if (!response.ok) return [];
            
            const data = await response.json();
            const results = (data.data || []).map((paper: any) => ({
                title: paper.title,
                abstract: paper.abstract?.substring(0, 400) || 'No abstract available.',
                url: paper.url,
                year: paper.year
            }));
            
            _cache.set(cacheKey, results);
            return results;
        } catch (error) {
            console.error('AcademicSearchService: Semantic Scholar failed', error);
            return [];
        }
    }
};

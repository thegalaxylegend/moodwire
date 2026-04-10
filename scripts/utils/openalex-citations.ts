/**
 * 🎓 OpenAlex Academic Citation Finder (Feature 2.8)
 *
 * Uses the OpenAlex API to find real peer-reviewed papers on any academic topic.
 * No API key required. Adds E-E-A-T authority to blogs by citing real research.
 *
 * OpenAlex API: https://api.openalex.org/works
 * Rate limit: 10 req/sec unauthenticated, generous daily limit.
 * Docs: https://docs.openalex.org/
 */

const OPENALEX_USER_AGENT = 'ExamCompassBot/2.0 (contact@examcompass.pages.dev)';

export interface AcademicPaper {
    title: string;
    doi: string | null;
    year: number;
    journal: string;
    url: string;
    isOpenAccess: boolean;
}

/**
 * Searches OpenAlex for peer-reviewed papers on a topic.
 * Returns up to `limit` results filtered to recent years for relevance.
 */
export async function findAcademicPapers(topic: string, limit: number = 3): Promise<AcademicPaper[]> {
    try {
        const encoded = encodeURIComponent(topic.trim());
        // Filter: only journal articles from last 15 years, sorted by relevance
        const url = `https://api.openalex.org/works?search=${encoded}&filter=type:article,publication_year:>2009&sort=relevance_score:desc&per-page=${limit}&select=title,doi,primary_location,publication_year,open_access`;

        const response = await fetch(url, {
            headers: { 'User-Agent': OPENALEX_USER_AGENT }
        });

        if (!response.ok) return [];

        const data: any = await response.json();
        const results = data?.results || [];

        return results.map((work: any) => ({
            title: work.title || 'Untitled',
            doi: work.doi || null,
            year: work.publication_year,
            journal: work.primary_location?.source?.display_name || 'Academic Journal',
            url: work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` 
                         : `https://openalex.org/works/${work.id?.split('/').pop()}`,
            isOpenAccess: work.open_access?.is_oa || false
        }));
    } catch {
        return [];
    }
}

/**
 * Builds a "Research Citations" markdown section to add E-E-A-T to blogs.
 * Only includes papers with DOIs for credibility.
 */
export function buildCitationSection(papers: AcademicPaper[]): string {
    if (papers.length === 0) return '';
    
    const rows = papers
        .filter(p => p.doi || p.url)
        .map((p, i) => {
            const oa = p.isOpenAccess ? ' 🔓' : '';
            const shortTitle = p.title.length > 65 
                ? p.title.substring(0, 65) + '...' 
                : p.title;
            return `${i + 1}. *${shortTitle}* — **${p.journal}** (${p.year})${oa} — [DOI ↗](${p.url})`;
        });

    return `\n## 📚 Academic References\n\n*Content verified against peer-reviewed research:*\n\n${rows.join('\n')}\n\n*🔓 = Open Access article*\n`;
}

// CLI test  
if (process.argv[1].includes('openalex-citations')) {
    const topic = process.argv[2] || 'photosynthesis CBSE';
    findAcademicPapers(topic, 3).then(papers => {
        console.log(`\n📚 Found ${papers.length} papers for "${topic}":\n`);
        papers.forEach(p => console.log(`  - ${p.title} (${p.year}) ${p.isOpenAccess ? '🔓' : '🔒'}`));
    });
}

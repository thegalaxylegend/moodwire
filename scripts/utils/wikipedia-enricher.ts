/**
 * 📖 Wikipedia Academic Enricher (Feature 2.5)
 *
 * Uses the Wikipedia REST API to fetch verified summaries for any academic topic.
 * No API key required. Adds E-E-A-T authority to blogs by cross-referencing definitions.
 * 
 * Wikipedia REST API: https://en.wikipedia.org/api/rest_v1/page/summary/{topic}
 * Rate limit: Polite use — no hard limit, but include User-Agent.
 */

const WIKI_USER_AGENT = 'ExamCompassBot/2.0 (https://examcompass.pages.dev; contact@examcompass.pages.dev)';

export interface WikiSummary {
    title: string;
    extract: string;        // Plain text summary (1–3 sentences)
    description: string;    // Short label e.g. "chemical process"
    content_urls: { desktop: { page: string } };
}

/**
 * Fetches a verified Wikipedia summary for a given academic topic.
 * Returns null gracefully if not found or on network error.
 */
export async function fetchWikiSummary(topic: string): Promise<WikiSummary | null> {
    try {
        // Wikipedia uses underscores in URLs, not spaces
        const encoded = encodeURIComponent(topic.replace(/ /g, '_'));
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': WIKI_USER_AGENT,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Try a simplified topic name (e.g., remove "Class 12" from "Photosynthesis Class 12")
            const simpleTopic = topic.replace(/class \d+|cbse|neet|jee|revision|notes/gi, '').trim();
            if (simpleTopic !== topic) return fetchWikiSummary(simpleTopic);
            return null;
        }

        const data: WikiSummary = await response.json() as WikiSummary;
        
        // Reject disambiguation pages (they have type: "disambiguation")
        if ((data as any).type === 'disambiguation') return null;
        
        return data;
    } catch {
        return null;
    }
}

/**
 * Generates a "Did You Know?" markdown callout from a Wikipedia summary.
 * Used to inject verified context into blog posts.
 */
export function buildWikiCallout(wiki: WikiSummary): string {
    const clean = wiki.extract
        .split('.')[0]  // First sentence only
        .trim();
    
    return `\n> 📖 **Wikipedia Says:** ${clean}. [Read full article →](${wiki.content_urls.desktop.page})\n`;
}

// CLI test
if (process.argv[1].includes('wikipedia-enricher')) {
    const topic = process.argv[2] || 'Photosynthesis';
    fetchWikiSummary(topic).then(data => {
        if (data) {
            console.log('Title:', data.title);
            console.log('Extract:', data.extract.substring(0, 200));
        } else {
            console.log('No result found.');
        }
    });
}

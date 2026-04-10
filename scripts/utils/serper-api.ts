/**
 * 🕵️ SEO Scout Intelligence (Feature 2.10)
 * 
 * Uses Serper.dev to fetch Google "People Also Ask" and "Related Searches".
 * Helps Jules generate FAQs that students are actually searching for.
 * 
 * Serper: https://serper.dev/
 */

import 'dotenv/config';

const SERPER_API_KEY = process.env.SERPER_API_KEY;

export interface SearchIntelligence {
    peopleAlsoAsk: Array<{ question: string; snippet: string; title: string; link: string }>;
    relatedSearches: string[];
}

/**
 * Fetches SEO intelligence for a given topic.
 */
export async function fetchSearchIntelligence(topic: string): Promise<SearchIntelligence | null> {
    if (!SERPER_API_KEY) {
        console.warn("⚠️ SERPER_API_KEY missing. Skipping search intelligence.");
        return null;
    }

    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 
                'X-API-KEY': SERPER_API_KEY, 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: topic, gl: 'in', hl: 'en' }) // Region set to India
        });

        if (!response.ok) return null;

        const data: any = await response.json();
        
        return {
            peopleAlsoAsk: data.peopleAlsoAsk || [],
            relatedSearches: (data.relatedSearches || []).map((s: any) => s.query)
        };
    } catch (err: any) {
        console.error(`❌ Serper error: ${err.message}`);
        return null;
    }
}

/**
 * Formats PAA questions for prompt inclusion.
 */
export function buildPAAContext(intel: SearchIntelligence): string {
    if (intel.peopleAlsoAsk.length === 0) return '';
    
    const questions = intel.peopleAlsoAsk.map((p, i) => `${i+1}. ${p.question}`).join('\n');
    return `\nGoogle "People Also Ask" Data:\n${questions}\nUse these to generate a highly relevant FAQ section.`;
}

// CLI test
if (process.argv[1].endsWith('serper-api.ts')) {
    const topic = process.argv[2] || 'Newton law of motion';
    fetchSearchIntelligence(topic).then(data => {
        console.log(`🕵️ Intelligence for "${topic}":`);
        console.log(JSON.stringify(data, null, 2));
    });
}

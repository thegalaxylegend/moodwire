/**
 * ExternalApiService
 * 
 * A central hub for fetching data from external free and public APIs.
 * Supports: Dictionary, Wikipedia, URL-to-Markdown (Jina), and Quotes.
 * Now integrated with Exa AI for neural search.
 */

import Exa from 'exa-js';
import 'dotenv/config';

// Compatibility layer for Vite (import.meta.env) and Node (process.env)
const getEnv = (key: string) => {
    try {
        return import.meta.env?.[key] || process.env[key];
    } catch {
        return process.env[key];
    }
};

const EXA_API_KEY = getEnv('VITE_EXA_API_KEY');
const WOLFRAM_APP_ID = getEnv('VITE_WOLFRAM_APP_ID');

// Initialize Exa if key is available
const exa = EXA_API_KEY ? new Exa(EXA_API_KEY) : null;

export interface DictionaryDefinition {
    word: string;
    phonetic?: string;
    meanings: {
        partOfSpeech: string;
        definitions: {
            definition: string;
            example?: string;
        }[];
    }[];
}

export interface WikiSummary {
    title: string;
    extract: string;
    thumbnail?: {
        source: string;
    };
    content_urls?: {
        desktop: {
            page: string;
        };
    };
}

export const ExternalApiService = {
    /**
     * Fetches definition for a word using Free Dictionary API.
     * Useful for educational glossaries.
     */
    getDefinition: async (word: string): Promise<DictionaryDefinition | null> => {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data[0];
        } catch (error) {
            console.error('ExternalApiService: Dictionary fetch failed', error);
            return null;
        }
    },

    /**
     * Fetches Wikipedia summary for a topic.
     * Perfect for adding context to study notes.
     */
    getWikiSummary: async (query: string): Promise<WikiSummary | null> => {
        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('ExternalApiService: Wikipedia fetch failed', error);
            return null;
        }
    },

    /**
     * Converts a URL to clean Markdown using Jina Reader.
     * Crucial for the blog generator to "read" source pages.
     */
    getMarkdownFromUrl: async (url: string): Promise<string | null> => {
        try {
            const response = await fetch(`https://r.jina.ai/${url}`, {
                headers: {
                    'Accept': 'text/event-stream',
                    // Optional: 'Authorization': `Bearer ${import.meta.env.VITE_JINA_API_KEY}`
                }
            });
            if (!response.ok) return null;
            return await response.text();
        } catch (error) {
            console.error('ExternalApiService: Jina Reader failed', error);
            return null;
        }
    },

    /**
     * Fetches an inspirational or educational quote.
     * Best for Daily Challenges.
     */
    getDailyQuote: async (): Promise<{ content: string; author: string } | null> => {
        try {
            const response = await fetch('https://api.quotable.io/random?tags=education,wisdom,inspirational');
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('ExternalApiService: Quotable failed', error);
            return null;
        }
    },

    /**
     * Performs a neural search using Exa AI.
     * Returns high-quality links and content excerpts.
     */
    searchWeb: async (query: string, numResults: number = 5, fallbackTopic?: string) => {
        if (!exa) {
            console.warn('ExternalApiService: Exa API Key NOT configured. Falling back to Wikipedia...');
            // Simple Wikipedia Search Fallback
            try {
                const wikiTopic = fallbackTopic || query;
                const wiki = await ExternalApiService.getWikiSummary(wikiTopic);
                if (wiki) {
                    return [{
                        title: wiki.title,
                        url: wiki.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(wiki.title)}`,
                        highlights: [wiki.extract]
                    }];
                }
            } catch (err) {
                console.error('ExternalApiService: Wiki fallback failed', err);
            }
            return null;
        }

        try {
            const results = await exa.searchAndContents(query, {
                type: 'auto',
                numResults,
                highlights: {
                    maxCharacters: 1000
                }
            });
            return results.results;
        } catch (error) {
            console.error('ExternalApiService: Exa Search failed', error);
            return null;
        }
    },

    /**
     * Gets a quick answer with citations (Exa /answer endpoint style fallback).
     */
    getAnswer: async (query: string) => {
        if (!EXA_API_KEY) return null;
        try {
            const response = await fetch('https://api.exa.ai/answer', {
                method: 'POST',
                headers: {
                    'x-api-key': EXA_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, stream: false })
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('ExternalApiService: Exa Answer failed', error);
            return null;
        }
    },

    /**
     * Fetches computational intelligence results from Wolfram Alpha.
     * Essential for high-precision math, science, and step-by-step solutions.
     */
    getWolframResults: async (input: string) => {
        if (!WOLFRAM_APP_ID) {
            console.warn('ExternalApiService: Wolfram AppID NOT configured.');
            return null;
        }

        try {
            const encodedInput = encodeURIComponent(input);
            const response = await fetch(`https://api.wolframalpha.com/v2/query?input=${encodedInput}&appid=${WOLFRAM_APP_ID}&output=json&format=plaintext`);
            
            if (!response.ok) return null;
            const data = await response.json();
            
            // Wolfram returns a "queryresult" object
            return data.queryresult;
        } catch (error) {
            console.error('ExternalApiService: Wolfram fetch failed', error);
            return null;
        }
    },

    /**
     * NASA Image Search API: Fetches high-quality scientific imagery/diagrams.
     * Useful for Space, Physics, and Earth Science visuals.
     */
    searchNasaImages: async (query: string, limit: number = 3) => {
        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://images-api.nasa.gov/search?q=${encodedQuery}&media_type=image`;
            
            const response = await fetch(url);
            if (!response.ok) return [];
            
            const data = await response.json();
            const items = data.collection?.items?.slice(0, limit) || [];
            
            return items.map((item: any) => ({
                title: item.data?.[0]?.title,
                description: item.data?.[0]?.description?.substring(0, 300),
                imageUrl: item.links?.[0]?.href,
                nasaId: item.data?.[0]?.nasa_id
            }));
        } catch (error) {
            console.error('ExternalApiService: NASA search failed', error);
            return [];
        }
    }
};

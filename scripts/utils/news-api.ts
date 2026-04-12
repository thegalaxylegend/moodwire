/**
 * 📰 Neural News Tracker (Feature 2.9)
 * 
 * Fetches real-time exam updates (JEE, NEET, CBSE) using NewsAPI.
 * Helps Jules ground blogs in current events for better "Freshness" ranking.
 * 
 * NewsAPI: https://newsapi.org/
 */

import 'dotenv/config';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export interface NewsHeadline {
    title: string;
    description: string;
    url: string;
    publishedAt: string;
    source: string;
}

/**
 * Fetches recent news for a topic, filtered by educational authority.
 */
export async function fetchExamNews(topic: string, limit: number = 3): Promise<NewsHeadline[]> {
    if (!NEWS_API_KEY) {
        console.warn("⚠️ NEWS_API_KEY missing. Skipping news fetch.");
        return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s Timeout

    try {
        // Broaden the search for educational contexts
        // We filter by "Education" in India specifically to get JEE/NEET/CBSE relevant info
        const query = encodeURIComponent(`${topic} exam news India`);
        const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&language=en&pageSize=${limit}&apiKey=${NEWS_API_KEY}`;

        const response = await fetch(url, { signal: controller.signal });
        
        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const data: any = await response.json();
        const articles = data.articles || [];

        return articles.map((a: any) => ({
            title: a.title,
            description: a.description,
            url: a.url,
            publishedAt: a.publishedAt,
            source: a.source?.name || 'News'
        }));
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            console.error(`🕒 NewsAPI timed out after 10s for: ${topic}`);
        } else {
            console.error(`❌ NewsAPI error: ${err.message}`);
        }
        return [];
    }
}

/**
 * Builds a "Live Exam Pulse" block for the blog.
 */
export function buildNewsBlock(headlines: NewsHeadline[]): string {
    if (headlines.length === 0) return '';

    const list = headlines.map(h => {
        const date = new Date(h.publishedAt).toLocaleDateString();
        return `- [${h.title}](${h.url}) — *${h.source}* (${date})`;
    }).join('\n');

    return `\n\n## 📡 Live Exam Pulse: Latest Updates\n\n> ⚠️ **Context:** To ensure you have the most current info, here are the latest relevant updates fetched from trusted news sources:\n\n${list}\n\n*Last updated: ${new Date().toLocaleDateString()}*`;
}

// CLI test
if (process.argv[1].endsWith('news-api.ts')) {
    const topic = process.argv[2] || 'JEE Main 2026';
    fetchExamNews(topic).then(data => {
        console.log(`📰 News for "${topic}":`);
        console.log(JSON.stringify(data, null, 2));
    });
}

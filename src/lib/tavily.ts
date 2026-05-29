const apiKey = (typeof process !== 'undefined' && process.env.VITE_TAVILY_API_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TAVILY_API_KEY);

export async function searchWeb(query: string) {
    if (!apiKey) {
        console.warn("Tavily API Key not found, skipping web search.");
        return null;
    }

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "advanced",
                max_results: 5,
                include_answer: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Tavily API error: ${response.statusText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Tavily search failed:", error);
        return null;
    }
}

export function formatSearchResults(results: any): string {
    if (!results || !results.results || results.results.length === 0) return "";
    
    let formatted = "🌐 WEB SEARCH RESULTS:\n\n";
    results.results.slice(0, 3).forEach((r: any, i: number) => {
        formatted += `${i + 1}. **${r.title}**\n${r.content.substring(0, 300)}...\nSource: [${r.url}](${r.url})\n\n`;
    });
    return formatted;
}

export function needsWebSearch(_message: string): boolean {
    return false; // WEB SEARCH DISABLED TO REDUCE API LOAD
}

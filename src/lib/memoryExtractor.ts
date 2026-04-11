import { modelRouter } from './modelRouter';
import { extractJSON } from './utils';

export async function extractAndSaveMemory(message: string): Promise<string[]> {
    const extractionPrompt = `
        You are a memory extraction assistant. From the user's message, extract any personal facts, names, birthdates, specific goals, or strong emotional states (like burnout or excitement).
        Return purely a JSON array of strings. If no facts are found, return an empty array [].
        
        User's Message: "${message}"
        
        Example outputs: 
        ["Student mentioned having a birthday on March 15", "Student is feeling burnt out from organic chemistry"]
        []
    `;

    try {
        const response = await modelRouter.route([{ role: "user", content: extractionPrompt }], 'T5', {
            temperature: 0,
            max_tokens: 500,
            stream: false
        });

        const content = (typeof response === 'string' ? response : response?.choices?.[0]?.message?.content) || "[]";
        let facts: string[] = [];
        try {
            const data = extractJSON(content);
            if (Array.isArray(data)) {
                facts = data;
            }
        } catch {
            console.warn("Memory extraction: could not parse JSON, skipping.");
            return [];
        }

        if (facts.length > 0) {
            // Save to localStorage for persistence (Browser Only)
            if (typeof localStorage === 'undefined') return facts; 

            const existing = JSON.parse(localStorage.getItem('exa_memory') || "[]");
            const updated = Array.from(new Set([...existing, ...facts])).slice(-20);
            localStorage.setItem('exa_memory', JSON.stringify(updated));
            return updated;
        }
    } catch (error) {
        console.error("Memory extraction failed:", error);
    }
    return [];
}

export function getImportantMemories(): string {
    if (typeof localStorage === 'undefined') return "";
    const memories = JSON.parse(localStorage.getItem('exa_memory') || "[]");
    return memories.join("\n");
}

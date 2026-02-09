
/**
 * ImageGenerationService
 * 
 * Handles the generation of educational diagrams and illustrations for exam questions.
 * Uses a prompt-based URL approach (Pollinations.ai) for real-time generation without complex backend.
 */

export const ImageGenerationService = {
    /**
     * Generates a URL for an educational diagram based on the question context.
     * @param topic - The subject/topic (e.g., "Physics Circuit")
     * @param description - Detailed visual description (e.g., "A series circuit with 2 resistors")
     * @returns string - Image URL
     */
    generateDiagramUrl: (topic: string, description: string): string => {
        // Construct a high-quality educational prompt
        const basePrompt = `educational diagram of ${topic}, ${description}, clean detailed textbook style, white background, high contrast, scientific illustration, minimal text`;

        // Encode for URL
        const encodedPrompt = encodeURIComponent(basePrompt);

        // Use Pollinations.ai for instant generation (or replace with stable-diffusion API if configured)
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`;
    },

    /**
     * Helper to determine if a question NEEDS a diagram.
     * This is a heuristic until the AI explicitly flags it.
     */
    needsDiagram: (questionText: string, subject: string): boolean => {
        const text = questionText.toLowerCase();
        const visualKeywords = [
            'diagram', 'figure', 'shown below', 'circuit', 'graph', 'plot',
            'triangle', 'geometry', 'structure', 'mechanism', 'pathway'
        ];

        // Most Physics/Bio questions with these keywords need visuals
        if (['physics', 'biology', 'chemistry'].includes(subject.toLowerCase())) {
            return visualKeywords.some(k => text.includes(k));
        }
        return false;
    }
};

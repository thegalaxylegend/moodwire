/**
 * 👁️ Jules OCR Intelligence (Feature 2.3)
 * 
 * Uses Tesseract.js to extract text from research screenshots or diagrams.
 * This allows Jules to 'read' complex scientific diagrams or handwritten notes.
 */

import { createWorker } from 'tesseract.js';
import path from 'path';

export async function extractTextFromImage(imagePath: string): Promise<string | null> {
    try {
        console.log(`👁️ Jules is reading image: ${path.basename(imagePath)}...`);
        const worker = await createWorker('eng');
        const ret = await worker.recognize(imagePath);
        await worker.terminate();
        
        const text = ret.data.text.trim();
        if (!text) {
            console.warn(`⚠️ No text detected in ${imagePath}.`);
            return null;
        }
        
        console.log(`✅ Extracted ${text.length} characters.`);
        return text;
    } catch (err: any) {
        console.error(`❌ OCR Error: ${err.message}`);
        return null;
    }
}

// CLI usage
if (process.argv[1].endsWith('ocr-tool.ts') || process.argv[1].endsWith('ocr-tool.js')) {
    const img = process.argv[2];
    if (img) {
        extractTextFromImage(img).then(t => console.log('\n--- EXTRACTED TEXT ---\n', t));
    } else {
        console.log('Usage: npx tsx scripts/utils/ocr-tool.ts <image_path>');
    }
}

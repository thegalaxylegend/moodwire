import fs from 'fs';
import path from 'path';

/**
 * 🛡️ Registry Atomizer (Shadow Mirror System)
 * Feature 3.2: Safely updates any TypeScript/JSON registry by writing to a temp file, 
 * verifying its basic syntax, and then atomically renaming it to prevent data corruption.
 */
export function writeAtomicRegistry(registryPath: string, newContent: string): boolean {
    const tempPath = `${registryPath}.temp`;
    
    try {
        // 1. Shadow Write
        fs.writeFileSync(tempPath, newContent, 'utf8');
        
        // 2. Syntax Validation Shield
        // For blogs.ts, verify the essential structure exists to prevent dropping data
        if (newContent.includes('export const blogs: Blog[] =')) {
            if (!newContent.includes('export interface Blog')) {
                throw new Error("Validation Failed: Missing Blog interface.");
            }
            // Basic balance check for array
            const openBrackets = (newContent.match(/\[/g) || []).length;
            const closeBrackets = (newContent.match(/\]/g) || []).length;
            if (openBrackets !== closeBrackets) {
                throw new Error("Validation Failed: Unbalanced brackets in registry.");
            }
        }

        // 3. Atomic Overwrite (Rename)
        fs.renameSync(tempPath, registryPath);
        console.log(`🗄️ Registry atomically secured: ${path.basename(registryPath)}`);
        return true;
    } catch (err: any) {
        console.error(`❌ Atomic Registry Write Failed: ${err.message}`);
        // Cleanup temp file to avoid leaving artifacts
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        return false;
    }
}

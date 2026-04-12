import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

function cleanTitle(title: string): string {
    // Remove extra quotes and double suffixes
    let clean = title.replace(/^"|"$/g, '').trim();
    
    // Split by common separators used in mangled titles
    const parts = clean.split(/ — | - | Revision Recap | Comprehensive Notes/);
    const coreTitle = parts[0].trim();
    
    // Check if it's already a good title with a suffix
    if (clean.includes('—')) return clean;

    return `${coreTitle} — Grandmaster Guide`;
}

async function repairTitles() {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        content = content.replace(/^title: (.*)$/m, (match, titleLine) => {
            const repaired = cleanTitle(titleLine);
            console.log(`🔧 Repaired [${file}]: ${repaired}`);
            return `title: "${repaired}"`;
        });

        fs.writeFileSync(filePath, content);
    }
}

repairTitles().catch(console.error);

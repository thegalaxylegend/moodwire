
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

function fixLabels() {
    console.log('🧹 Starting Subject Label Cleanup...');
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    let fixedCount = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;

        // 1. Detect "Physics Revision" in non-physics blogs
        // We check the practice_link or the filename
        if (content.includes('Physics Revision') && 
            !file.includes('physics') && 
            !content.includes('practice_link: "/class-11/physics') &&
            !content.includes('practice_link: "/class-12/physics')) {
            
            // Try to find the real subject
            const practiceMatch = content.match(/practice_link: "\/class-\d+\/([^\/]+)/);
            if (practiceMatch) {
                const rawSubject = practiceMatch[1];
                const realSubject = rawSubject.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                
                // Replace "Physics Revision" with "[Subject] Revision" or "[Subject] Recap"
                const isClass11Or12 = file.includes('class-11') || file.includes('class-12');
                const suffix = isClass11Or12 ? 'Revision' : 'Recap';
                const newLabel = `${realSubject} ${suffix}`;
                
                content = content.replace(/Physics Revision/g, newLabel);
                console.log(`✅ Fixed label in ${file}: Physics -> ${realSubject}`);
                modified = true;
            }
        }

        // 2. Fix JEE & NEET tag for non-science subjects
        if (modified && (content.includes('History') || content.includes('Geography') || content.includes('Civics') || content.includes('Economics'))) {
            if (content.includes('JEE & NEET')) {
                content = content.replace(/JEE & NEET/g, 'CBSE Boards');
                console.log(`🏷️ Updated exam tag to CBSE Boards for ${file}`);
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf-8');
            fixedCount++;
        }
    }

    console.log(`\n✨ Cleanup complete. Fixed ${fixedCount} blogs.`);
}

fixLabels();

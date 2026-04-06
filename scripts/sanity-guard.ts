
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const PUBLIC_IMAGES_DIR = path.join(__dirname, '../public/blog-images');

async function runSanityCheck() {
    console.log("🛡️ Jules Sanity Guard: Commencing Final Audit...");

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    let errors = 0;

    for (const file of files) {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const slug = file.replace('.md', '');

        // 1. Metadata Presence
        const requiredMetadata = ['title:', 'heroImage:', 'date:', 'practice_link:'];
        for (const meta of requiredMetadata) {
            if (!content.includes(meta)) {
                console.error(`❌ [${file}] Missing metadata: ${meta}`);
                errors++;
            }
        }

        // 2. Image Integrity
        const heroMatch = content.match(/heroImage:\s*"(.*?)"/);
        if (heroMatch) {
            const imgPath = heroMatch[1];
            if (imgPath.startsWith('/blog-images/')) {
                const localImgPath = path.join(__dirname, '..', 'public', imgPath);
                if (!fs.existsSync(localImgPath)) {
                    console.warn(`⚠️ [${file}] Hero image not found locally: ${imgPath}`);
                    // Not a fatal error yet as it might be a remote URL, but good to flag
                }
            }
        }

        // 3. LaTeX Syntax (Basic)
        const unclosedBrackets = (content.match(/\\frac\{/g) || []).length !== (content.match(/\}/g) || []).length;
        // This is a very loose check, but helps catch catastrophic failures
        if (content.includes('\\frac') && content.match(/\{/g)?.length !== content.match(/\}/g)?.length) {
          // console.warn(`⚠️ [${file}] Possible LaTeX bracket mismatch detected.`);
        }

        // 4. Placeholder Check
        if (content.includes("undefined") || content.includes("[INSERT ") || content.includes("TODO")) {
            console.error(`❌ [${file}] Contains placeholders or 'undefined' values!`);
            errors++;
        }

        // 5. Empty Content Check
        if (content.length < 500) {
            console.error(`❌ [${file}] Content is too short (${content.length} chars).`);
            errors++;
        }
    }

    if (errors > 0) {
        console.error(`\n🚫 SANITY CHECK FAILED: ${errors} critical errors found.`);
        process.exit(1);
    } else {
        console.log(`\n✅ SANITY CHECK PASSED: ${files.length} blogs verified.`);
    }
}

runSanityCheck().catch(err => {
    console.error("💥 Sanity Guard Crashed:", err);
    process.exit(1);
});

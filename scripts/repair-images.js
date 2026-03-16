import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');
const BLOGS_TS = path.join(__dirname, '../src/data/blogs.ts');

async function downloadHeroImage(topic, outputFilename, subject) {
    const outputPath = path.join(IMAGE_DIR, outputFilename);
    if (fs.existsSync(outputPath)) return true;

    console.log(`🎨 Generating artwork for "${topic}" → ${outputFilename}...`);
    const artPrompt = `Scientific diagram of ${topic}, ${subject} theme, dark background, cyan and purple neon accents, holographic interface style, 16:9 aspect ratio, cinematic lighting, 8k, no text.`;
    
    const models = ['flux', 'turbo'];
    
    for (const model of models) {
        try {
            const encodedPrompt = encodeURIComponent(artPrompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&model=${model}&seed=${Math.floor(Math.random() * 10000)}&nologo=true`;

            const response = await fetch(imageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 ExamCompass/1.0' }
            });

            if (response.status === 429) {
                console.warn(`🛑 Rate limited on ${model}. Cooling down 30s...`);
                await new Promise(r => setTimeout(r, 30000));
                continue;
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const buffer = Buffer.from(await response.arrayBuffer());
            
            // Validate we got an actual image (not HTML error page)
            if (buffer.length < 5000) {
                throw new Error(`Response too small (${buffer.length} bytes) - likely not an image`);
            }

            fs.writeFileSync(outputPath, buffer);
            console.log(`✅ Image saved: ${outputFilename} (${(buffer.length / 1024).toFixed(0)}KB)`);
            
            // Cooldown between requests
            console.log("⏳ Cooling down (12s)...");
            await new Promise(r => setTimeout(r, 12000));
            return true;
        } catch (err) {
            console.warn(`⚠️ ${model} failed: ${err.message}`);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    console.error(`❌ Failed to generate: ${outputFilename}`);
    return false;
}

function parseBlogsTs() {
    const content = fs.readFileSync(BLOGS_TS, 'utf8');
    const entries = [];
    const regex = /"id":\s*"([^"]+)"[\s\S]*?"title":\s*"([^"]+)"[\s\S]*?"category":\s*"([^"]+)"[\s\S]*?"image":\s*"\/blog-images\/([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        entries.push({ id: match[1], title: match[2], category: match[3], imageFile: match[4] });
    }
    return entries;
}

async function repair() {
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
    
    let missing = 0, fixed = 0, failed = 0;
    
    // Check blogs.ts entries
    console.log('\n📋 Checking blogs.ts entries...');
    const blogEntries = parseBlogsTs();
    console.log(`   Found ${blogEntries.length} blog entries\n`);
    
    for (const entry of blogEntries) {
        const imagePath = path.join(IMAGE_DIR, entry.imageFile);
        if (!fs.existsSync(imagePath)) {
            missing++;
            // For .webp references, generate as .png and we'll update blogs.ts
            const outputName = entry.imageFile.replace('.webp', '.png');
            const outputPath = path.join(IMAGE_DIR, outputName);
            
            if (!fs.existsSync(outputPath)) {
                const ok = await downloadHeroImage(entry.title, outputName, entry.category);
                if (ok) fixed++;
                else failed++;
            } else {
                console.log(`   ⏭️  PNG exists for: ${entry.imageFile} → using ${outputName}`);
                fixed++;
            }
        }
    }
    
    // Check markdown files
    console.log('\n📋 Checking markdown blog files...');
    const mdFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    for (const file of mdFiles) {
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
        const titleMatch = content.match(/title:\s*["'](.*?)["']/);
        const topic = titleMatch ? titleMatch[1] : file.replace('.md', '');
        const catMatch = content.match(/category:\s*["'](.*?)["']/);
        const subject = catMatch ? catMatch[1] : 'Science';
        
        const imageMatches = content.matchAll(/\!\[.*?\]\(\/blog-images\/(.*?)\)/g);
        for (const imgMatch of imageMatches) {
            const imageName = imgMatch[1];
            if (!fs.existsSync(path.join(IMAGE_DIR, imageName))) {
                missing++;
                const outputName = imageName.replace('.webp', '.png');
                if (!fs.existsSync(path.join(IMAGE_DIR, outputName))) {
                    const ok = await downloadHeroImage(topic, outputName, subject);
                    if (ok) fixed++;
                    else failed++;
                }
            }
        }
    }
    
    console.log(`\n📊 Summary: ${missing} missing, ${fixed} generated, ${failed} failed.`);
    
    // Auto-fix blogs.ts references: .webp → .png for newly generated images
    if (fixed > 0) {
        console.log('\n🔧 Updating blogs.ts references (.webp → .png for generated images)...');
        let blogsContent = fs.readFileSync(BLOGS_TS, 'utf8');
        let updates = 0;
        for (const entry of blogEntries) {
            if (entry.imageFile.endsWith('.webp')) {
                const pngName = entry.imageFile.replace('.webp', '.png');
                if (fs.existsSync(path.join(IMAGE_DIR, pngName)) && !fs.existsSync(path.join(IMAGE_DIR, entry.imageFile))) {
                    blogsContent = blogsContent.replace(entry.imageFile, pngName);
                    updates++;
                }
            }
        }
        if (updates > 0) {
            fs.writeFileSync(BLOGS_TS, blogsContent);
            console.log(`   ✅ Updated ${updates} image references in blogs.ts`);
        }
    }
}

repair().catch(console.error);

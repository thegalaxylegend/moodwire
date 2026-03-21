import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');
const BLOGS_TS = path.join(__dirname, '../src/data/blogs.ts');

const SUBJECT_FALLBACKS = {
    'History':     'history-manuscript.webp',
    'Geography':   'geography-terrain.webp', 
    'Biology':     'biology-cell.webp',
    'Chemistry':   'chemistry-molecule.webp',
    'Physics':     'physics-waves.webp',
    'Mathematics': 'maths-equations.webp',
    'default':     'generic-study.webp'
};

// SVG image generation removed down to avoid XML parsing crashes
// Gemini image generation skipped as it produces poor results and 429 errors 

async function generateCloudflareImage(topic, outputPath, subject) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
        console.warn("⚠️ Cloudflare credentials missing.");
        return false;
    }

    try {
        console.log(`☁️ Jules: Designing custom artwork via Cloudflare Flux...`);
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: `Scientific diagram of ${topic}, ${subject} theme, dark background, cyan neon accents, holographic interface style, 16:9 aspect ratio, high-tech visualization, no text overlays` 
                })
            }
        );

        if (!response.ok) throw new Error(`Cloudflare API error: ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());
        const sharp = (await import('sharp')).default;
        await sharp(buffer).resize(1200, 630, { fit: 'cover' }).webp({ quality: 85 }).toFile(outputPath);
        return true;
    } catch (err) {
        console.warn(`⚠️ Cloudflare failed: ${err.message}`);
        return false;
    }
}

async function generateGeminiImage(topic, outputPath, subject) {
    const key = process.env.GEMINI_BACKUP_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) return false;

    try {
        console.log(`🚀 Primary APIs down. Asking Gemini to design SVG...`);
        const prompt = `Generate a beautiful, complex, and modern SVG for a blog cover image. Topic: ${topic}, Subject: ${subject}. Format: raw SVG code ONLY. 1200x630. Dark theme.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        let svg = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        svg = svg.replace(/```svg/g, "").replace(/```/g, "").trim();

        if (!svg.includes("<svg")) throw new Error("Invalid SVG");
        
        // Escape &
        const safeSvg = svg.replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;');

        const sharp = (await import('sharp')).default;
        await sharp(Buffer.from(safeSvg)).resize(1200, 630).webp({ quality: 90 }).toFile(outputPath);
        return true;
    } catch (err) {
        console.warn(`⚠️ Gemini SVG failed: ${err.message}`);
        return false;
    }
}


async function generateHuggingFaceImage(topic, outputPath, subject) {
    const hfToken = process.env.HF_API_TOKEN;
    if (!hfToken) return false;

    try {
        console.log(`🤗 Trying Hugging Face for "${topic}"...`);
        const prompt = `Scientific diagram of ${topic}, ${subject} theme, dark background with cyan and purple neon accents, holographic interface style, high-tech visualization, 16:9 aspect ratio, cinematic lighting, no text overlays, digital art`;
        
        const response = await fetch('https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'ExamCompass/1.0'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { width: 1200, height: 630, num_inference_steps: 4, guidance_scale: 0.0 }
            })
        });

        if (!response.ok) throw new Error(`HF API error: ${response.status}`);

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 5000) throw new Error("Response too small");

        const sharp = (await import('sharp')).default;
        await sharp(buffer).resize(1200, 630, { fit: 'cover' }).webp({ quality: 85 }).toFile(outputPath);
        
        console.log(`✅ HF image saved: ${path.basename(outputPath)}`);
        return true;
    } catch (err) {
        console.warn(`⚠️ HF failed: ${err.message}`);
        return false;
    }
}



async function downloadHeroImage(topic, outputFilename, subject) {
    const outputPath = path.join(IMAGE_DIR, outputFilename.replace('.png', '.webp'));
    if (fs.existsSync(outputPath)) return true;

    console.log(`🎨 Generating artwork for "${topic}"...`);
    
    // Priority 1: Cloudflare Workers AI (Jules Flux)
    if (await generateCloudflareImage(topic, outputPath, subject)) return true;

    // Priority 2: Gemini SVG
    if (await generateGeminiImage(topic, outputPath, subject)) return true;

    // Priority 3: Hugging Face 
    if (await generateHuggingFaceImage(topic, outputPath, subject)) return true;

    // Attempt 2: Hugging Face
    if (await generateHuggingFaceImage(topic, outputPath, subject)) return true;

    // Ultimate Fallback: Copy High-Quality Static Image
    console.log("🎨 APIs unavailable. Falling back to subject-specific static image...");
    try {
        const fallbackFilename = SUBJECT_FALLBACKS[subject] || SUBJECT_FALLBACKS['default'];
        const fallbackPath = path.join(IMAGE_DIR, 'fallbacks', fallbackFilename);
        if (fs.existsSync(fallbackPath)) {
            fs.copyFileSync(fallbackPath, outputPath);
            console.log(`✅ Fallback image copied successfully.`);
            return true;
        } else {
            console.warn(`⚠️ Fallback file missing: ${fallbackPath}`);
            return false;
        }
    } catch (e) {
        console.error(`❌ Fallback copy failed: ${e.message}`);
        return false;
    }
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
    
    const blogEntries = parseBlogsTs();
    for (const entry of blogEntries) {
        const imageName = entry.imageFile.replace('.png', '.webp');
        const imagePath = path.join(IMAGE_DIR, imageName);
        if (!fs.existsSync(imagePath)) {
            await downloadHeroImage(entry.title, imageName, entry.category);
        }
    }
    
    // Update blogs.ts and markdown files to use .webp
    let blogsContent = fs.readFileSync(BLOGS_TS, 'utf8');
    blogsContent = blogsContent.replace(/\.png"/g, '.webp"');
    fs.writeFileSync(BLOGS_TS, blogsContent);

    const mdFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    for (const file of mdFiles) {
        let content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
        content = content.replace(/\.png\)/g, '.webp)');
        fs.writeFileSync(path.join(BLOG_DIR, file), content);
    }
    
    console.log("🚀 Repair complete. All images are now in .webp format.");
}

repair().catch(console.error);

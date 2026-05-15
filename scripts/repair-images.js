import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');

const SUBJECT_FALLBACKS = {
    'History':     'history-manuscript.webp',
    'Geography':   'geography-terrain.webp', 
    'Biology':     'biology-cell.webp',
    'Chemistry':   'chemistry-molecule.webp',
    'Physics':     'physics-waves.webp',
    'Mathematics': 'maths-equations.webp',
    'default':     'generic-study.webp'
};

const GEMINI_KEY = process.env.GEMINI_BACKUP_KEY || process.env.VITE_GEMINI_API_KEY;
const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY,
    process.env.VITE_GROQ_API_KEY_2,
    process.env.VITE_GROQ_API_KEY_3,
    process.env.VITE_GROQ_API_KEY_4,
    process.env.VITE_GROQ_API_KEY_5,
    process.env.VITE_GROQ_API_KEY_6
].filter(Boolean);

let _cloudflareAccountIndex = 0;

function getNextCloudflareAccount() {
    try {
        const accounts = [];
        for (let i = 1; i <= 10; i++) {
            const accId = process.env[`CLOUDFLARE_ACCOUNT_ID_${i}`]?.replace(/['"]/g, '');
            const token = process.env[`CLOUDFLARE_API_TOKEN_${i}`]?.replace(/['"]/g, '');
            if (accId && token) {
                accounts.push({ accountId: accId, apiToken: token });
            }
        }
        
        if (accounts.length === 0) {
            const fallbackAccId = process.env.CLOUDFLARE_ACCOUNT_ID?.replace(/['"]/g, '') || '73fdf68d86f206ccbbf0ded01b668bd2';
            const fallbackToken = process.env.CLOUDFLARE_API_TOKEN?.replace(/['"]/g, '');
            if (fallbackAccId && fallbackToken) {
                accounts.push({ accountId: fallbackAccId, apiToken: fallbackToken });
            }
        }
        
        if (accounts.length === 0) return null;
        
        const account = accounts[_cloudflareAccountIndex % accounts.length];
        _cloudflareAccountIndex = (_cloudflareAccountIndex + 1) % accounts.length;
        return account;
    } catch (err) {
        console.warn("⚠️ Fallback to default due to rotation error:", err);
        return null;
    }
}

async function generateCloudflareImage(topic, subject) {
    const account = getNextCloudflareAccount();
    if (!account) return null;
    
    const { accountId, apiToken } = account;
    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: `Professional educational thumbnail for ${topic} (${subject}), high resolution, 16:9, minimalist, professional, high quality design.` 
                })
            }
        );
        if (!response.ok) return null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const json = await response.json();
            const b64 = json.result?.image;
            return b64 ? Buffer.from(b64, 'base64') : null;
        }
        return Buffer.from(await response.arrayBuffer());
    } catch { return null; }
}

async function generateGroqSVG(topic, subject) {
    if (GROQ_KEYS.length === 0) return null;
    try {
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({ apiKey: GROQ_KEYS[0] });
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert SVG artist. Output ONLY valid, raw SVG code. 1200x630, dark theme, neon accents." },
                { role: "user", content: `Create a stunning SVG for "${topic}" (${subject}).` }
            ],
            model: "llama-3.3-70b-versatile",
        });
        const svg = completion.choices[0]?.message?.content || "";
        let cleanSvg = svg.replace(/```(?:svg|xml|html)?\s*/gi, "").replace(/```/gi, "").trim();
        if (cleanSvg.includes("<svg")) cleanSvg = cleanSvg.substring(cleanSvg.indexOf("<svg"));
        const closingIdx = cleanSvg.lastIndexOf("</svg>");
        if (closingIdx > 0) cleanSvg = cleanSvg.substring(0, closingIdx + 6);
        return cleanSvg.startsWith("<svg") ? Buffer.from(cleanSvg) : null;
    } catch { return null; }
}

async function generateGemmaSVG(topic, subject) {
    if (!GEMINI_KEY) return null;
    try {
        const prompt = `Output ONLY raw SVG code for a 1200x630 blog cover about "${topic}" (${subject}). Dark mode, professional.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const svg = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        let cleanSvg = svg.replace(/```(?:svg|xml|html)?\s*/gi, "").replace(/```/gi, "").trim();
        if (cleanSvg.includes("<svg")) cleanSvg = cleanSvg.substring(cleanSvg.indexOf("<svg"));
        const closingIdx = cleanSvg.lastIndexOf("</svg>");
        if (closingIdx > 0) cleanSvg = cleanSvg.substring(0, closingIdx + 6);
        return cleanSvg.startsWith("<svg") ? Buffer.from(cleanSvg) : null;
    } catch { return null; }
}

async function saveAndOptimise(buffer, nameSlug, isSvg = false) {
    try {
        const fileName = `${nameSlug}.webp`;
        const outputPath = path.join(IMAGE_DIR, fileName);
        const sharp = (await import('sharp')).default;
        
        let sharpInstance = sharp(buffer);
        if (isSvg) {
            sharpInstance = sharpInstance.resize(1200, 630);
        }
        await sharpInstance.webp({ quality: 85 }).toFile(outputPath);
        return fileName;
    } catch (e) {
        console.error(`❌ Save failed: ${e.message}`);
        return null;
    }
}

async function repairImages() {
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    
    const GENERIC_IMAGES = ['generic-study.webp', 'geography-terrain.webp', 'biology-cell.webp', 
                            'chemistry-molecule.webp', 'physics-waves.webp', 'maths-equations.webp',
                            'history-manuscript.webp'];
    let repairedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const fullPath = path.join(BLOG_DIR, file);
        let content = fs.readFileSync(fullPath, 'utf8');
        const heroMatch = content.match(/heroImage:\s*['"]?([^'"\n]+)['"]?/);
        const subjectMatch = content.match(/(?:subject|category):\s*['"]?([^'"\n]+)['"]?/);
        const titleMatch = content.match(/title:\s*['"]?([^'"\n]+)['"]?/);
        
        const heroImage = heroMatch ? heroMatch[1].trim() : '';
        const subject = subjectMatch ? subjectMatch[1].trim() : 'default';
        const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
        const fileSlug = file.replace('.md', '');

        // Check if image exists on disk
        const imagePath = heroImage ? path.join(__dirname, '../public', heroImage) : '';
        const imageExists = imagePath && fs.existsSync(imagePath) && fs.statSync(imagePath).size >= 1000;
        const isGeneric = GENERIC_IMAGES.some(g => heroImage.includes(g));

        // SKIP: Blog already has a valid, non-generic, unique image — DO NOT touch it
        if (imageExists && !isGeneric) {
            skippedCount++;
            continue;
        }

        // NEEDS REPAIR: Missing heroImage, file not found on disk, or currently uses a generic fallback
        console.log(`🛠️ Repairing image for: ${title}`);
        
        let newImage = null;
        
        // 1. Cloudflare
        const cfBuffer = await generateCloudflareImage(title, subject);
        if (cfBuffer) newImage = await saveAndOptimise(cfBuffer, fileSlug);
        
        // 2. Groq SVG
        if (!newImage) {
            const groqBuffer = await generateGroqSVG(title, subject);
            if (groqBuffer) newImage = await saveAndOptimise(groqBuffer, fileSlug, true);
        }
        
        // 3. Gemma 4 SVG
        if (!newImage) {
            const gemmaBuffer = await generateGemmaSVG(title, subject);
            if (gemmaBuffer) newImage = await saveAndOptimise(gemmaBuffer, fileSlug, true);
        }
        
        // 4. Fallback — ONLY use generic if blog currently has NO image at all
        if (!newImage) {
            if (!imageExists) {
                // Blog truly has no image — use generic as a last resort
                newImage = `/blog-images/${SUBJECT_FALLBACKS[subject] || SUBJECT_FALLBACKS['default']}`;
            } else {
                // Blog has a generic image but all APIs failed — keep existing, don't re-overwrite
                console.log(`⏭️ All APIs unavailable, keeping existing image for: ${title}`);
                skippedCount++;
                continue;
            }
        } else {
            newImage = `/blog-images/${newImage}`;
        }

        if (newImage) {
            if (content.includes('heroImage:')) {
                content = content.replace(/heroImage:.*(\n|$)/, `heroImage: "${newImage}"$1`);
            } else {
                // Inject at the top of frontmatter
                content = content.replace(/---/, `---\nheroImage: "${newImage}"`);
            }
            fs.writeFileSync(fullPath, content);
            repairedCount++;
            console.log(`✅ Image repaired: ${newImage}`);
        }
    }
    
    console.log(`\n📊 Image Repair Summary: ${repairedCount} repaired, ${skippedCount} already valid.`);
}

repairImages().catch(console.error);

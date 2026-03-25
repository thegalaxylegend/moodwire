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

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '73fdf68d86f206ccbbf0ded01b668bd2';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const GEMINI_KEY = process.env.GEMINI_BACKUP_KEY || process.env.VITE_GEMINI_API_KEY;
const GROQ_KEYS = [
    process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY,
    process.env.VITE_GROQ_API_KEY_2,
    process.env.VITE_GROQ_API_KEY_3,
    process.env.VITE_GROQ_API_KEY_4,
    process.env.VITE_GROQ_API_KEY_5,
    process.env.VITE_GROQ_API_KEY_6
].filter(Boolean);

async function generateCloudflareImage(topic, subject) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) return null;
    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
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

async function generateGeminiSVG(topic, subject) {
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

async function saveAndOptimise(buffer, topic, isSvg = false) {
    try {
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const fileName = `${slug}-${Date.now()}.webp`;
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
    
    for (const file of files) {
        const fullPath = path.join(BLOG_DIR, file);
        let content = fs.readFileSync(fullPath, 'utf8');
        const heroMatch = content.match(/heroImage:\s*['"]?([^'"\n]+)['"]?/);
        const subjectMatch = content.match(/subject:\s*['"]?([^'"\n]+)['"]?/);
        const titleMatch = content.match(/title:\s*['"]?([^'"\n]+)['"]?/);
        
        const heroImage = heroMatch ? heroMatch[1] : '';
        const subject = subjectMatch ? subjectMatch[1] : 'default';
        const title = titleMatch ? titleMatch[1] : file.replace('.md', '');

        // Check if image exists
        const imagePath = path.join(__dirname, '../public', heroImage);
        if (!heroImage || !fs.existsSync(imagePath) || fs.statSync(imagePath).size < 1000) {
            console.log(`🛠️ Repairing image for: ${title}`);
            
            let newImage = null;
            
            // 1. Cloudflare
            const cfBuffer = await generateCloudflareImage(title, subject);
            if (cfBuffer) newImage = await saveAndOptimise(cfBuffer, title);
            
            // 2. Groq SVG
            if (!newImage) {
                const groqBuffer = await generateGroqSVG(title, subject);
                if (groqBuffer) newImage = await saveAndOptimise(groqBuffer, title, true);
            }
            
            // 3. Gemini SVG
            if (!newImage) {
                const geminiBuffer = await generateGeminiSVG(title, subject);
                if (geminiBuffer) newImage = await saveAndOptimise(geminiBuffer, title, true);
            }
            
            // 4. Fallback
            if (!newImage) {
                newImage = `/blog-images/${SUBJECT_FALLBACKS[subject] || SUBJECT_FALLBACKS['default']}`;
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
                console.log(`✅ Image repaired: ${newImage}`);
            }
        }
    }
}

repairImages().catch(console.error);

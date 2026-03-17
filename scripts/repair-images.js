import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');
const BLOGS_TS = path.join(__dirname, '../src/data/blogs.ts');

const NEON_THEMES = {
    'Physics': { primary: '#00e5ff', secondary: '#7c4dff' },
    'Chemistry': { primary: '#00e676', secondary: '#ff6d00' },
    'Biology': { primary: '#69f0ae', secondary: '#e040fb' },
    'Maths': { primary: '#ffea00', secondary: '#00b0ff' },
    'Mathematics': { primary: '#ffea00', secondary: '#00b0ff' },
    'History': { primary: '#ff9100', secondary: '#d500f9' },
    'default': { primary: '#00e5ff', secondary: '#7c4dff' }
};

function generateNeonSvg(topic, subject) {
    const theme = NEON_THEMES[subject] || NEON_THEMES['default'];
    const seed = topic.length * 7 + subject.length * 13;
    const displayTopic = topic.length > 35 ? topic.substring(0, 32) + '...' : topic;
    const fontSize = topic.length > 25 ? 36 : 44;
    const circles = Array.from({ length: 12 }, (_, i) => {
        const x = ((seed * (i + 1) * 137) % 1100) + 50;
        const y = ((seed * (i + 1) * 89) % 530) + 50;
        const r = ((seed * (i + 1) * 23) % 40) + 10;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${i % 2 === 0 ? theme.primary : theme.secondary}" stroke-width="1.5" opacity="${0.1 + (i % 5) * 0.08}"/>`;
    }).join('');
    const hexagons = Array.from({ length: 6 }, (_, i) => {
        const cx = ((seed * (i + 2) * 113) % 1000) + 100;
        const cy = ((seed * (i + 2) * 67) % 430) + 100;
        const size = ((seed * (i + 2) * 31) % 30) + 20;
        const points = Array.from({ length: 6 }, (_, j) => {
            const angle = (Math.PI / 3) * j - Math.PI / 6;
            return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`;
        }).join(' ');
        return `<polygon points="${points}" fill="none" stroke="${theme.secondary}" stroke-width="1" opacity="${0.08 + (i % 3) * 0.05}"/>`;
    }).join('');
    return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0a0a1a"/><stop offset="50%" style="stop-color:#0d0d2b"/><stop offset="100%" style="stop-color:#1a0a2e"/></linearGradient>
    <radialGradient id="g1" cx="30%" cy="40%" r="50%"><stop offset="0%" style="stop-color:${theme.primary};stop-opacity:0.15"/><stop offset="100%" style="stop-color:${theme.primary};stop-opacity:0"/></radialGradient>
    <radialGradient id="g2" cx="70%" cy="60%" r="45%"><stop offset="0%" style="stop-color:${theme.secondary};stop-opacity:0.12"/><stop offset="100%" style="stop-color:${theme.secondary};stop-opacity:0"/></radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="tg"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#g1)"/><rect width="1200" height="630" fill="url(#g2)"/>
  <g opacity="0.06">${Array.from({ length: 25 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="630" stroke="${theme.primary}" stroke-width="0.5"/>`).join('')}${Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="1200" y2="${i * 50}" stroke="${theme.primary}" stroke-width="0.5"/>`).join('')}</g>
  ${circles}${hexagons}
  <circle cx="600" cy="280" r="120" fill="none" stroke="${theme.primary}" stroke-width="1" opacity="0.2" filter="url(#glow)"/>
  <circle cx="600" cy="280" r="80" fill="none" stroke="${theme.secondary}" stroke-width="1.5" opacity="0.15" filter="url(#glow)"/>
  <circle cx="600" cy="280" r="40" fill="${theme.primary}" opacity="0.08" filter="url(#glow)"/>
  <rect x="40" y="30" width="${subject.length * 14 + 30}" height="36" rx="18" fill="${theme.primary}" opacity="0.2"/>
  <text x="${55 + subject.length * 7}" y="54" font-family="Arial,sans-serif" font-weight="700" font-size="16" fill="${theme.primary}" text-anchor="middle" letter-spacing="2">${subject.toUpperCase()}</text>
  <text x="600" y="480" font-family="Arial,sans-serif" font-weight="800" font-size="${fontSize}" fill="white" text-anchor="middle" filter="url(#tg)">${displayTopic}</text>
  <text x="600" y="520" font-family="Arial,sans-serif" font-weight="400" font-size="18" fill="${theme.primary}" text-anchor="middle" opacity="0.8">Exam Compass — Revision Notes</text>
  <line x1="300" y1="560" x2="900" y2="560" stroke="${theme.primary}" stroke-width="2" opacity="0.4" filter="url(#glow)"/>
  <path d="M 30 80 L 30 30 L 80 30" fill="none" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
  <path d="M 1120 80 L 1120 30 L 1170 30" fill="none" stroke="${theme.secondary}" stroke-width="2" opacity="0.5"/>
  <path d="M 30 550 L 30 600 L 80 600" fill="none" stroke="${theme.secondary}" stroke-width="2" opacity="0.5"/>
  <path d="M 1120 550 L 1120 600 L 1170 600" fill="none" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
</svg>`;
}

async function generateLocalNeonImage(topic, outputPath, subject) {
    try {
        const svgContent = generateNeonSvg(topic, subject);
        const sharp = (await import('sharp')).default;
        await sharp(Buffer.from(svgContent)).resize(1200, 630).webp({ quality: 90 }).toFile(outputPath);
        return true;
    } catch (err) {
        console.error(`⚠️ Local neon image failed: ${err.message}`);
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

async function generateGeminiImage(topic, outputPath, subject) {
    const key = process.env.GEMINI_BACKUP_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) return false;

    try {
        console.log(`🚀 Using Gemini to design custom SVG for "${topic}"...`);
        const theme = NEON_THEMES[subject] || NEON_THEMES['default'];
        const prompt = `Generate a beautiful, complex, and modern SVG for a blog cover image. 
        Topic: ${topic}
        Subject: ${subject}
        Style: Dark mode, neon colors (${theme.primary}, ${theme.secondary}), futuristic, scientific diagrams, no text in the background, high detail.
        Format: Return ONLY the raw SVG code. No markdown, no explanations. 
        Dimensions: 1200x630.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.9 }
            })
        });

        const data = await response.json();
        let svg = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        svg = svg.replace(/```svg/g, "").replace(/```/g, "").trim();

        if (!svg.includes("<svg")) throw new Error("Invalid SVG from Gemini");

        const sharp = (await import('sharp')).default;
        await sharp(Buffer.from(svg)).resize(1200, 630).webp({ quality: 90 }).toFile(outputPath);
        
        console.log(`✅ Gemini SVG image saved: ${path.basename(outputPath)}`);
        return true;
    } catch (err) {
        console.warn(`⚠️ Gemini SVG failed: ${err.message}`);
        return false;
    }
}

async function downloadHeroImage(topic, outputFilename, subject) {
    const outputPath = path.join(IMAGE_DIR, outputFilename.replace('.png', '.webp'));
    if (fs.existsSync(outputPath)) return true;

    console.log(`🎨 Generating artwork for "${topic}"...`);
    
    // Attempt 1: Pollinations
    const models = ['flux', 'turbo'];
    for (const model of models) {
        try {
            const encodedPrompt = encodeURIComponent(`Scientific diagram of ${topic}, ${subject} theme, dark background, cyan and purple neon accents, holographic interface style, 16:9 aspect ratio, no text.`);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&model=${model}&seed=${Math.floor(Math.random() * 100000)}&nologo=true`;

            const response = await fetch(imageUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 ExamCompass/1.0' }
            });

            if (response.ok) {
                const buffer = Buffer.from(await response.arrayBuffer());
                if (buffer.length > 5000) {
                    const sharp = (await import('sharp')).default;
                    await sharp(buffer).resize(1200, 630, { fit: 'cover' }).webp({ quality: 85 }).toFile(outputPath);
                    console.log(`✅ Pollinations image saved: ${path.basename(outputPath)}`);
                    return true;
                }
            }
        } catch (err) {
            console.warn(`⚠️ Pollinations ${model} failed.`);
        }
    }

    // Attempt 2: Hugging Face
    if (await generateHuggingFaceImage(topic, outputPath, subject)) return true;

    // Attempt 3: Gemini SVG (NEW BACKUP)
    if (await generateGeminiImage(topic, outputPath, subject)) return true;

    // Attempt 4: Local Neon
    return await generateLocalNeonImage(topic, outputPath, subject);
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

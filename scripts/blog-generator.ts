import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groq = new Groq({
    apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
});

// --- DATE DISTRIBUTOR ---
const getShiftedDate = () => {
    const blogsDir = path.join(__dirname, '../src/content/blogs');
    if (!fs.existsSync(blogsDir)) return new Date('2026-03-16').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
    const dateCounts: Record<string, number> = {};
    
    files.forEach(f => {
        const content = fs.readFileSync(path.join(blogsDir, f), 'utf8');
        const match = content.match(/\*Last Updated:\s*([A-Za-z]+ \d+, \d{4})/);
        if (match) {
            const d = match[1];
            dateCounts[d] = (dateCounts[d] || 0) + 1;
        }
    });

    // Current date is March 17, 2026. Avoid today.
    let daysBack = 1;
    while (true) {
        const d = new Date('2026-03-17'); 
        d.setDate(d.getDate() - daysBack);
        const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if ((dateCounts[dateStr] || 0) < 6) return dateStr;
        daysBack++;
        if (daysBack > 100) return dateStr;
    }
};

// Gemini Backup Helper
async function generateWithGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const key = process.env.GEMINI_BACKUP_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) return null;

    try {
        console.log("🚀 Using Gemini Backup for content generation...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] 
                }],
                generationConfig: { maxOutputTokens: 8000, temperature: 0.7 }
            })
        });

        const data: any = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (err) {
        console.error("❌ Gemini Backup failed:", err);
        return null;
    }
}

const QUEUE_FILE = path.join(__dirname, '../queue.json');
const BLOG_RULES_FILE = path.join(__dirname, '../BLOG_RULES.md');
const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');

const GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant"
];

const GROQ_PROMPT_MODEL = "llama-3.1-8b-instant"; 

// Subject-specific neon accent colors for the theme
const NEON_THEMES: Record<string, { primary: string; secondary: string; glow: string }> = {
    'Physics': { primary: '#00e5ff', secondary: '#7c4dff', glow: '#00e5ff' },
    'Chemistry': { primary: '#00e676', secondary: '#ff6d00', glow: '#00e676' },
    'Biology': { primary: '#69f0ae', secondary: '#e040fb', glow: '#69f0ae' },
    'Maths': { primary: '#ffea00', secondary: '#00b0ff', glow: '#ffea00' },
    'Mathematics': { primary: '#ffea00', secondary: '#00b0ff', glow: '#ffea00' },
    'History': { primary: '#ff9100', secondary: '#d500f9', glow: '#ff9100' },
    'default': { primary: '#00e5ff', secondary: '#7c4dff', glow: '#00e5ff' }
};

function generateNeonSvg(topic: string, subject: string): string {
    const theme = NEON_THEMES[subject] || NEON_THEMES['default'];
    const seed = topic.length * 7 + subject.length * 13;
    
    // Generate pseudo-random positions for decorative elements
    const circles = Array.from({ length: 12 }, (_, i) => {
        const x = ((seed * (i + 1) * 137) % 1100) + 50;
        const y = ((seed * (i + 1) * 89) % 530) + 50;
        const r = ((seed * (i + 1) * 23) % 40) + 10;
        const opacity = 0.1 + ((i % 5) * 0.08);
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${i % 2 === 0 ? theme.primary : theme.secondary}" stroke-width="1.5" opacity="${opacity}" />`;
    }).join('\n    ');

    const lines = Array.from({ length: 8 }, (_, i) => {
        const x1 = ((seed * (i + 3) * 71) % 1200);
        const y1 = ((seed * (i + 3) * 53) % 630);
        const x2 = ((seed * (i + 7) * 97) % 1200);
        const y2 = ((seed * (i + 7) * 41) % 630);
        const opacity = 0.05 + ((i % 4) * 0.04);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${i % 2 === 0 ? theme.primary : theme.secondary}" stroke-width="0.8" opacity="${opacity}" />`;
    }).join('\n    ');

    // Hexagonal grid pattern
    const hexagons = Array.from({ length: 6 }, (_, i) => {
        const cx = ((seed * (i + 2) * 113) % 1000) + 100;
        const cy = ((seed * (i + 2) * 67) % 430) + 100;
        const size = ((seed * (i + 2) * 31) % 30) + 20;
        const opacity = 0.08 + ((i % 3) * 0.05);
        const points = Array.from({ length: 6 }, (_, j) => {
            const angle = (Math.PI / 3) * j - Math.PI / 6;
            return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`;
        }).join(' ');
        return `<polygon points="${points}" fill="none" stroke="${theme.secondary}" stroke-width="1" opacity="${opacity}" />`;
    }).join('\n    ');

    // Truncate topic text to fit
    const displayTopic = topic.length > 35 ? topic.substring(0, 32) + '...' : topic;
    const fontSize = topic.length > 25 ? 36 : 44;

    return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a"/>
      <stop offset="50%" style="stop-color:#0d0d2b"/>
      <stop offset="100%" style="stop-color:#1a0a2e"/>
    </linearGradient>
    <radialGradient id="glow1" cx="30%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:${theme.primary};stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:${theme.primary};stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="70%" cy="60%" r="45%">
      <stop offset="0%" style="stop-color:${theme.secondary};stop-opacity:0.12"/>
      <stop offset="100%" style="stop-color:${theme.secondary};stop-opacity:0"/>
    </radialGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  
  <!-- Grid pattern -->
  <g opacity="0.06">
    ${Array.from({ length: 25 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="630" stroke="${theme.primary}" stroke-width="0.5"/>`).join('\n    ')}
    ${Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="1200" y2="${i * 50}" stroke="${theme.primary}" stroke-width="0.5"/>`).join('\n    ')}
  </g>
  
  <!-- Decorative elements -->
  ${circles}
  ${lines}
  ${hexagons}
  
  <!-- Central glowing orb -->
  <circle cx="600" cy="280" r="120" fill="none" stroke="${theme.primary}" stroke-width="1" opacity="0.2" filter="url(#neonGlow)"/>
  <circle cx="600" cy="280" r="80" fill="none" stroke="${theme.secondary}" stroke-width="1.5" opacity="0.15" filter="url(#neonGlow)"/>
  <circle cx="600" cy="280" r="40" fill="${theme.primary}" opacity="0.08" filter="url(#neonGlow)"/>
  
  <!-- Subject badge -->
  <rect x="40" y="30" width="${subject.length * 14 + 30}" height="36" rx="18" fill="${theme.primary}" opacity="0.2"/>
  <text x="${55 + (subject.length * 7)}" y="54" font-family="Arial, sans-serif" font-weight="700" font-size="16" fill="${theme.primary}" text-anchor="middle" letter-spacing="2">${subject.toUpperCase()}</text>
  
  <!-- Topic title -->
  <text x="600" y="480" font-family="Arial, sans-serif" font-weight="800" font-size="${fontSize}" fill="white" text-anchor="middle" filter="url(#textGlow)">${displayTopic}</text>
  <text x="600" y="520" font-family="Arial, sans-serif" font-weight="400" font-size="18" fill="${theme.primary}" text-anchor="middle" opacity="0.8">Exam Compass — Revision Notes</text>
  
  <!-- Bottom accent line -->
  <line x1="300" y1="560" x2="900" y2="560" stroke="${theme.primary}" stroke-width="2" opacity="0.4" filter="url(#neonGlow)"/>
  
  <!-- Corner accents -->
  <path d="M 30 80 L 30 30 L 80 30" fill="none" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
  <path d="M 1120 80 L 1120 30 L 1170 30" fill="none" stroke="${theme.secondary}" stroke-width="2" opacity="0.5"/>
  <path d="M 30 550 L 30 600 L 80 600" fill="none" stroke="${theme.secondary}" stroke-width="2" opacity="0.5"/>
  <path d="M 1120 550 L 1120 600 L 1170 600" fill="none" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
</svg>`;
}

async function generateHuggingFaceImage(subject: string, topic: string, outputPath: string): Promise<boolean> {
    const hfToken = process.env.HF_API_TOKEN;
    if (!hfToken) {
        console.warn("⚠️ HF_API_TOKEN not found in environment");
        return false;
    }

    try {
        console.log("🤗 Trying Hugging Face FLUX.1-schnell...");
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
                parameters: {
                    width: 1200,
                    height: 630,
                    num_inference_steps: 4,
                    guidance_scale: 0.0
                }
            })
        });

        if (response.status === 503) {
            // Model loading
            console.warn("🤗 Model loading, trying SDXL backup...");
            const sdxlResponse = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${hfToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    inputs: prompt,
                    parameters: { width: 1024, height: 1024 }
                })
            });
            
            if (!sdxlResponse.ok) throw new Error(`SDXL failed: ${sdxlResponse.status}`);
            
            const imageBuffer = Buffer.from(await sdxlResponse.arrayBuffer());
            const { default: sharp } = await import('sharp');
            await sharp(imageBuffer)
                .resize(1200, 630, { fit: 'cover' })
                .webp({ quality: 85 })
                .toFile(outputPath);
                
            console.log(`✅ HF SDXL image saved: ${(imageBuffer.length / 1024).toFixed(0)}KB`);
            return true;
        }

        if (!response.ok) {
            throw new Error(`HF API error: ${response.status} - ${await response.text()}`);
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        
        if (imageBuffer.length < 5000) {
            throw new Error(`HF response too small (${imageBuffer.length} bytes)`);
        }

        const { default: sharp } = await import('sharp');
        await sharp(imageBuffer)
            .resize(1200, 630, { fit: 'cover' })
            .webp({ quality: 85 })
            .toFile(outputPath);

        console.log(`✅ HF FLUX image saved: ${(imageBuffer.length / 1024).toFixed(0)}KB`);
        return true;
    } catch (err: any) {
        console.warn(`⚠️ Hugging Face failed: ${err.message?.substring(0, 80)}`);
        return false;
    }
}

async function generateLocalNeonImage(subject: string, topic: string, outputPath: string): Promise<boolean> {
    try {
        const svgContent = generateNeonSvg(topic, subject);
        const { default: sharp } = await import('sharp');
        await sharp(Buffer.from(svgContent))
            .resize(1200, 630)
            .webp({ quality: 90 })
            .toFile(outputPath);
        return true;
    } catch (err: any) {
        console.error(`⚠️ Local image generation failed: ${err.message}`);
        return false;
    }
}

async function downloadHeroImage(subject: string, topic: string, slug: string): Promise<string> {
    const webpPath = path.join(IMAGE_DIR, `${slug}.webp`);
    if (fs.existsSync(webpPath)) return `/blog-images/${slug}.webp`;

    console.log(`🎨 Jules: Designing custom artwork for "${topic}"...`);

    const artPromptUser = `Scientific diagram of ${topic}, ${subject} theme, dark background, cyan and purple neon accents, holographic interface style, 16:9 aspect ratio, cinematic lighting, 8k, no text.`;
    
    const seeds = [Math.floor(Math.random() * 10000), 42, 1234];
    const models = ['flux', 'turbo', 'flux-realism'];

    for (let i = 0; i < 3; i++) {
        try {
            console.log(`🖌️ Image Attempt ${i + 1}/3 (Model: ${models[i]})...`);
            const encodedPrompt = encodeURIComponent(artPromptUser);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&seed=${seeds[i]}&model=${models[i]}&nologo=true`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(imageUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ExamCompass/1.0',
                    'Accept': 'image/webp,image/png,image/jpeg,image/*,*/*',
                    'Referer': 'https://examcompass.pages.dev/'
                }
            });
            clearTimeout(timeout);

            const contentType = response.headers.get('content-type');
            
            if (!response.ok || !contentType?.startsWith('image/')) {
                throw new Error(`Invalid response (${response.status} ${contentType})`);
            }

            const bufferData = await response.arrayBuffer();
            if (bufferData.byteLength < 5000) {
                throw new Error(`Response too small (${bufferData.byteLength} bytes) — likely not a real image`);
            }

            const { default: sharp } = await import('sharp');
            await sharp(Buffer.from(bufferData))
                .resize(1200, 630, { fit: 'cover' })
                .webp({ quality: 85 })
                .toFile(webpPath);

            console.log(`✅ Image saved: ${slug}.webp (${(bufferData.byteLength / 1024).toFixed(0)}KB)`);
            return `/blog-images/${slug}.webp`;
        } catch (err: any) {
            console.warn(`⚠️ Image attempt ${i + 1} failed: ${err.message?.substring(0, 80)}`);
            if (i < 2) {
                console.log("⏳ Waiting 10s before retry...");
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    }

    // Fallback 1: Try Hugging Face
    console.log("🎨 Pollinations unavailable. Trying Hugging Face...");
    const hfOk = await generateHuggingFaceImage(subject, topic, webpPath);
    if (hfOk) {
        console.log(`✅ HF image saved: ${slug}.webp`);
        return `/blog-images/${slug}.webp`;
    }

    // Fallback 2: Generate local neon-themed image using Sharp + SVG
    console.log("🎨 Hugging Face unavailable. Generating local neon artwork...");
    const localOk = await generateLocalNeonImage(subject, topic, webpPath);
    if (localOk) {
        console.log(`✅ Local neon image saved: ${slug}.webp`);
        return `/blog-images/${slug}.webp`;
    }

    // Ultimate fallback — should never reach here since Sharp is installed
    console.error("❌ All image methods failed. Using placeholder.");
    return `/blog-images/${slug}.webp`;
}

async function generateBlogs() {
    console.log(`🤖 Jules: Starting Blog Generation (Queued)...`);

    if (!fs.existsSync(QUEUE_FILE)) {
        console.log("📭 No queue found.");
        return;
    }

    const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));

    // Track generated slugs for Discord
    const generatedSlugsFile = path.join(__dirname, '../generated-slugs.txt');
    fs.writeFileSync(generatedSlugsFile, ''); // Reset file

    for (const item of queue) {
        const publishDate = getShiftedDate();
        console.log(`\n✍️ Generating: ${item.topic} (${item.subject}, ${item.class})`);
        
        const filePath = path.join(BLOG_DIR, `${item.targetSlug}.md`);
        if (fs.existsSync(filePath)) {
            console.log(`⏩ Skipping ${item.targetSlug} (Exists).`);
            continue;
        }

        const heroImagePath = await downloadHeroImage(item.subject, item.topic, item.targetSlug);
        
        // --- STEP 1: GENERATE DYNAMIC SEO DESCRIPTION ---
        console.log("📑 Jules: Crafting unique SEO description...");
        let seoDescription = `Quick ${item.topic} Revision Notes & Recap for ${item.class} ${item.subject}. Peer-mentor notes, high-yield JEE/NEET data, and personal tricks to master the chapter fast.`;
        try {
            const seoCompletion = await groq.chat.completions.create({
                messages: [{ 
                    role: "system", 
                    content: "You are an SEO specialist. Write a high-click-through meta description (max 155 chars) for a blog post targeting 'Quick Revision' and 'Recap' keywords. Do not use quotes. Use active voice." 
                }, { 
                    role: "user", 
                    content: `Topic: ${item.topic}, Subject: ${item.subject}, Class: ${item.class}. Focus: Quick Revision, Formula Recap, Short Notes for JEE/NEET.` 
                }],
                model: "llama-3.1-8b-instant",
                max_tokens: 100
            });
            seoDescription = seoCompletion.choices[0]?.message?.content?.replace(/"/g, '').trim() || seoDescription;
        } catch (e) {}

        const systemPrompt = `You are Ayush's senior content editor. Peer mentor style. Min 2500 words. Rule: No "In conclusion". Use LaTeX. Content must be high-yield, extremely scannable, and serve as a "Quick Revision & Recap" alternative to traditional PDF notes. Follow BLOG_RULES.md strictly. Focus on tables, bold terms, and quick-scan headers.`;
        const userPrompt = `TOPIC: ${item.topic}, SUBJECT: ${item.subject}, CLASS: ${item.class}. Generate bodies starting with Quick Recall Box. Style: "Quick Revision & Recap". Include Ayush's Personal Note (1st person), JEE/NEET data, Core Concepts, Formulae Tables, MCQs. Highlight "Trap Exceptions" for quick review.`;

        let success = false;
        for (const model of GROQ_MODELS) {
            try {
                console.log(`📝 Attempting generation with ${model}...`);
                const chatCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    model: model,
                    temperature: 0.6,
                    max_tokens: 8000
                });

                let content = chatCompletion.choices[0]?.message?.content;
                if (content) {
                    content = content.replace(/^# .*\n/g, '').trim();

                    const finalMarkdown = `---
title: "${item.topic} Class ${item.class} Quick Revision Notes & Recap — Exam Compass"
description: "${seoDescription}"
category: "${item.subject}"
keywords: "${item.topic} quick revision, ${item.topic} recap notes, class ${item.class} ${item.subject} summary, JEE NEET quick notes, Exam Compass"
---

# ${item.topic} ${item.class} Notes for ${item.subject}

![${item.topic} notes for students](${heroImagePath})

*Last Updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*

${content}

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
`;
                    fs.writeFileSync(filePath, finalMarkdown);
                    fs.appendFileSync(generatedSlugsFile, item.targetSlug + '\n');
                    console.log(`✅ Success: ${item.targetSlug}.md saved.`);
                    success = true;
                    
                    // CRITICAL: Delay 15s to avoid 429 Rate Limit on next blog
                    console.log("⏳ Cooling down Groq (15s)...");
                    await new Promise(r => setTimeout(r, 15000));
                    break;
                }
            } catch (err: any) {
                if (err?.status === 429) {
                    console.warn(`⚠️ 429 Rate Limit on ${model}. Trying next model...`);
                    await new Promise(r => setTimeout(r, 5000)); // Short wait on 429
                } else {
                    console.error(`❌ Error with ${model}:`, err.message);
                }
            }
        }

        // --- STEP 4: GEMINI ULTIMATE FALLBACK ---
        if (!success) {
            console.log("🛡️ Groq failed all models. Triggering Gemini backup...");
            const content = await generateWithGemini(systemPrompt, userPrompt);
            if (content) {
                const cleanContent = content.replace(/^# .*\n/g, '').trim();
                const finalMarkdown = `---
title: "${item.topic} Class ${item.class} Quick Revision Notes & Recap — Exam Compass"
description: "${seoDescription}"
category: "${item.subject}"
keywords: "${item.topic} quick revision, ${item.topic} recap notes, class ${item.class} ${item.subject} summary, JEE NEET quick notes, Exam Compass"
---

# ${item.topic} ${item.class} Notes for ${item.subject}

![${item.topic} notes for students](${heroImagePath})

*Last Updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*

${cleanContent}

---
*This post was curated by Jules, Exam Compass Bot, and edited for accuracy by Ayush.*
`;
                fs.writeFileSync(filePath, finalMarkdown);
                fs.appendFileSync(generatedSlugsFile, item.targetSlug + '\n');
                console.log(`✅ Success: ${item.targetSlug}.md saved (via Gemini).`);
                success = true;
                
                console.log("⏳ Cooling down Gemini (10s)...");
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    }
    
    // FINAL STEP: Sync the blog registry automatically
    console.log("\n🔄 Jules: Triggering Registry Sync...");
    try {
        const { execSync } = await import('child_process');
        execSync('node scripts/sync-blogs.js', { stdio: 'inherit' });
    } catch (e: any) {
        console.error("⚠️ Registry Sync failed:", e.message);
    }
}

generateBlogs().catch(err => {
    console.error("❌ Jules Fatal Error:", err);
    process.exit(1);
});

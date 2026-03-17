/**
 * Test all 3 image generation layers independently
 * Run: node scripts/test-image-layers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');
const ENV_FILE = path.join(__dirname, '../.env');

// Load .env manually
const envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => [l.split('=')[0].trim(), l.split('=').slice(1).join('=').trim()])
);
const HF_TOKEN = env.HF_API_TOKEN || process.env.HF_API_TOKEN;

const TEST_TOPIC = 'Physical World';
const TEST_SUBJECT = 'Physics';
const TEST_SLUG = '_test_layer';

const RESULTS = { pollinations: null, huggingface: null, local: null };

// ─── LAYER 1: POLLINATIONS ───────────────────────────────────────────────────
async function testPollinations() {
    console.log('\n' + '═'.repeat(55));
    console.log('🎨 LAYER 1: POLLINATIONS API');
    console.log('═'.repeat(55));

    const prompt = `Scientific diagram of ${TEST_TOPIC}, ${TEST_SUBJECT} theme, dark background, cyan and purple neon accents, holographic interface style, 8k, no text`;
    const models = ['flux', 'turbo', 'flux-realism'];

    for (const model of models) {
        try {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&seed=${Math.floor(Math.random() * 1000)}&model=${model}&nologo=true`;
            console.log(`\n  🖌️  Testing model: ${model}`);
            console.log(`  URL: ${url.substring(0, 80)}...`);

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);
            const start = Date.now();

            const res = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ExamCompass/1.0',
                    'Accept': 'image/webp,image/png,image/jpeg,image/*,*/*',
                    'Referer': 'https://examcompass.pages.dev/'
                }
            });
            clearTimeout(timeout);

            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            const contentType = res.headers.get('content-type');
            console.log(`  Status: ${res.status} | Content-Type: ${contentType} | Time: ${elapsed}s`);

            if (!res.ok || !contentType?.startsWith('image/')) {
                const text = await res.text().catch(() => '');
                console.log(`  ❌ Invalid response: ${text.substring(0, 100)}`);
                continue;
            }

            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 5000) {
                console.log(`  ❌ Too small: ${buf.length} bytes`);
                continue;
            }

            const outPath = path.join(IMAGE_DIR, `${TEST_SLUG}_pollinations.webp`);
            const sharp = (await import('sharp')).default;
            await sharp(buf).resize(1200, 630, { fit: 'cover' }).webp({ quality: 85 }).toFile(outPath);

            console.log(`  ✅ SUCCESS! Model: ${model} | Size: ${(buf.length / 1024).toFixed(0)}KB | File: ${path.basename(outPath)}`);
            RESULTS.pollinations = { success: true, model, size: buf.length, file: outPath };
            return true;
        } catch (err) {
            console.log(`  ❌ Failed: ${err.message?.substring(0, 80)}`);
        }
        // Wait 2 seconds before trying next model
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    RESULTS.pollinations = { success: false };
    console.log('\n  ❌ LAYER 1 FAILED — all Pollinations models blocked');
    return false;
}

// ─── LAYER 2: HUGGING FACE ───────────────────────────────────────────────────
async function testHuggingFace() {
    console.log('\n' + '═'.repeat(55));
    console.log('🤗 LAYER 2: HUGGING FACE API');
    console.log('═'.repeat(55));

    if (!HF_TOKEN) {
        console.log('  ❌ HF_API_TOKEN not found in .env file!');
        console.log('  Add: HF_API_TOKEN=hf_your_token to .env');
        RESULTS.huggingface = { success: false, reason: 'No token' };
        return false;
    }

    console.log(`  🔑 Token found: ${HF_TOKEN.substring(0, 8)}...`);

    const prompt = `Scientific diagram of ${TEST_TOPIC}, ${TEST_SUBJECT} theme, dark background with cyan and purple neon accents, holographic interface style, cinematic lighting, digital art, no text`;
    const models = [
        { id: 'black-forest-labs/FLUX.1-schnell', params: { num_inference_steps: 4, guidance_scale: 0.0 } },
        { id: 'stabilityai/stable-diffusion-xl-base-1.0', params: {} }
    ];

    for (const model of models) {
        try {
            console.log(`\n  🖌️  Testing: ${model.id}`);
            const start = Date.now();

            const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'ExamCompass/1.0'
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { width: 1024, height: 512, ...model.params }
                })
            });

            const elapsed = ((Date.now() - start) / 1000).toFixed(1);
            const contentType = res.headers.get('content-type');
            console.log(`  Status: ${res.status} | Content-Type: ${contentType} | Time: ${elapsed}s`);

            if (res.status === 503) {
                const body = await res.json().catch(() => ({}));
                console.log(`  ⏳ Model loading (estimated: ${body.estimated_time?.toFixed(0) || '?'}s) — try again in a minute`);
                RESULTS.huggingface = { success: false, reason: 'Model loading', estimated: body.estimated_time };
                continue;
            }

            if (!res.ok) {
                const text = await res.text();
                console.log(`  ❌ Error: ${text.substring(0, 100)}`);
                continue;
            }

            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 5000) {
                console.log(`  ❌ Too small: ${buf.length} bytes`);
                continue;
            }

            const outPath = path.join(IMAGE_DIR, `${TEST_SLUG}_huggingface.webp`);
            const sharp = (await import('sharp')).default;
            await sharp(buf).resize(1200, 630, { fit: 'cover' }).webp({ quality: 85 }).toFile(outPath);

            console.log(`  ✅ SUCCESS! Model: ${model.id.split('/')[1]} | Size: ${(buf.length / 1024).toFixed(0)}KB | File: ${path.basename(outPath)}`);
            RESULTS.huggingface = { success: true, model: model.id, size: buf.length, file: outPath };
            return true;
        } catch (err) {
            console.log(`  ❌ Failed: ${err.message?.substring(0, 80)}`);
        }
    }

    RESULTS.huggingface = RESULTS.huggingface || { success: false, reason: 'All models failed' };
    console.log('\n  ❌ LAYER 2 FAILED — Hugging Face unavailable');
    return false;
}

// ─── LAYER 3: LOCAL NEON SVG ─────────────────────────────────────────────────
async function testLocalNeon() {
    console.log('\n' + '═'.repeat(55));
    console.log('🌈 LAYER 3: LOCAL NEON SVG (Sharp)');
    console.log('═'.repeat(55));

    const theme = { primary: '#00e5ff', secondary: '#7c4dff' };
    const topic = TEST_TOPIC;
    const seed = topic.length * 7 + TEST_SUBJECT.length * 13;

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

    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a"/><stop offset="50%" style="stop-color:#0d0d2b"/><stop offset="100%" style="stop-color:#1a0a2e"/>
    </linearGradient>
    <radialGradient id="g1" cx="30%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:${theme.primary};stop-opacity:0.15"/><stop offset="100%" style="stop-color:${theme.primary};stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="g2" cx="70%" cy="60%" r="45%">
      <stop offset="0%" style="stop-color:${theme.secondary};stop-opacity:0.12"/><stop offset="100%" style="stop-color:${theme.secondary};stop-opacity:0"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="tg"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#g1)"/><rect width="1200" height="630" fill="url(#g2)"/>
  <g opacity="0.06">${Array.from({ length: 25 }, (_, i) => `<line x1="${i*50}" y1="0" x2="${i*50}" y2="630" stroke="${theme.primary}" stroke-width="0.5"/>`).join('')}${Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${i*50}" x2="1200" y2="${i*50}" stroke="${theme.primary}" stroke-width="0.5"/>`).join('')}</g>
  ${circles}${hexagons}
  <circle cx="600" cy="280" r="120" fill="none" stroke="${theme.primary}" stroke-width="1" opacity="0.2" filter="url(#glow)"/>
  <circle cx="600" cy="280" r="80" fill="none" stroke="${theme.secondary}" stroke-width="1.5" opacity="0.15" filter="url(#glow)"/>
  <circle cx="600" cy="280" r="40" fill="${theme.primary}" opacity="0.08" filter="url(#glow)"/>
  <rect x="40" y="30" width="100" height="36" rx="18" fill="${theme.primary}" opacity="0.2"/>
  <text x="90" y="54" font-family="Arial,sans-serif" font-weight="700" font-size="16" fill="${theme.primary}" text-anchor="middle" letter-spacing="2">PHYSICS</text>
  <text x="600" y="480" font-family="Arial,sans-serif" font-weight="800" font-size="44" fill="white" text-anchor="middle" filter="url(#tg)">${topic}</text>
  <text x="600" y="520" font-family="Arial,sans-serif" font-weight="400" font-size="18" fill="${theme.primary}" text-anchor="middle" opacity="0.8">Exam Compass — Revision Notes</text>
  <line x1="300" y1="560" x2="900" y2="560" stroke="${theme.primary}" stroke-width="2" opacity="0.4" filter="url(#glow)"/>
  <path d="M 30 80 L 30 30 L 80 30" fill="none" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
  <path d="M 1120 80 L 1120 30 L 1170 30" fill="none" stroke="${theme.secondary}" stroke-width="2" opacity="0.5"/>
  <path d="M 30 550 L 30 600 L 80 600" fill="none" stroke="${theme.secondary}" stroke-width="2" opacity="0.5"/>
  <path d="M 1120 550 L 1120 600 L 1170 600" fill="none" stroke="${theme.primary}" stroke-width="2" opacity="0.5"/>
</svg>`;

    try {
        const outPath = path.join(IMAGE_DIR, `${TEST_SLUG}_local_neon.webp`);
        const sharp = (await import('sharp')).default;
        await sharp(Buffer.from(svg)).resize(1200, 630).webp({ quality: 90 }).toFile(outPath);

        const stat = fs.statSync(outPath);
        console.log(`  ✅ SUCCESS! Size: ${(stat.size / 1024).toFixed(1)}KB | File: ${path.basename(outPath)}`);
        RESULTS.local = { success: true, size: stat.size, file: outPath };
        return true;
    } catch (err) {
        console.log(`  ❌ FAILED: ${err.message}`);
        RESULTS.local = { success: false, reason: err.message };
        return false;
    }
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
function printSummary() {
    console.log('\n' + '═'.repeat(55));
    console.log('📊 RESULTS SUMMARY');
    console.log('═'.repeat(55));

    const status = (r) => r?.success ? '✅ WORKING' : `❌ FAILED${r?.reason ? ` (${r.reason})` : ''}`;

    console.log(`\n  Layer 1 — Pollinations:   ${status(RESULTS.pollinations)}`);
    if (RESULTS.pollinations?.success) console.log(`             Model: ${RESULTS.pollinations.model} | ${(RESULTS.pollinations.size/1024).toFixed(0)}KB`);

    console.log(`  Layer 2 — Hugging Face:   ${status(RESULTS.huggingface)}`);
    if (RESULTS.huggingface?.success) console.log(`             Model: ${RESULTS.huggingface.model?.split('/')[1]} | ${(RESULTS.huggingface.size/1024).toFixed(0)}KB`);
    if (RESULTS.huggingface?.reason === 'No token') console.log(`             → Add HF_API_TOKEN=hf_xxx to .env`);
    if (RESULTS.huggingface?.reason === 'Model loading') console.log(`             → Will work after model warms up (~${RESULTS.huggingface.estimated?.toFixed(0)}s)`);

    console.log(`  Layer 3 — Local Neon SVG: ${status(RESULTS.local)}`);
    if (RESULTS.local?.success) console.log(`             Size: ${(RESULTS.local.size/1024).toFixed(1)}KB`);

    const working = [RESULTS.pollinations, RESULTS.huggingface, RESULTS.local].filter(r => r?.success).length;
    console.log(`\n  🔢 ${working}/3 layers working`);

    if (working > 0) {
        console.log('\n  ✅ Blog generator is ready! Run:');
        console.log('     npx tsx scripts/blog-generator.ts\n');
    } else {
        console.log('\n  ❌ All layers failed — check your setup\n');
    }

    // Show generated test files
    const testFiles = fs.readdirSync(IMAGE_DIR).filter(f => f.startsWith('_test_layer'));
    if (testFiles.length > 0) {
        console.log(`  📁 Test images saved in public/blog-images/:`);
        testFiles.forEach(f => console.log(`     → ${f}`));
        console.log('\n  (Delete these test files when done)');
    }
}

// ─── RUN ALL TESTS ───────────────────────────────────────────────────────────
console.log('🧪 Testing all 3 image generation layers...');
console.log(`   Topic: "${TEST_TOPIC}" | Subject: "${TEST_SUBJECT}"`);

if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

await testPollinations();
await testHuggingFace();
await testLocalNeon();
printSummary();

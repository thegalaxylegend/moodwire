import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_DIR = path.join(__dirname, '../public/blog-images');
const BLOGS_TS = path.join(__dirname, '../src/data/blogs.ts');

// Generate a minimal PNG with colored gradient (no external deps)
function createPlaceholderPNG(width, height, label, hue) {
    // Create an SVG with gradient background and topic text
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue},70%,8%)"/>
      <stop offset="50%" style="stop-color:hsl(${hue + 30},60%,12%)"/>
      <stop offset="100%" style="stop-color:hsl(${hue + 60},50%,6%)"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:hsl(${hue},80%,60%);stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:hsl(${hue + 40},70%,50%);stop-opacity:0.1"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <!-- Decorative circles -->
  <circle cx="${width * 0.15}" cy="${height * 0.3}" r="120" fill="hsl(${hue},60%,40%)" opacity="0.08" filter="url(#glow)"/>
  <circle cx="${width * 0.85}" cy="${height * 0.7}" r="150" fill="hsl(${hue + 40},60%,50%)" opacity="0.06" filter="url(#glow)"/>
  <circle cx="${width * 0.5}" cy="${height * 0.5}" r="80" fill="hsl(${hue + 20},70%,45%)" opacity="0.1" filter="url(#glow)"/>
  <!-- Grid lines -->
  <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="hsl(${hue},40%,30%)" stroke-width="0.5" opacity="0.15"/>
  <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="hsl(${hue},40%,30%)" stroke-width="0.5" opacity="0.15"/>
  <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="hsl(${hue},40%,30%)" stroke-width="0.5" opacity="0.15"/>
  <line x1="${width * 0.25}" y1="0" x2="${width * 0.25}" y2="${height}" stroke="hsl(${hue},40%,30%)" stroke-width="0.5" opacity="0.15"/>
  <line x1="${width * 0.5}" y1="0" x2="${width * 0.5}" y2="${height}" stroke="hsl(${hue},40%,30%)" stroke-width="0.5" opacity="0.15"/>
  <line x1="${width * 0.75}" y1="0" x2="${width * 0.75}" y2="${height}" stroke="hsl(${hue},40%,30%)" stroke-width="0.5" opacity="0.15"/>
  <!-- Accent bar -->
  <rect x="0" y="${height - 4}" width="${width}" height="4" fill="url(#accent)"/>
  <!-- Topic label -->
  <text x="${width / 2}" y="${height / 2 - 10}" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="white" text-anchor="middle" opacity="0.9">${escapeXml(label)}</text>
  <text x="${width / 2}" y="${height / 2 + 30}" font-family="system-ui, sans-serif" font-size="18" fill="hsl(${hue},60%,65%)" text-anchor="middle" opacity="0.7">Exam Compass</text>
</svg>`;
    return svg;
}

function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Subject-to-hue mapping for consistent colors per category
const CATEGORY_HUES = {
    'Biology': 140,        // Green
    'Physics': 220,        // Blue
    'Chemistry': 30,       // Orange
    'Mathematics': 270,    // Purple
    'Strategy': 340,       // Pink
    'Class 11 Physics': 210,
    'Class 11 Chemistry': 25,
    'Class 11 Biology': 145,
    'Class 11 Mathematics': 265,
    'Class 12 Physics': 200,
    'Class 12 Chemistry': 35,
};

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

function makeLabel(title) {
    // Shorten for SVG display
    let label = title.replace(/ Class 11 Notes?/i, '').replace(/ Revision Notes?/i, '');
    if (label.length > 40) label = label.substring(0, 37) + '...';
    return label;
}

async function generate() {
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

    const blogEntries = parseBlogsTs();
    let generated = 0;

    console.log(`\n📋 Found ${blogEntries.length} blog entries. Checking for missing images...\n`);

    // Collect entries that need images
    const needsImage = [];
    for (const entry of blogEntries) {
        const imagePath = path.join(IMAGE_DIR, entry.imageFile);
        // Also check if a .png version exists for .webp references
        const pngAlt = entry.imageFile.replace('.webp', '.png');
        const pngPath = path.join(IMAGE_DIR, pngAlt);
        
        if (!fs.existsSync(imagePath) && !fs.existsSync(pngPath)) {
            needsImage.push(entry);
        }
    }

    if (needsImage.length === 0) {
        console.log('✅ All blog images are present!');
        return;
    }

    console.log(`🎨 Generating ${needsImage.length} missing images...\n`);

    for (const entry of needsImage) {
        const hue = CATEGORY_HUES[entry.category] || 260;
        const label = makeLabel(entry.title);
        const svg = createPlaceholderPNG(1200, 630, label, hue);
        
        // Save as SVG (works directly in <img> tags and is tiny)
        // But rename to .png/.webp extension so blogs.ts references work
        const outputName = entry.imageFile.endsWith('.webp')
            ? entry.imageFile.replace('.webp', '.svg')
            : entry.imageFile.replace(/\.(png|jpg)$/, '.svg');
        
        const outputPath = path.join(IMAGE_DIR, outputName);
        fs.writeFileSync(outputPath, svg);
        generated++;
        console.log(`   ✅ ${outputName}`);
    }

    // Now update blogs.ts to point .webp references → .svg
    console.log(`\n🔧 Updating blogs.ts references...`);
    let blogsContent = fs.readFileSync(BLOGS_TS, 'utf8');
    let updates = 0;
    
    for (const entry of needsImage) {
        const svgName = entry.imageFile.endsWith('.webp')
            ? entry.imageFile.replace('.webp', '.svg')
            : entry.imageFile.replace(/\.(png|jpg)$/, '.svg');
        
        if (fs.existsSync(path.join(IMAGE_DIR, svgName))) {
            blogsContent = blogsContent.replace(
                `"/blog-images/${entry.imageFile}"`,
                `"/blog-images/${svgName}"`
            );
            updates++;
        }
    }
    
    if (updates > 0) {
        fs.writeFileSync(BLOGS_TS, blogsContent);
        console.log(`   ✅ Updated ${updates} image references (.webp → .svg)`);
    }

    console.log(`\n📊 Done! Generated ${generated} placeholder images.`);
    console.log(`💡 To replace with AI-generated images later, run: node scripts/repair-images.js`);
}

generate().catch(console.error);

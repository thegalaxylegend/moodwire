import sharp from 'sharp';
import fs from 'fs';

const NEON_THEMES = {
    'Physics': { primary: '#00e5ff', secondary: '#7c4dff', glow: '#00e5ff' },
    'Chemistry': { primary: '#00e676', secondary: '#ff6d00', glow: '#00e676' },
    'default': { primary: '#00e5ff', secondary: '#7c4dff', glow: '#00e5ff' }
};

function generateNeonSvg(topic, subject) {
    const theme = NEON_THEMES[subject] || NEON_THEMES['default'];
    const seed = topic.length * 7 + subject.length * 13;
    
    const circles = Array.from({ length: 12 }, (_, i) => {
        const x = ((seed * (i + 1) * 137) % 1100) + 50;
        const y = ((seed * (i + 1) * 89) % 530) + 50;
        const r = ((seed * (i + 1) * 23) % 40) + 10;
        const opacity = 0.1 + ((i % 5) * 0.08);
        return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="' + (i % 2 === 0 ? theme.primary : theme.secondary) + '" stroke-width="1.5" opacity="' + opacity + '" />';
    }).join('\n    ');

    const hexagons = Array.from({ length: 6 }, (_, i) => {
        const cx = ((seed * (i + 2) * 113) % 1000) + 100;
        const cy = ((seed * (i + 2) * 67) % 430) + 100;
        const size = ((seed * (i + 2) * 31) % 30) + 20;
        const opacity = 0.08 + ((i % 3) * 0.05);
        const points = Array.from({ length: 6 }, (_, j) => {
            const angle = (Math.PI / 3) * j - Math.PI / 6;
            return (cx + size * Math.cos(angle)).toFixed(1) + ',' + (cy + size * Math.sin(angle)).toFixed(1);
        }).join(' ');
        return '<polygon points="' + points + '" fill="none" stroke="' + theme.secondary + '" stroke-width="1" opacity="' + opacity + '" />';
    }).join('\n    ');

    return '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
      '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" style="stop-color:#0a0a1a"/>' +
      '<stop offset="50%" style="stop-color:#0d0d2b"/>' +
      '<stop offset="100%" style="stop-color:#1a0a2e"/>' +
      '</linearGradient>' +
      '<radialGradient id="glow1" cx="30%" cy="40%" r="50%">' +
      '<stop offset="0%" style="stop-color:' + theme.primary + ';stop-opacity:0.15"/>' +
      '<stop offset="100%" style="stop-color:transparent;stop-opacity:0"/>' +
      '</radialGradient>' +
      '<radialGradient id="glow2" cx="70%" cy="60%" r="45%">' +
      '<stop offset="0%" style="stop-color:' + theme.secondary + ';stop-opacity:0.12"/>' +
      '<stop offset="100%" style="stop-color:transparent;stop-opacity:0"/>' +
      '</radialGradient>' +
      '<filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feGaussianBlur stdDeviation="3" result="blur"/>' +
      '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
      '<filter id="textGlow" x="-10%" y="-10%" width="120%" height="120%">' +
      '<feGaussianBlur stdDeviation="6" result="blur"/>' +
      '<feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
      '</defs>' +
      '<rect width="1200" height="630" fill="url(#bg)"/>' +
      '<rect width="1200" height="630" fill="url(#glow1)"/>' +
      '<rect width="1200" height="630" fill="url(#glow2)"/>' +
      circles + hexagons +
      '<circle cx="600" cy="280" r="120" fill="none" stroke="' + theme.primary + '" stroke-width="1" opacity="0.2" filter="url(#neonGlow)"/>' +
      '<circle cx="600" cy="280" r="80" fill="none" stroke="' + theme.secondary + '" stroke-width="1.5" opacity="0.15" filter="url(#neonGlow)"/>' +
      '<circle cx="600" cy="280" r="40" fill="' + theme.primary + '" opacity="0.08" filter="url(#neonGlow)"/>' +
      '<rect x="40" y="30" width="130" height="36" rx="18" fill="' + theme.primary + '" opacity="0.2"/>' +
      '<text x="105" y="54" font-family="Arial, sans-serif" font-weight="700" font-size="16" fill="' + theme.primary + '" text-anchor="middle" letter-spacing="2">PHYSICS</text>' +
      '<text x="600" y="480" font-family="Arial, sans-serif" font-weight="800" font-size="44" fill="white" text-anchor="middle" filter="url(#textGlow)">Physical World</text>' +
      '<text x="600" y="520" font-family="Arial, sans-serif" font-weight="400" font-size="18" fill="' + theme.primary + '" text-anchor="middle" opacity="0.8">Exam Compass — Revision Notes</text>' +
      '<line x1="300" y1="560" x2="900" y2="560" stroke="' + theme.primary + '" stroke-width="2" opacity="0.4" filter="url(#neonGlow)"/>' +
      '<path d="M 30 80 L 30 30 L 80 30" fill="none" stroke="' + theme.primary + '" stroke-width="2" opacity="0.5"/>' +
      '<path d="M 1120 80 L 1120 30 L 1170 30" fill="none" stroke="' + theme.secondary + '" stroke-width="2" opacity="0.5"/>' +
      '<path d="M 30 550 L 30 600 L 80 600" fill="none" stroke="' + theme.secondary + '" stroke-width="2" opacity="0.5"/>' +
      '<path d="M 1120 550 L 1120 600 L 1170 600" fill="none" stroke="' + theme.primary + '" stroke-width="2" opacity="0.5"/>' +
      '</svg>';
}

async function test() {
    const svg = generateNeonSvg('Physical World', 'Physics');
    const testPath = 'public/blog-images/test-neon-output.webp';
    await sharp(Buffer.from(svg))
        .resize(1200, 630)
        .webp({ quality: 90 })
        .toFile(testPath);
    const stat = fs.statSync(testPath);
    console.log('✅ Test image generated: ' + testPath + ' (' + (stat.size / 1024).toFixed(1) + 'KB)');
    // Clean up test file
    fs.unlinkSync(testPath);
    console.log('✅ Test file cleaned up. Neon image generator works!');
}
test().catch(e => console.error('❌ Failed:', e.message));

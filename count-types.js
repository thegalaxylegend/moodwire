
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(process.cwd(), 'public', 'seo-manifest.json');

if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const counts = {};
    Object.values(manifest).forEach(meta => {
        const type = meta.type || 'unknown';
        counts[type] = (counts[type] || 0) + 1;
    });
    console.log(JSON.stringify(counts, null, 2));
} else {
    console.log('Manifest not found');
}

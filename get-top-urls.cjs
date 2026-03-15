
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(process.cwd(), 'public', 'seo-manifest.json');
const BASE_URL = 'https://examcompass.web.app';

if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Convert to array and add the URL key
    const urls = Object.entries(manifest).map(([url, meta]) => ({
        url,
        ...meta
    }));

    // Sorting strategy:
    // 1. Home
    // 2. Blog Index
    // 3. Exams
    // 4. Hubs
    // 5. Blog Posts
    // 6. Topics (High priority first)
    
    const typeOrder = {
        'home': 1,
        'blog-index': 2,
        'exam': 3,
        'hub': 4,
        'blog-post': 5,
        'topic': 6,
        'question': 7,
        'page': 8
    };

    urls.sort((a, b) => {
        const orderA = typeOrder[a.type] || 99;
        const orderB = typeOrder[b.type] || 99;
        
        if (orderA !== orderB) return orderA - orderB;
        return (b.priority || 0.5) - (a.priority || 0.5); // Secondary sort by priority
    });

    const top100 = urls.slice(0, 100).map(u => `${BASE_URL}${u.url}`);
    console.log(top100.join('\n'));
} else {
    console.log('Manifest not found');
}

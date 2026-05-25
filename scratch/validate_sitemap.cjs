const fs = require('fs');
const path = require('path');

const sitemapPath = 'c:/Users/Admin/Downloads/Desktop/public/sitemap.xml';

try {
    const content = fs.readFileSync(sitemapPath, 'utf8');
    console.log(`Sitemap size: ${content.length} characters`);
    console.log(`First 200 chars:`, content.substring(0, 200));
    console.log(`Last 200 chars:`, content.substring(content.length - 200));

    // Basic well-formed checks
    const openTags = (content.match(/<url>/g) || []).length;
    const closeTags = (content.match(/<\/url>/g) || []).length;
    console.log(`URL count in sitemap: ${openTags}`);
    console.log(`Open tags: ${openTags}, Close tags: ${closeTags}`);

    if (openTags !== closeTags) {
        console.error('ERROR: Mismatched <url> tags!');
    }

    // Check if there are duplicate sitemaps or nested sitemaps or if there's any invalid character
    if (!content.trim().startsWith('<?xml')) {
        console.error('WARNING: Sitemap does not start with <?xml');
    }

    if (!content.trim().endsWith('</urlset>')) {
        console.error('WARNING: Sitemap does not end with </urlset>');
    }

    // Check for any non-ascii or unescaped ampersands
    const invalidAmpersands = content.match(/&(?![a-zA-Z0-9#]+;)/g);
    if (invalidAmpersands) {
        console.error(`WARNING: Found ${invalidAmpersands.length} unescaped ampersands! Example:`, content.substring(content.indexOf('&') - 10, content.indexOf('&') + 10));
    } else {
        console.log('No unescaped ampersands found.');
    }
} catch (e) {
    console.error('Error reading/validating sitemap:', e);
}

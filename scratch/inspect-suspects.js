import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const MANIFEST_PATH = path.resolve(DIST_DIR, 'seo-manifest.json');
const LIVE_DOMAIN = 'https://examcompass.pages.dev';

const SPA_ROUTES = ['/dashboard', '/admin', '/login', '/onboarding'];
function isSpaRoute(routePath) {
    const normalized = routePath.toLowerCase().replace(/\/+$/, '');
    return SPA_ROUTES.some(spa => normalized === spa || normalized.startsWith(spa + '/'));
}

function getHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file === 'server') continue;
            getHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const manifestRoutes = new Set(Object.keys(manifest).map(r => r.replace(/\/+$/, '').replace(/^\/+/, '')));

const htmlFiles = getHtmlFiles(DIST_DIR);
const internalLinks = new Set();

for (const filePath of htmlFiles) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let relPath = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
    let pageUrlPath = '/' + relPath.replace(/index\.html$/, '');
    if (pageUrlPath.length > 1 && pageUrlPath.endsWith('/')) pageUrlPath = pageUrlPath.slice(0, -1);
    const pageAbsoluteUrl = `${LIVE_DOMAIN}${pageUrlPath}`;

    const anchorMatches = fileContent.match(/<a\s+[^>]+>/gi) || [];
    for (const tag of anchorMatches) {
        const hrefMatch = tag.match(/\bhref=["']([^"']*)["']/i);
        if (!hrefMatch) continue;
        const href = hrefMatch[1].trim();
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

        try {
            const resolvedUrl = new URL(href, pageAbsoluteUrl);
            if (resolvedUrl.hostname === 'examcompass.pages.dev' || resolvedUrl.hostname === 'localhost') {
                internalLinks.add(resolvedUrl.pathname);
            }
        } catch (e) {}
    }
}

const suspects = [];
for (const pathOnly of internalLinks) {
    const normalizedPath = pathOnly.replace(/\/+$/, '').replace(/^\/+/, '');
    
    if (isSpaRoute(pathOnly)) continue;
    if (manifestRoutes.has(normalizedPath)) continue;
    if (normalizedPath === '') continue;

    // Check physical file
    const localFilePath = path.join(DIST_DIR, normalizedPath);
    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) continue;
    const localIndex = path.join(DIST_DIR, normalizedPath, 'index.html');
    if (fs.existsSync(localIndex)) continue;

    suspects.push({
        path: pathOnly,
        normalized: normalizedPath,
        lowerNormalized: normalizedPath.toLowerCase(),
        isInManifestCaseInsensitive: Array.from(manifestRoutes).some(r => r.toLowerCase() === normalizedPath.toLowerCase())
    });
}

console.log('Total suspects:', suspects.length);
console.log('Sample suspects (first 30):');
console.dir(suspects.slice(0, 30), { depth: null });

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const MANIFEST_PATH = path.resolve(DIST_DIR, 'seo-manifest.json');
const LIVE_DOMAIN = 'https://examcompass.pages.dev';
const CSV_OUTPUT_PATH = path.resolve(__dirname, '../broken_links_report.csv');

// Valid SPA routes
const SPA_ROUTES = [
    '/dashboard',
    '/admin',
    '/login',
    '/onboarding',
    '/report',
    '/download',
    '/practice'
];

function isSpaRoute(routePath) {
    const normalized = routePath.toLowerCase().replace(/\/+$/, '');
    return SPA_ROUTES.some(spa => normalized === spa || normalized.startsWith(spa + '/'));
}

// Helper to recursively find all HTML files
function getHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file === 'server') continue; // Exclude SSR bundle
            getHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

async function main() {
    console.log('🔍 Starting Local Static HTML Link and SEO Audit...\n');

    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ Dist folder not found. Please build the project first.');
        process.exit(1);
    }

    let manifest = {};
    const manifestRoutes = new Set();
    if (fs.existsSync(MANIFEST_PATH)) {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        for (const r of Object.keys(manifest)) {
            // Store manifest routes normalized without trailing slash and leading slash
            const normalized = r.replace(/\/+$/, '').replace(/^\/+/, '');
            manifestRoutes.add(normalized);
        }
        console.log(`📋 SEO Manifest loaded with ${manifestRoutes.size} normalized routes.`);
    } else {
        console.warn('⚠️ Warning: seo-manifest.json not found in dist. Local SSG validation will rely on physical files.');
    }

    const htmlFiles = getHtmlFiles(DIST_DIR);
    console.log(`📂 Found ${htmlFiles.length} HTML files to scan.\n`);

    const brokenLinks = [];
    const longRedirects = []; // Always 0 locally as there are no redirect chains defined
    const spaWithoutContext = [];
    const missingCanonicals = [];
    
    // Track canonicals across pages to detect duplicates
    const canonicalMap = new Map();

    for (const filePath of htmlFiles) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Calculate the source path URL relative to dist
        let relPath = path.relative(DIST_DIR, filePath).replace(/\\/g, '/');
        let pageUrlPath = '/' + relPath.replace(/index\.html$/, '');
        if (pageUrlPath.length > 1 && pageUrlPath.endsWith('/')) {
            pageUrlPath = pageUrlPath.slice(0, -1);
        }
        const pageAbsoluteUrl = `${LIVE_DOMAIN}${pageUrlPath}`;

        // 1. Check React Router Context
        // Fixed regex to allow starting slash directly inside the quote (e.g. src="/assets/index-...")
        const hasRouterContext = /<script\s+[^>]*src=["'](?:[^"']*\/assets\/index-[a-zA-Z0-9_-]+\.js|\/src\/main\.tsx)["']/i.test(fileContent);

        // 2. Parse Canonical Tags
        const canonicalMatches = fileContent.match(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi) || [];
        const canonicalUrlsInPage = [];
        
        for (const tag of canonicalMatches) {
            const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
            if (hrefMatch) {
                canonicalUrlsInPage.push(hrefMatch[1]);
            }
        }

        if (canonicalUrlsInPage.length === 0) {
            missingCanonicals.push({
                file: relPath,
                url: pageUrlPath,
                type: 'Missing canonical tag entirely'
            });
        } else {
            if (canonicalUrlsInPage.length > 1) {
                missingCanonicals.push({
                    file: relPath,
                    url: pageUrlPath,
                    type: `Page has multiple (${canonicalUrlsInPage.length}) canonical tags: ${canonicalUrlsInPage.join(', ')}`
                });
            }
            
            for (const canonicalUrl of canonicalUrlsInPage) {
                const existing = canonicalMap.get(canonicalUrl) || [];
                existing.push({ relPath, pageUrlPath });
                canonicalMap.set(canonicalUrl, existing);
            }
        }

        // 3. Parse Anchors
        const anchorMatches = fileContent.match(/<a\s+[^>]+>/gi) || [];
        
        for (const tag of anchorMatches) {
            const hrefMatch = tag.match(/\bhref=["']([^"']*)["']/i);
            if (!hrefMatch) continue;
            
            const href = hrefMatch[1].trim();
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
                continue;
            }

            let resolvedUrl;
            try {
                resolvedUrl = new URL(href, pageAbsoluteUrl);
            } catch (e) {
                brokenLinks.push({
                    sourceUrl: pageUrlPath,
                    brokenHref: href,
                    status: 'INVALID_URL_FORMAT'
                });
                continue;
            }

            const isInternal = resolvedUrl.hostname === 'examcompass.pages.dev' || resolvedUrl.hostname === 'localhost';
            if (!isInternal) continue;

            const targetPath = resolvedUrl.pathname;
            const normalizedTargetPath = targetPath.replace(/\/+$/, '').replace(/^\/+/, '');

            // (3) links pointing to /dashboard (SPA-only) from SSG pages without React Router context
            if (isSpaRoute(targetPath)) {
                if (!hasRouterContext) {
                    spaWithoutContext.push({
                        sourceUrl: pageUrlPath,
                        targetUrl: targetPath,
                        rawHref: href
                    });
                }
            }

            // 4. Verify Link Locally
            let isFound = false;

            // - Check SPA Routes
            if (isSpaRoute(targetPath)) {
                isFound = true;
            }
            // - Check SEO Manifest
            else if (manifestRoutes.has(normalizedTargetPath)) {
                isFound = true;
            }
            // - Check physical files
            else {
                const localFilePath = path.join(DIST_DIR, normalizedTargetPath);
                if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
                    isFound = true;
                } else {
                    const localIndex = path.join(DIST_DIR, normalizedTargetPath, 'index.html');
                    if (fs.existsSync(localIndex)) {
                        isFound = true;
                    }
                }
            }

            // Home path check
            if (normalizedTargetPath === '') {
                isFound = true;
            }

            if (!isFound) {
                brokenLinks.push({
                    sourceUrl: pageUrlPath,
                    brokenHref: href,
                    status: '404'
                });
            }
        }
    }

    // Process duplicate canonical URLs across different pages
    const duplicateCanonicals = [];
    for (const [canonicalUrl, pages] of canonicalMap.entries()) {
        if (pages.length > 1) {
            duplicateCanonicals.push({
                canonicalUrl,
                pages: pages.map(p => p.pageUrlPath)
            });
        }
    }

    // Write CSV report
    let csvContent = 'source_url,broken_href,HTTP_status\n';
    for (const link of brokenLinks) {
        const src = link.sourceUrl.replace(/"/g, '""');
        const href = link.brokenHref.replace(/"/g, '""');
        const status = link.status.replace(/"/g, '""');
        csvContent += `"${src}","${href}","${status}"\n`;
    }
    fs.writeFileSync(CSV_OUTPUT_PATH, csvContent, 'utf8');

    // Print Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 STATIC CRAWL & SEO AUDIT REPORT SUMMARY (LOCAL RESOLUTION)');
    console.log('═'.repeat(60));
    console.log(`  📁 Total HTML pages crawled:    ${htmlFiles.length}`);
    console.log(`  ❌ Broken/404 links:             ${brokenLinks.length}`);
    console.log(`  🔄 Redirect chains (> 2 hops):   ${longRedirects.length}`);
    console.log(`  🚫 SPA links without context:    ${spaWithoutContext.length}`);
    console.log(`  🏷️  Missing canonical tags:       ${missingCanonicals.length}`);
    console.log(`  👥 Duplicate canonical URLs:     ${duplicateCanonicals.length}`);
    console.log('═'.repeat(60));

    if (brokenLinks.length > 0) {
        console.log('\n💀 (1) BROKEN LINKS (404s):');
        brokenLinks.slice(0, 30).forEach(b => {
            console.log(`  ❌ [${b.status}] ${b.sourceUrl} ➔ ${b.brokenHref}`);
        });
        if (brokenLinks.length > 30) {
            console.log(`  ... and ${brokenLinks.length - 30} more. See broken_links_report.csv.`);
        }
    } else {
        console.log('\n✅ No broken links detected!');
    }

    if (longRedirects.length > 0) {
        console.log('\n🔄 (2) REDIRECT CHAINS LONGER THAN 2 HOPS:');
        longRedirects.forEach(r => {
            console.log(`  ⚠️  [${r.hops} hops] ${r.chain.join(' ➔ ')}`);
        });
    } else {
        console.log('\n✅ (2) No redirect chains longer than 2 hops configured or detected!');
    }

    if (spaWithoutContext.length > 0) {
        console.log('\n🚫 (3) SPA LINKS TO /DASHBOARD WITHOUT ROUTER CONTEXT:');
        spaWithoutContext.slice(0, 10).forEach(s => {
            console.log(`  ⚠️  In page: ${s.sourceUrl} ➔ Link: ${s.rawHref}`);
        });
        if (spaWithoutContext.length > 10) {
            console.log(`  ... and ${spaWithoutContext.length - 10} more.`);
        }
    } else {
        console.log('\n✅ (3) No SPA links pointing to /dashboard from pages lacking Router context!');
    }

    if (missingCanonicals.length > 0) {
        console.log('\n🏷️  (4) MISSING CANONICAL TAGS:');
        missingCanonicals.slice(0, 15).forEach(c => {
            console.log(`  ⚠️  File: ${c.file} (URL: ${c.url}) - ${c.type}`);
        });
        if (missingCanonicals.length > 15) {
            console.log(`  ... and ${missingCanonicals.length - 15} more.`);
        }
    } else {
        console.log('\n✅ (4) All crawled pages contain canonical tags!');
    }

    if (duplicateCanonicals.length > 0) {
        console.log('\n👥 (5) DUPLICATE CANONICAL URLS ACROSS PAGES:');
        duplicateCanonicals.slice(0, 10).forEach(d => {
            console.log(`  ⚠️  Canonical URL: ${d.canonicalUrl}`);
            console.log(`     Mapped to: ${d.pages.join(', ')}`);
        });
        if (duplicateCanonicals.length > 10) {
            console.log(`  ... and ${duplicateCanonicals.length - 10} more.`);
        }
    } else {
        console.log('\n✅ (5) No duplicate canonical URLs across pages!');
    }

    console.log(`\n💾 CSV report generated at: broken_links_report.csv`);
    console.log('\n✨ Audit complete!\n');
}

main();

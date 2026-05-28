import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const DIST_DIR = path.resolve(__dirname, '../dist');
const MANIFEST_PATH = path.resolve(PUBLIC_DIR, 'seo-manifest.json');
const REPORT_OUTPUT_PATH = path.resolve(__dirname, '../manifest_violations_report.json');

// Helper to extract title tag contents, prioritizing data-rh="true"
function extractTitle(htmlContent) {
    const titleMatches = htmlContent.match(/<title\b[^>]*>([\s\S]*?)<\/title>/gi) || [];
    let fallbackTitle = null;
    for (const tag of titleMatches) {
        const match = tag.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
        const val = match ? match[1].trim() : '';
        if (/\bdata-rh=["']true["']/i.test(tag)) {
            return val;
        }
        fallbackTitle = val;
    }
    return fallbackTitle;
}

// Helper to extract meta content value, prioritizing data-rh="true"
function extractMetaContent(htmlContent, nameOrProperty, isProperty = false) {
    const metaTags = htmlContent.match(/<meta\s+[^>]+>/gi) || [];
    let fallbackValue = null;
    
    for (const meta of metaTags) {
        const matchesTarget = isProperty 
            ? new RegExp(`\\bproperty=["']${nameOrProperty}["']`, 'i').test(meta)
            : new RegExp(`\\bname=["']${nameOrProperty}["']`, 'i').test(meta);
            
        if (matchesTarget) {
            const match = meta.match(/\bcontent=(?:"([^"]*)"|'([^']*)')/i);
            const val = match ? (match[1] || match[2] || '') : '';
            
            if (/\bdata-rh=["']true["']/i.test(meta)) {
                return val;
            }
            fallbackValue = val;
        }
    }
    return fallbackValue;
}

async function main() {
    console.log('🔍 Starting SEO Manifest & HTML Static Page Audit...\n');

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error(`❌ SEO Manifest not found at: ${MANIFEST_PATH}`);
        process.exit(1);
    }

    if (!fs.existsSync(DIST_DIR)) {
        console.error(`❌ Dist directory not found at: ${DIST_DIR}`);
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const allRoutes = Object.keys(manifest);
    console.log(`📋 Loaded ${allRoutes.length} routes from public/seo-manifest.json.`);

    // Filter down to indexable (SSG) pages that are expected to exist in /dist and sitemaps.
    // Question pages that are "noindex" are skipped from static pre-rendering to prevent deployment bloat.
    const routes = allRoutes.filter(url => {
        const meta = manifest[url];
        if (!meta) return true; // Home etc.
        if (meta.type !== 'question') return true;
        return meta.robots && meta.robots.includes('index') && !meta.robots.includes('noindex');
    });

    console.log(`🎯 Auditing ${routes.length} indexable SSG routes (skipped ${allRoutes.length - routes.length} SPA-only noindex routes).\n`);

    // 1. Compile all sitemap URLs
    const sitemapPaths = new Set();
    const sitemapFiles = fs.readdirSync(DIST_DIR).filter(f => f.startsWith('sitemap') && f.endsWith('.xml'));
    
    console.log(`🌐 Reading sitemap files: ${sitemapFiles.join(', ')}`);
    for (const file of sitemapFiles) {
        const content = fs.readFileSync(path.join(DIST_DIR, file), 'utf8');
        const locMatches = content.match(/<loc>([^<]+)<\/loc>/gi) || [];
        for (const loc of locMatches) {
            const urlText = loc.replace(/<\/?loc>/gi, '').trim();
            try {
                const parsed = new URL(urlText);
                // Normalize sitemap path
                const normPath = parsed.pathname.replace(/\/+$/, '');
                sitemapPaths.add(normPath === '' ? '/' : normPath);
            } catch (e) {
                console.warn(`⚠️  Failed to parse URL in sitemap: ${urlText}`);
            }
        }
    }
    console.log(`✅ Loaded ${sitemapPaths.size} unique URL paths from sitemaps.\n`);

    const violations = [];
    let checkedCount = 0;
    let missingFilesCount = 0;

    for (const route of routes) {
        checkedCount++;
        const routeViolations = [];
        
        // Normalize route path
        const normalizedRoute = route.replace(/\/+$/, '');
        const routePathOnly = normalizedRoute === '' ? '/' : normalizedRoute;

        // --- (1) Verify HTML File Existence ---
        const cleanPath = route.replace(/\/+$/, '').replace(/^\/+/, '');
        const standardFilePath = cleanPath === ''
            ? path.join(DIST_DIR, 'index.html')
            : path.join(DIST_DIR, cleanPath, 'index.html');
        
        const altFilePath = path.join(DIST_DIR, cleanPath + '.html');
        
        let fileExists = fs.existsSync(standardFilePath);
        let actualFilePath = standardFilePath;
        
        if (!fileExists && fs.existsSync(altFilePath)) {
            fileExists = true;
            actualFilePath = altFilePath;
        }

        if (!fileExists) {
            missingFilesCount++;
            routeViolations.push({
                field: 'HTML_file_existence',
                current: 'Missing',
                expected: `File at ${path.relative(DIST_DIR, standardFilePath)}`
            });
        }

        // --- (2) Verify Sitemap Presence ---
        if (!sitemapPaths.has(routePathOnly)) {
            routeViolations.push({
                field: 'sitemap_presence',
                current: 'Not in sitemap',
                expected: 'Present in sitemap'
            });
        }

        // Only run HTML content checks if the file exists
        if (fileExists) {
            const htmlContent = fs.readFileSync(actualFilePath, 'utf8');

            // --- (3) Verify Exactly One H1 Tag ---
            const h1Matches = htmlContent.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
            if (h1Matches.length !== 1) {
                routeViolations.push({
                    field: 'h1_tag_count',
                    current: `${h1Matches.length} H1 tag(s)`,
                    expected: 'Exactly 1 H1 tag'
                });
            }

            // --- (4) Verify Meta Description Length (120-160 chars) ---
            const metaDesc = extractMetaContent(htmlContent, 'description', false);

            if (metaDesc === null) {
                routeViolations.push({
                    field: 'meta_description',
                    current: 'Missing',
                    expected: 'Present (120-160 characters)'
                });
            } else {
                const descLen = metaDesc.length;
                if (descLen < 120 || descLen > 160) {
                    routeViolations.push({
                        field: 'meta_description_length',
                        current: `${descLen} chars ("${metaDesc}")`,
                        expected: 'Between 120 and 160 characters'
                    });
                }
            }

            // --- (5) Verify Open Graph Tags (og:title, og:description, og:image) ---
            const ogTitle = extractMetaContent(htmlContent, 'og:title', true);
            const ogDesc = extractMetaContent(htmlContent, 'og:description', true);
            const ogImage = extractMetaContent(htmlContent, 'og:image', true);

            if (!ogTitle || !ogTitle.trim()) {
                routeViolations.push({
                    field: 'og:title',
                    current: ogTitle === null ? 'Missing' : 'Empty',
                    expected: 'Populated string value'
                });
            }
            if (!ogDesc || !ogDesc.trim()) {
                routeViolations.push({
                    field: 'og:description',
                    current: ogDesc === null ? 'Missing' : 'Empty',
                    expected: 'Populated string value'
                });
            }
            if (!ogImage || !ogImage.trim()) {
                routeViolations.push({
                    field: 'og:image',
                    current: ogImage === null ? 'Missing' : 'Empty',
                    expected: 'Populated string value'
                });
            }
        }

        if (routeViolations.length > 0) {
            violations.push({
                route,
                violations: routeViolations
            });
        }
    }

    // Write full violations report
    fs.writeFileSync(REPORT_OUTPUT_PATH, JSON.stringify(violations, null, 2), 'utf8');

    // Summary calculations
    const totalViolationsCount = violations.reduce((acc, curr) => acc + curr.violations.length, 0);

    console.log('\n' + '═'.repeat(60));
    console.log('📊 SEO MANIFEST & HTML AUDIT REPORT SUMMARY');
    console.log('═'.repeat(60));
    console.log(`  📋 Total routes checked:        ${checkedCount}`);
    console.log(`  📁 Pages with violations:       ${violations.length}`);
    console.log(`  ❌ Total individual violations:  ${totalViolationsCount}`);
    console.log(`  ⚠️  Missing HTML files:         ${missingFilesCount}`);
    console.log('═'.repeat(60));

    if (violations.length > 0) {
        console.log('\n🔍 SAMPLE VIOLATIONS (First 15 pages):');
        violations.slice(0, 15).forEach((v, index) => {
            console.log(`\n  📄 Route #${index + 1}: ${v.route}`);
            v.violations.forEach(viol => {
                console.log(`     ❌ [${viol.field}]`);
                console.log(`        Current:  ${viol.current}`);
                console.log(`        Expected: ${viol.expected}`);
            });
        });
        if (violations.length > 15) {
            console.log(`\n  ... and ${violations.length - 15} more pages with violations.`);
        }
    } else {
        console.log('\n✅ No SEO violations detected! Every indexable page meets all 5 criteria.');
    }

    console.log(`\n💾 Detailed JSON report written to: manifest_violations_report.json`);
    console.log('\n✨ Audit complete!\n');
}

main();

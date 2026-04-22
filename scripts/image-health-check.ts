/**
 * 🖼️ Image Health Checker (NEXUS v2)
 * 
 * Scans blog images for:
 * 1. Missing images (referenced in frontmatter but file doesn't exist)
 * 2. Oversized images (> 500KB)
 * 3. Non-WebP format (suggests conversion)
 * 
 * Zero dependencies. Just file system checks.
 * 
 * Run: npx tsx scripts/image-health-check.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const IMAGE_DIR = path.join(__dirname, '../public/blog-images');
const REPORTS_DIR = path.join(__dirname, '../jules-reports');

const SIZE_WARN_KB = 500; // Warn if image > 500KB
const SIZE_CRITICAL_KB = 2000; // Critical if > 2MB

interface ImageIssue {
    slug: string;
    issue: 'missing' | 'oversized' | 'non-webp';
    details: string;
}

function main() {
    console.log('🖼️ Image Health Checker\n');

    const issues: ImageIssue[] = [];
    let totalImages = 0;
    let totalSizeBytes = 0;

    // Get all blog files
    const blogFiles = fs.existsSync(BLOG_DIR) 
        ? fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))
        : [];
    
    // Get all actual image files
    const imageFiles = fs.existsSync(IMAGE_DIR)
        ? new Set(fs.readdirSync(IMAGE_DIR))
        : new Set<string>();

    for (const file of blogFiles) {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        
        // Check for heroImage in frontmatter
        const heroMatch = content.match(/heroImage:\s*["']?([^"'\n]+)["']?/);
        if (heroMatch) {
            const heroPath = heroMatch[1].replace(/^\//, '');
            const imageName = path.basename(heroPath);
            
            if (!imageFiles.has(imageName)) {
                issues.push({
                    slug,
                    issue: 'missing',
                    details: `Hero image not found: ${imageName}`,
                });
            } else {
                const fullPath = path.join(IMAGE_DIR, imageName);
                const sizeBytes = fs.statSync(fullPath).size;
                totalSizeBytes += sizeBytes;
                totalImages++;
                const sizeKB = Math.round(sizeBytes / 1024);
                
                if (sizeKB > SIZE_CRITICAL_KB) {
                    issues.push({
                        slug,
                        issue: 'oversized',
                        details: `${imageName}: ${sizeKB} KB (CRITICAL — over ${SIZE_CRITICAL_KB} KB)`,
                    });
                } else if (sizeKB > SIZE_WARN_KB) {
                    issues.push({
                        slug,
                        issue: 'oversized',
                        details: `${imageName}: ${sizeKB} KB (over ${SIZE_WARN_KB} KB)`,
                    });
                }

                if (!imageName.endsWith('.webp')) {
                    issues.push({
                        slug,
                        issue: 'non-webp',
                        details: `${imageName} — converting to WebP would save ~60% bandwidth`,
                    });
                }
            }
        }
    }

    // Report
    console.log('═'.repeat(60));
    console.log('🖼️ IMAGE HEALTH REPORT');
    console.log('═'.repeat(60));
    console.log(`  📊 Total images scanned: ${totalImages}`);
    console.log(`  💾 Total image size: ${Math.round(totalSizeBytes / 1024 / 1024)} MB`);
    
    const missing = issues.filter(i => i.issue === 'missing');
    const oversized = issues.filter(i => i.issue === 'oversized');
    const nonWebp = issues.filter(i => i.issue === 'non-webp');

    console.log(`  ❌ Missing: ${missing.length}`);
    console.log(`  ⚠️ Oversized: ${oversized.length}`);
    console.log(`  🔄 Non-WebP: ${nonWebp.length}`);

    if (missing.length > 0) {
        console.log('\n  💀 MISSING IMAGES:');
        missing.forEach(i => console.log(`     ❌ ${i.slug}: ${i.details}`));
    }

    if (oversized.length > 0) {
        console.log('\n  📦 OVERSIZED IMAGES:');
        oversized.forEach(i => console.log(`     ⚠️ ${i.slug}: ${i.details}`));
    }

    // Save report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(
        path.join(REPORTS_DIR, 'image-health.json'),
        JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            totalImages,
            totalSizeMB: Math.round(totalSizeBytes / 1024 / 1024),
            issues: { missing: missing.length, oversized: oversized.length, nonWebp: nonWebp.length },
            details: issues,
        }, null, 2)
    );

    console.log('\n✨ Image health check complete!\n');
}

main();

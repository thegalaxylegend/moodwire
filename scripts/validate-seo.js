import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, '../public/seo-manifest.json');
const registryPath = path.join(__dirname, '../public/slug-registry.json');
const indexNowKeyPath = path.join(__dirname, '../public/3154aa701b2948b49c70693382a1ad76.txt');

async function validateSEOIdentity() {
    console.log('🔒 EXAM COMPASS: STRICT SEO IDENTITY LOCK ACTIVE');

    if (!fs.existsSync(manifestPath) || !fs.existsSync(registryPath)) {
        console.error('🛑 CRITICAL FAIL: SEO Manifest or Registry missing! Identity cannot be verified.');
        process.exit(1);
    }

    let errors = [];
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    const routes = Object.keys(manifest);
    const routeCount = routes.length;

    // 0. IndexNow Identity Lock
    if (!fs.existsSync(indexNowKeyPath)) {
        errors.push('🛑 INDEXNOW VIOLATION: Verification key file missing in public/ (Expected 3154aa701b2948b49c70693382a1ad76.txt).');
    } else {
        const keyVal = fs.readFileSync(indexNowKeyPath, 'utf8').trim();
        if (keyVal !== '3154aa701b2948b49c70693382a1ad76') {
            errors.push('🛑 INDEXNOW VIOLATION: Key content mismatch in verification file.');
        }
    }

    // 1. Route Count Protection
    // Rule: Route count must never decrease without approval
    const MIN_ROUTES = 2740;
    if (routeCount < MIN_ROUTES) {
        errors.push(`🛑 IDENTITY VIOLATION: Route count decreased to ${routeCount} (Expected >= ${MIN_ROUTES}). Approval Required.`);
    }

    // 2. Metadata Integrity & Fail-Fast Policy
    routes.forEach(url => {
        const entry = manifest[url];

        // Title Length check
        if (!entry.title || entry.title.length < 5) {
            errors.push(`🚩 FAIL-FAST: [${url}] Title is missing or too short (${entry.title?.length || 0} chars).`);
        }

        // Description check
        if (!entry.description || entry.description.length < 50) {
            errors.push(`🚩 FAIL-FAST: [${url}] Meta Description is missing or too short.`);
        }

        // Canonical Structure check
        if (entry.type === 'topic' && (!entry.subject || !entry.exam)) {
            errors.push(`🚩 FAIL-FAST: [${url}] Topic missing its parent subjects/exams link.`);
        }

        // Slug Integrity (Verify URL structure)
        const parts = url.split('/').filter(Boolean);
        if (parts.some(p => p !== p.toLowerCase() || p.includes(' '))) {
            errors.push(`🛑 SLUG VIOLATION: [${url}] contains non-slugified characters.`);
        }
    });

    // 3. Determinism Check (Manifest vs Registry Sync)
    const registryUrls = Object.values(registry);
    if (registryUrls.length !== routeCount) {
        errors.push(`🛑 REGISTRY MISMATCH: Registry (${registryUrls.length}) and Manifest (${routeCount}) are out of sync.`);
    }

    if (errors.length > 0) {
        console.error('\n❌ SEO IDENTITY VALIDATION FAILED:');
        errors.forEach(err => console.error(err));
        console.error('\n⚠️ ACTION REQUIRED: SEO Stability Rules violated. No auto-optimization allowed.');
        console.error('Review the changes manually and explicitly re-run the manifest generator if intended.\n');
        process.exit(1);
    }

    console.log(`✅ SEO Identity Locked. Verified ${routeCount} routes for stability.`);
}

validateSEOIdentity();

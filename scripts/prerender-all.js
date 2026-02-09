
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function prerender() {
    console.log('🏗️  Starting Full SSG Prerendering (2,800+ routes)...');

    const manifestPath = path.join(__dirname, '../public/seo-manifest.json');
    const templatePath = path.join(__dirname, '../dist/index.html');
    const ssrEntryPath = path.join(__dirname, '../dist/server/entry-server.js');
    const outDir = path.join(__dirname, '../dist');

    if (!fs.existsSync(ssrEntryPath)) {
        console.error('❌ SSR Bundle not found. Run npm run build:ssr first.');
        process.exit(1);
    }

    const { render } = await import(pathToFileURL(ssrEntryPath).href);
    const template = fs.readFileSync(templatePath, 'utf8');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const routes = Object.keys(manifest);

    // Also add the home page
    if (!routes.includes('/')) routes.unshift('/');

    for (const url of routes) {
        try {
            const helmetContext = {};
            const appHtml = render(url, helmetContext);
            const { helmet } = helmetContext;

            if (url === '/') {
                console.log('DEBUG: Helmet Context for /', {
                    title: helmet.title.toString(),
                    meta: helmet.meta.toString().substring(0, 100)
                });
            }

            // Extract SEO tags from Helmet
            const headTags = `
                ${helmet.title.toString()}
                ${helmet.meta.toString()}
                ${helmet.link.toString()}
                ${helmet.script.toString()}
            `.trim();

            const html = template
                .replace(`<!--app-html-->`, appHtml)
                .replace(`<!--app-head-->`, headTags);

            // Determine output path
            const filePath = url === '/'
                ? 'index.html'
                : `${url.startsWith('/') ? url.slice(1) : url}/index.html`;

            const targetPath = path.join(outDir, filePath);
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, html);

            // console.log(`✓ Generated ${url}`);
        } catch (err) {
            console.error(`❌ Failed to render ${url}:`, err.message);
        }
    }

    console.log(`✅ SSG Complete! ${routes.length} pages statically rendered.`);
}

prerender();

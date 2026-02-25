import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function prerender() {
    console.log('🏗️  Starting Strict SSG Prerendering process...');

    const manifestPath = path.join(__dirname, '../public/seo-manifest.json');
    const questionDbPath = path.join(__dirname, '../public/question-db.json');
    const templatePath = path.join(__dirname, '../dist/index.html');
    const ssrEntryPath = path.join(__dirname, '../dist/server/entry-server.js');
    const outDir = path.join(__dirname, '../dist');

    // 1. Validation
    if (!fs.existsSync(ssrEntryPath)) {
        console.error('❌ SSR Bundle not found. Run npm run build:ssr first.');
        process.exit(1);
    }
    if (!fs.existsSync(manifestPath)) {
        console.error('❌ Manifest not found.');
        process.exit(1);
    }

    // 2. Load Resources
    const { render } = await import(pathToFileURL(ssrEntryPath).href);
    const template = fs.readFileSync(templatePath, 'utf8');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    let questionDb = {};
    if (fs.existsSync(questionDbPath)) {
        questionDb = JSON.parse(fs.readFileSync(questionDbPath, 'utf8'));
    }

    const routes = Object.keys(manifest);
    // Ensure home is there
    if (!routes.includes('/')) routes.unshift('/');

    console.log(`Goals: ${routes.length} pages to render.`);
    console.log(`QuestionDB Size: ${Object.keys(questionDb).length}`);

    // 3. Batch Processing
    const BATCH_SIZE = 50;
    let successCount = 0;
    let failureCount = 0;
    let verifiedQuestions = 0;

    for (let i = 0; i < routes.length; i += BATCH_SIZE) {
        const batch = routes.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} urls)...`);

        await Promise.all(batch.map(async (url) => {
            try {
                // INJECT GLOBAL DATA

                if (questionDb[url]) {
                    globalThis.SEO_QUESTION_DATA = questionDb[url];
                } else {
                    globalThis.SEO_QUESTION_DATA = null;
                }

                // 2. For Topic Pages (Inject Sample Questions)
                const isTopicPage = manifest[url]?.type === 'topic';
                if (isTopicPage) {
                    const topicName = manifest[url].h1; // We stored topic name in h1
                    // Filter questions that match this topic
                    const relatedQuestions = Object.values(questionDb).filter((q) => {
                        // Loose matching: slugify both
                        const qTopic = (q.topic || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        const pTopic = topicName.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return qTopic === pTopic || qTopic.includes(pTopic) || pTopic.includes(qTopic);
                    }).slice(0, 15); // Take top 15

                    globalThis.SEO_TOPIC_DATA = relatedQuestions.map(q => ({
                        id: q.id,
                        slug: q.slug,
                        text: q.text,
                        sourceYear: q.sourceYear
                    }));
                } else {
                    globalThis.SEO_TOPIC_DATA = [];
                }

                const helmetContext = {};

                // RENDER
                const appHtml = render(url, helmetContext);
                const { helmet } = helmetContext;

                // CLEANUP global to prevent leaks
                globalThis.SEO_QUESTION_DATA = null;

                // Extract tags
                const headTags = `
                    ${helmet.title.toString()}
                    ${helmet.meta.toString()}
                    ${helmet.link.toString()}
                    ${helmet.script.toString()}
                `.trim();

                const html = template
                    .replace(/<!--app-html-->[\s\S]*?<!--app-html-end-->/, appHtml)
                    .replace(`<!--app-head-->`, headTags);

                // Verification logic
                if (url.includes('/q/')) {
                    if (!html.includes('<h1') && !html.includes('<H1')) {
                        const hadData = !!questionDb[url];
                        console.warn(`⚠️ Warning: Question Page ${url} rendered without H1 tag. Data present: ${hadData}`);
                    }
                    if (!html.includes('schema.org')) {
                        console.warn(`⚠️  Warning: ${url} missing Schema.`);
                    }
                    verifiedQuestions++;
                }

                // Write file
                const filePath = url === '/'
                    ? 'index.html'
                    : `${url.startsWith('/') ? url.slice(1) : url}/index.html`;

                const targetPath = path.join(outDir, filePath);
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                fs.writeFileSync(targetPath, html);

                successCount++;
            } catch (err) {
                console.error(`❌ Failed: ${url} -> ${err.message}`);
                failureCount++;
            }

        }));
    }

    console.log('------------------------------------------------');
    console.log(`✅ SSG Complete.`);
    console.log(`   - Success: ${successCount}`);
    console.log(`   - Verified Questions: ${verifiedQuestions}`);

    if (failureCount > 0) {
        console.error(`❌ Complete with failures.`);
        process.exit(1);
    }
}

prerender();

// Mock browser globals for SSR-hostile libraries (like pdfjs-dist, html2canvas, react-dom) when inlined in entry-server
globalThis.DOMMatrix = globalThis.DOMMatrix || class DOMMatrix {};
globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || ((cb) => setTimeout(cb, 0));
globalThis.cancelAnimationFrame = globalThis.cancelAnimationFrame || ((id) => clearTimeout(id));
globalThis.CustomEvent = globalThis.CustomEvent || class CustomEvent { constructor(type) { this.type = type; } };
try {
  if (typeof globalThis.navigator === 'undefined') {
    Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node', maxTouchPoints: 0 }, writable: true, configurable: true });
  }
} catch (e) {}
globalThis.CSS = globalThis.CSS || { supports: () => false };
globalThis.HTMLElement = globalThis.HTMLElement || class HTMLElement {};
globalThis.SVGElement = globalThis.SVGElement || class SVGElement {};

const dummyElement = {
  setAttribute: () => {},
  removeAttribute: () => {},
  getAttribute: () => null,
  style: {},
  appendChild: () => dummyElement,
  removeChild: () => {},
  insertBefore: () => {},
  firstChild: null,
  childNodes: [],
  nodeType: 1,
  tagName: 'DIV',
  getElementsByTagName: () => [],
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {}
};
globalThis.document = globalThis.document || {
  createElement: () => dummyElement,
  createTextNode: () => ({}),
  createComment: () => ({}),
  createDocumentFragment: () => ({
    appendChild: () => {},
    childNodes: []
  }),
  documentElement: dummyElement,
  body: dummyElement,
  head: dummyElement,
  getElementsByTagName: () => [],
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  importNode: () => dummyElement
};
const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0
};
globalThis.localStorage = globalThis.localStorage || dummyStorage;
globalThis.sessionStorage = globalThis.sessionStorage || dummyStorage;
globalThis.window = globalThis.window || {};
globalThis.window.__PRERENDER__ = true;
globalThis.window.document = globalThis.window.document || globalThis.document;
globalThis.window.DOMMatrix = globalThis.window.DOMMatrix || globalThis.DOMMatrix;
globalThis.window.location = globalThis.window.location || { href: 'http://localhost/' };
globalThis.window.addEventListener = globalThis.window.addEventListener || (() => {});
globalThis.window.removeEventListener = globalThis.window.removeEventListener || (() => {});
globalThis.window.navigator = globalThis.window.navigator || globalThis.navigator || { maxTouchPoints: 0 };
globalThis.window.requestAnimationFrame = globalThis.window.requestAnimationFrame || globalThis.requestAnimationFrame;
globalThis.window.cancelAnimationFrame = globalThis.window.cancelAnimationFrame || globalThis.cancelAnimationFrame;
globalThis.window.scrollTo = globalThis.window.scrollTo || (() => {});
globalThis.window.scroll = globalThis.window.scroll || (() => {});
globalThis.window.scrollBy = globalThis.window.scrollBy || (() => {});
globalThis.window.history = globalThis.window.history || { pushState: () => {}, replaceState: () => {}, state: null };
globalThis.window.CustomEvent = globalThis.window.CustomEvent || globalThis.CustomEvent;
globalThis.window.CSS = globalThis.window.CSS || globalThis.CSS;
globalThis.window.HTMLElement = globalThis.window.HTMLElement || globalThis.HTMLElement;
globalThis.window.SVGElement = globalThis.window.SVGElement || globalThis.SVGElement;
globalThis.window.matchMedia = globalThis.window.matchMedia || (() => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}));

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
    const schemaDataPath = path.join(__dirname, '../public/schema-data.json');

    let schemaData = {};
    if (fs.existsSync(schemaDataPath)) {
        schemaData = JSON.parse(fs.readFileSync(schemaDataPath, 'utf8'));
        console.log(`📋 Schema Data loaded: ${Object.keys(schemaData).length} blog schemas.`);
    }

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
    
    // Parse SYLLABUS_DATA from constants.ts for class filtering
    const constantsPath = path.join(__dirname, '../src/lib/constants.ts');
    const SYLLABUS_DATA = {};
    if (fs.existsSync(constantsPath)) {
        const content = fs.readFileSync(constantsPath, 'utf8');
        const subjectRegex = /^\s*(?:['"]?)([\w\s]+)(?:['"]?):\s*\[/gm;
        let match;
        const subjects = [];
        while ((match = subjectRegex.exec(content)) !== null) {
            subjects.push({ name: match[1].trim(), start: match.index });
        }
        for (let i = 0; i < subjects.length; i++) {
            const subject = subjects[i];
            const nextStart = subjects[i + 1] ? subjects[i + 1].start : content.length;
            const block = content.substring(subject.start, nextStart);
            const topics = [];
            const objBlocks = [...block.matchAll(/{[\s\S]*?}/g)].map(m => m[0]);
            objBlocks.forEach(objStr => {
                const topicNameMatch = objStr.match(/topic:\s*(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')/);
                const classMatch = objStr.match(/class:\s*(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)')/);
                if (topicNameMatch) {
                    const topic = (topicNameMatch[1] || topicNameMatch[2] || '').replace(/\\"/g, '"').replace(/\\'/g, "'");
                    const cls = classMatch ? (classMatch[1] || classMatch[2] || '').replace(/Class\s*/i, '').trim() : '';
                    topics.push({ topic, class: cls });
                }
            });
            SYLLABUS_DATA[subject.name] = topics;
        }
    }
    
    const topicContentDbPath = path.join(__dirname, '../public/topic-content-db.json');
    let topicContentDb = {};
    if (fs.existsSync(topicContentDbPath)) {
        topicContentDb = JSON.parse(fs.readFileSync(topicContentDbPath, 'utf8'));
    }

    const allRoutes = Object.keys(manifest);
    // Ensure home is there
    if (!allRoutes.includes('/')) allRoutes.unshift('/');

    // CRITICAL: Only prerender indexable pages to stay under Cloudflare's 20,000 file limit.
    // Noindex pages (questions without explanations) don't need static HTML — they're
    // handled by the SPA at runtime. This prevents deployment truncation.
    let routes = allRoutes.filter(url => {
        const meta = manifest[url];
        if (!meta) return true; // Home route etc.
        // Always prerender non-question pages (exam, topic, blog, etc.)
        if (meta.type !== 'question') return true;
        // Only prerender question pages that are indexable
        return meta.robots && meta.robots.includes('index') && !meta.robots.includes('noindex');
    });

    const skippedCount = allRoutes.length - routes.length;

    const partArg = process.argv.find(arg => arg.startsWith('--part='));
    const totalPartsArg = process.argv.find(arg => arg.startsWith('--total-parts='));
    if (partArg && totalPartsArg) {
        const part = parseInt(partArg.split('=')[1], 10);
        const totalParts = parseInt(totalPartsArg.split('=')[1], 10);
        const routesPerPart = Math.ceil(routes.length / totalParts);
        const startIdx = part * routesPerPart;
        const endIdx = Math.min(startIdx + routesPerPart, routes.length);
        routes = routes.slice(startIdx, endIdx);
        console.log(`📌 Partition active: Part ${part + 1}/${totalParts} (Rendering URLs ${startIdx} to ${endIdx - 1})`);
    }

    console.log(`Goals: ${routes.length} pages to prerender (skipped ${skippedCount} noindex pages).`);
    console.log(`QuestionDB Size: ${Object.keys(questionDb).length}`);

    // 3. Batch Processing
    const BATCH_SIZE = 50;
    let successCount = 0;
    let failureCount = 0;
    let verifiedQuestions = 0;

    for (let i = 0; i < routes.length; i += BATCH_SIZE) {
        const batch = routes.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} urls)...`);

        // Use sequential processing within the batch to avoid globalThis race conditions
        for (const url of batch) {
            const cleanPath = url.replace(/\/+$/, '').replace(/^\/+/, '');
            const filePath = cleanPath === ''
                ? 'index.html'
                : path.join(cleanPath, 'index.html');
            const targetPath = path.join(outDir, filePath);
            if (fs.existsSync(targetPath) && url !== '/') {
                successCount++;
                continue;
            }
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
                    const [, examSlug] = url.split('/');
                    const topicName = manifest[url].h1; // We stored topic name in h1
                    const realSubject = manifest[url].subject;

                    // Resolve this page's topic class context
                    const topicList = SYLLABUS_DATA[realSubject] || [];
                    const matchedSyllabusTopic = topicList.find(t => {
                        const qTopicClean = topicName.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                        const sTopicClean = t.topic.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                        if (qTopicClean !== sTopicClean) return false;
                        
                        if (t.class) {
                            const examClassNum = examSlug.replace('class-', '');
                            const isJeeNeet = examSlug === 'jee-mains' || examSlug === 'jee-advanced' || examSlug === 'neet';
                            if (isJeeNeet) {
                                return t.class === '11' || t.class === '12';
                            } else {
                                return t.class === examClassNum;
                            }
                        }
                        return true;
                    });
                    const topicClass = matchedSyllabusTopic ? matchedSyllabusTopic.class : '';

                    const relatedQuestions = Object.values(questionDb).filter((q) => {
                        if (!q.topic) return false;
                        const expectedQUrl = `/${examSlug}/q/${q.slug}`;
                        if (!questionDb[expectedQUrl]) return false;

                        // Strict Subject Filter (Prevent cross-subject pollution)
                        if (realSubject && q.subject) {
                            const qSub = q.subject.toLowerCase();
                            const subName = realSubject.toLowerCase();
                            const isSubjectMatch = qSub === subName || 
                                (qSub.includes(subName) && !(subName === 'science' && qSub.includes('social science'))) || 
                                (subName.includes(qSub) && !(qSub === 'science' && subName.includes('social science')));
                            if (!isSubjectMatch) return false;
                        }

                        // Class Filter: prevent Class 12 questions from appearing on Class 10 topic page
                        if (topicClass) {
                            const qTopicList = SYLLABUS_DATA[q.subject] || [];
                            const qSyllabusTopic = qTopicList.find(t => {
                                const qTopicClean = (q.topic || '').toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                                const sTopicClean = t.topic.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                                if (qTopicClean !== sTopicClean) return false;
                                
                                if (t.class && q.canonicalExam) {
                                    const examClassNum = q.canonicalExam.replace('class-', '');
                                    const isJeeNeet = q.canonicalExam === 'jee-mains' || q.canonicalExam === 'jee-advanced' || q.canonicalExam === 'neet';
                                    if (isJeeNeet) {
                                        return t.class === '11' || t.class === '12';
                                    } else {
                                        return t.class === examClassNum;
                                    }
                                }
                                return true;
                            });
                            const qClass = qSyllabusTopic ? qSyllabusTopic.class : '';
                            if (!qSyllabusTopic || (qClass && qClass !== topicClass)) return false;
                        }

                        if (!q.topic || !q.topic.trim()) return false;
                        const qTopic = q.topic.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                        const pTopic = topicName.toLowerCase().replace(/\[.*?\]\s*/g, '').replace(/[^a-z0-9]/g, '');
                        return qTopic === pTopic;
                    }).slice(0, 15);

                    globalThis.SEO_TOPIC_DATA = relatedQuestions.map(q => ({
                        id: q.id,
                        slug: q.slug,
                        text: q.text,
                        sourceYear: q.sourceYear
                    }));

                    const cleanTopicSlug = url.split('/').pop().replace(/[^a-z0-9-]/g, '');
                    globalThis.SEO_TOPIC_CONTENT = topicContentDb[cleanTopicSlug] || null;
                } else {
                    globalThis.SEO_TOPIC_DATA = [];
                    globalThis.SEO_TOPIC_CONTENT = null;
                }

                // 2.1 For Collection Pages (Inject Top 50 questions)
                const isCollectionPage = manifest[url]?.type === 'collection';
                if (isCollectionPage) {
                    const parts = url.split('/').filter(Boolean); // e.g. ['jee-mains', 'physics', 'motion-in-a-plane', 'top-50-pyqs']
                    const examSlug = parts[0];
                    const subjectSlug = parts[1];
                    const topicSlug = parts[2];

                    const slugifyLocal = (text) => {
                        return text
                            .toString()
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]+/g, '')
                            .replace(/--+/g, '-');
                    };

                    const matched = Object.values(questionDb).filter((q) => 
                        q.canonicalExam === examSlug && 
                        slugifyLocal(q.subject || '') === subjectSlug && 
                        slugifyLocal(q.topic || '') === topicSlug
                    );
                    const sorted = matched.sort((a, b) => (parseInt(b.sourceYear) || 0) - (parseInt(a.sourceYear) || 0));
                    const top50 = sorted.slice(0, 50);

                    globalThis.SEO_COLLECTION_DATA = { questions: top50 };
                } else {
                    globalThis.SEO_COLLECTION_DATA = null;
                }

                // 3. For Blog Pages (Inject Blog Metadata + FULL Markdown Content)
                if (url.startsWith('/blog/') && url !== '/blog') {
                    const slug = url.split('/').filter(Boolean).pop();
                    // Inject metadata from manifest
                    if (manifest[url]) {
                        globalThis.SEO_BLOG_DATA = {
                            title: manifest[url].title,
                            description: manifest[url].description,
                            date: manifest[url].date || new Date().toISOString().split('T')[0],
                            category: manifest[url].category || 'Exam Prep',
                            id: slug
                        };
                    }
                    // CRITICAL SEO FIX: Inject full markdown body so it renders in static HTML
                    const mdPath = path.join(__dirname, `../src/content/blogs/${slug}.md`);
                    if (fs.existsSync(mdPath)) {
                        const rawMd = fs.readFileSync(mdPath, 'utf8');
                        // Strip frontmatter (---...---), HTML comments, and first H1
                        let body = rawMd.replace(/---[\s\S]*?---/, '').trim();
                        body = body.replace(/<!--[\s\S]*?-->/g, '');
                        body = body.replace(/^#[^\n]*\n+/m, '');
                        globalThis.SEO_BLOG_CONTENT = body.trim();
                    } else {
                        globalThis.SEO_BLOG_CONTENT = null;
                    }
                } else {
                    globalThis.SEO_BLOG_DATA = null;
                    globalThis.SEO_BLOG_CONTENT = null;
                }

                function generateSeoHeadTags(url, meta, siteUrl = 'https://examcompass.pages.dev', siteName = 'Exam Compass') {
                    if (!meta) return '';

                    const title = meta.title || siteName;
                    const description = meta.description || '';
                    
                    // Title Suffix Logic
                    let fullTitle = title;
                    if (!title.includes('|') && !title.includes('-')) {
                        if (title.length < 45) {
                            fullTitle = `${title} | ${siteName}`;
                        } else if (title.length < 55) {
                            fullTitle = `${title} - EC`;
                        }
                    }

                    // Canonical Url
                    const path = url.replace(/\/$/, '') || '/';
                    const canonicalUrl = `${siteUrl}${path}`;

                    // Image Url
                    const encodedTitle = encodeURIComponent(fullTitle);
                    const encodedSub = encodeURIComponent(siteUrl.replace('https://', ''));
                    const imageUrl = meta.image || `${siteUrl}/api/og?title=${encodedTitle}&sub=${encodedSub}`;

                    // Robots
                    const robots = meta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

                    // Compile tags
                    const tags = [
                        `<!-- SEO Manifest Injected Tags -->`,
                        `<title>${fullTitle}</title>`,
                        `<meta name="title" content="${fullTitle}" data-rh="true" />`,
                        `<meta name="description" content="${description}" data-rh="true" />`,
                        `<link rel="canonical" href="${canonicalUrl}" data-rh="true" />`,
                        `<link rel="alternate" hrefLang="en-IN" href="${canonicalUrl}" data-rh="true" />`,
                        `<link rel="alternate" hrefLang="en" href="${canonicalUrl}" data-rh="true" />`,
                        `<meta name="robots" content="${robots}" data-rh="true" />`,
                        `<meta name="bingbot" content="${robots}" data-rh="true" />`,
                        
                        `<meta property="og:type" content="${meta.type === 'blog-post' ? 'article' : 'website'}" data-rh="true" />`,
                        `<meta property="og:title" content="${fullTitle}" data-rh="true" />`,
                        `<meta property="og:description" content="${description}" data-rh="true" />`,
                        `<meta property="og:image" content="${imageUrl}" data-rh="true" />`,
                        `<meta property="og:image:width" content="1200" data-rh="true" />`,
                        `<meta property="og:image:height" content="630" data-rh="true" />`,
                        `<meta property="og:image:alt" content="${fullTitle}" data-rh="true" />`,
                        `<meta property="og:url" content="${canonicalUrl}" data-rh="true" />`,
                        `<meta property="og:site_name" content="${siteName}" data-rh="true" />`,
                        `<meta property="og:locale" content="en_IN" data-rh="true" />`,
                        
                        `<meta name="twitter:card" content="summary_large_image" data-rh="true" />`,
                        `<meta name="twitter:site" content="@examcompass_ai" data-rh="true" />`,
                        `<meta name="twitter:creator" content="@thegalaxylegend" data-rh="true" />`,
                        `<meta name="twitter:title" content="${fullTitle}" data-rh="true" />`,
                        `<meta name="twitter:description" content="${description}" data-rh="true" />`,
                        `<meta name="twitter:image" content="${imageUrl}" data-rh="true" />`,
                        `<meta name="twitter:image:alt" content="${fullTitle}" data-rh="true" />`,
                        
                        `<meta name="seo-status" content="active" data-rh="true" />`
                    ];

                    if (meta.keywords) {
                        tags.push(`<meta name="keywords" content="${meta.keywords}" data-rh="true" />`);
                    }
                    if (meta.date) {
                        tags.push(`<meta property="article:published_time" content="${meta.date}" data-rh="true" />`);
                        tags.push(`<meta property="article:modified_time" content="${meta.date}" data-rh="true" />`);
                    }

                    return tags.join('\n');
                }

                const helmetContext = {};

                // RENDER - render function returns a string
                console.log(`🚀 [SSR] Rendering ${url}...`);
                const appHtml = await render(url, helmetContext);

                // Extract Helmet Metadata
                const { helmet } = helmetContext;
                let headTags = helmet ? [
                    helmet.title.toString(),
                    helmet.meta.toString(),
                    helmet.link.toString(),
                    helmet.script.toString()
                ].join('\n') : '';

                // Fallback tag generation if helmet returned empty or null tags
                if (!headTags || !headTags.includes('<title>') || !headTags.includes('description')) {
                    const metaEntry = manifest[url];
                    if (metaEntry) {
                        console.log(`  📝 Injected SEO manifest head tags for ${url}`);
                        headTags = generateSeoHeadTags(url, metaEntry) + '\n' + headTags;
                    }
                }

                // HYDRATION & TEMPLATE INJECTION
                // Serialize global data to window so the client can pick it up without a network request
                let dataScript = '';
                if (globalThis.SEO_QUESTION_DATA) dataScript += `window.SEO_QUESTION_DATA = ${JSON.stringify(globalThis.SEO_QUESTION_DATA).replace(/</g, '\\u003c')};\n`;
                if (globalThis.SEO_TOPIC_DATA && globalThis.SEO_TOPIC_DATA.length > 0) dataScript += `window.SEO_TOPIC_DATA = ${JSON.stringify(globalThis.SEO_TOPIC_DATA).replace(/</g, '\\u003c')};\n`;
                if (globalThis.SEO_TOPIC_CONTENT) dataScript += `window.SEO_TOPIC_CONTENT = ${JSON.stringify(globalThis.SEO_TOPIC_CONTENT).replace(/</g, '\\u003c')};\n`;
                if (globalThis.SEO_BLOG_DATA) dataScript += `window.SEO_BLOG_DATA = ${JSON.stringify(globalThis.SEO_BLOG_DATA).replace(/</g, '\\u003c')};\n`;
                if (globalThis.SEO_BLOG_CONTENT) dataScript += `window.SEO_BLOG_CONTENT = ${JSON.stringify(globalThis.SEO_BLOG_CONTENT).replace(/</g, '\\u003c')};\n`;
                if (globalThis.SEO_COLLECTION_DATA) dataScript += `window.SEO_COLLECTION_DATA = ${JSON.stringify(globalThis.SEO_COLLECTION_DATA).replace(/</g, '\\u003c')};\n`;

                const scriptTag = dataScript ? `<script>\n${dataScript}</script>\n` : '';

                // Clean default SEO tags from template to avoid duplicates
                let cleanedTemplate = template;
                cleanedTemplate = cleanedTemplate.replace(/<title>[\s\S]*?<\/title>/gi, '');
                cleanedTemplate = cleanedTemplate.replace(/<meta\s+name=["'](description|robots|title)["']\s+content=["'][\s\S]*?["']\s*\/?>/gi, '');
                cleanedTemplate = cleanedTemplate.replace(/<meta\s+property=["']og:(image|title|description|type|site_name|url|locale)["']\s+content=["'][\s\S]*?["']\s*\/?>/gi, '');
                cleanedTemplate = cleanedTemplate.replace(/<meta\s+name=["']twitter:(card|site|creator|title|description|image|image:alt)["']\s+content=["'][\s\S]*?["']\s*\/?>/gi, '');

                // Replace head placeholder and replace entire boot-shell skeleton with prerendered content
                let html = cleanedTemplate
                    .replace('</head>', headTags + '\n' + scriptTag + '\n</head>')
                    .replace(/(<div id="root"[^>]*>)[\s\S]*?(<\/div>\s*<!-- SEO:)/, `$1\n${appHtml}\n$2`);

                // SCHEMA INJECTION: Inject JSON-LD structured data for blog pages
                if (url.startsWith('/blog/') && url !== '/blog' && schemaData[url]) {
                    const schemas = schemaData[url];
                    const schemaTags = schemas.map(s => 
                        `<script type="application/ld+json">${JSON.stringify(s)}</script>`
                    ).join('\n');
                    html = html.replace('</head>', `${schemaTags}\n</head>`);
                }

                // SSR Fallback Injection for Question Pages
                if (url.includes('/q/') && questionDb[url]) {
                    const qData = questionDb[url];
                    let patched = false;

                    // 1. H1 Fallback: Inject if React SSR missed it
                    if (!html.includes('<h1') && !html.includes('<H1')) {
                        const h1Tag = `<h1 class="text-xl md:text-3xl font-bold mb-8 leading-relaxed">${qData.text || 'Practice Question'}</h1>`;
                        // Inject after the first <article> or <section> or <main> tag
                        if (html.includes('<article')) {
                            html = html.replace(/(<article[^>]*>)/, `$1\n${h1Tag}`);
                        } else if (html.includes('<section')) {
                            html = html.replace(/(<section[^>]*>)/, `$1\n${h1Tag}`);
                        } else if (html.includes('<main')) {
                            html = html.replace(/(<main[^>]*>)/, `$1\n${h1Tag}`);
                        } else {
                            // Last resort: inject after opening <div id="root">
                            html = html.replace(/(<div id="root"[^>]*>)/, `$1\n${h1Tag}`);
                        }
                        patched = true;
                        console.log(`  🩹 Injected H1 fallback for ${url}`);
                    }

                    // 2. Schema Fallback: Inject Quiz + FAQPage JSON-LD if React Helmet missed it
                    if (!html.includes('schema.org')) {
                        const correctAnswerText = Array.isArray(qData.options)
                            ? (qData.options[qData.correctAnswer] || 'See Solution')
                            : (Object.values(qData.options || {})[qData.correctAnswer] || 'See Solution');
                        const examName = url.split('/')[1]?.toUpperCase().replace(/-/g, ' ') || 'EXAM';

                        const schemaJson = JSON.stringify({
                            "@context": "https://schema.org",
                            "@graph": [
                                {
                                    "@type": "Quiz",
                                    "name": `${qData.topic || 'Practice'} | ${examName}`,
                                    "educationLevel": "High School",
                                    "hasPart": {
                                        "@type": "Question",
                                        "name": qData.text,
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": correctAnswerText
                                        }
                                    }
                                },
                                {
                                    "@type": "FAQPage",
                                    "mainEntity": [{
                                        "@type": "Question",
                                        "name": qData.text,
                                        "acceptedAnswer": {
                                            "@type": "Answer",
                                            "text": `The correct answer is ${correctAnswerText}. ${qData.explanation || ''}`
                                        }
                                    }]
                                }
                            ]
                        });
                        const schemaTag = `<script type="application/ld+json">${schemaJson}</script>`;
                        html = html.replace('</head>', `${schemaTag}\n</head>`);
                        patched = true;
                        console.log(`  🩹 Injected Schema fallback for ${url}`);
                    }

                    if (!patched) {
                        console.log(`  ✅ Question page ${url} rendered correctly by React SSR.`);
                    }
                    verifiedQuestions++;
                }

                // Write file: Use directory/index.html structure for pretty URLs and Cloudflare compatibility
                const cleanPath = url.replace(/\/+$/, '').replace(/^\/+/, '');
                const filePath = cleanPath === ''
                    ? 'index.html'
                    : path.join(cleanPath, 'index.html');

                const targetPath = path.join(outDir, filePath);
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                fs.writeFileSync(targetPath, html);

                successCount++;
            } catch (err) {
                console.error(`❌ Failed: ${url} -> ${err.message}`);
                failureCount++;
            }
        }
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

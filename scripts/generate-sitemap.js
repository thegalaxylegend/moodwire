
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mocking the DB import since we can't easily import TS in a simple Node script without setup.
// In a real automated CI/CD, we would use ts-node.
// For now, I will duplicate the structure logic or try to read the file.
// Actually, to be "World Class" and maintainable, I should try to read the constants file or just hardcode the exams and use the file reading to get topics.

// Let's try a robust approach: Regex parse the constants file to get keys. 
// This avoids TS compilation issues in a simple script.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONSTANTS_PATH = path.join(PROJECT_ROOT, 'src', 'lib', 'constants.ts');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_PATH = path.join(PUBLIC_DIR, 'robots.txt');

const BASE_URL = 'https://examcompass.web.app';

// Exams we support (Manual list as these are top-level routes)
const EXAMS = [
    'jee-mains', 'neet-ug', 'upsc', 'bitsat', 'gate', 'clat',
    'class-6', 'class-7', 'class-8', 'class-9', 'class-10', 'class-11', 'class-12'
];

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

async function generateSitemap() {
    console.log('🚀 Starting Automated SEO Generation...');

    let urls = [];

    // 1. Static Routes
    urls.push({ loc: '/', priority: 1.0, changefreq: 'daily' });
    urls.push({ loc: '/login', priority: 0.8, changefreq: 'monthly' });
    urls.push({ loc: '/signup', priority: 0.8, changefreq: 'monthly' });

    // 2. Exam Landing Pages
    EXAMS.forEach(exam => {
        urls.push({ loc: `/${exam}`, priority: 0.9, changefreq: 'weekly' });
    });

    // 3. Dynamic Topic Pages from Constants
    try {
        const constantsContent = fs.readFileSync(CONSTANTS_PATH, 'utf-8');

        // Regex to find "Physics: [" or "Chemistry: ["
        // and then extract topics.
        // This is a "Heuristic Parser" to avoid compiling the whole TS project.

        // Find all subjects
        const subjectRegex = /([\w\s]+):\s*\[/g;
        let match;

        // We need to parse the object structure. 
        // Let's do a simpler regex to find all `{ topic: "..."` occurrences and their context.

        // Actually, let's just find all topic strings.
        const topicRegex = /\{ topic: "([^"]+)", class: "([^"]+)"/g;
        let topicMatch;

        // To map topics to subjects, we might need a better parser or just assume flat structure for sitemap.
        // But the URL structure is /:exam/:subject/:topic
        // We know the subjects.

        // Let's map Subjects to Exams (Roughly)
        const SUBJECT_MAP = {
            'Physics': ['jee-mains', 'neet-ug', 'bitsat', 'class-11', 'class-12'],
            'Chemistry': ['jee-mains', 'neet-ug', 'bitsat', 'class-11', 'class-12'],
            'Mathematics': ['jee-mains', 'bitsat', 'gate', 'class-6', 'class-7', 'class-8', 'class-9', 'class-10', 'class-11', 'class-12'],
            'Biology': ['neet-ug', 'class-11', 'class-12'],
            'History': ['upsc', 'class-6', 'class-7', 'class-8', 'class-9', 'class-10'],
            'Geography': ['upsc', 'class-6', 'class-7', 'class-8', 'class-9', 'class-10'],
            'Polity': ['upsc'],
            'Economy': ['upsc'],
            'Civics': ['class-6', 'class-7', 'class-8', 'class-9', 'class-10'],
            'General Science': ['upsc'],
            'Science': ['class-6', 'class-7', 'class-8', 'class-9', 'class-10'],
            'Social Science': ['class-6', 'class-7', 'class-8', 'class-9', 'class-10'],
            'English': ['class-6', 'class-7', 'class-8', 'class-9', 'class-10', 'class-11', 'class-12'],
            'English Proficiency': ['bitsat', 'clat'],
            'Logical Reasoning': ['bitsat', 'clat', 'gate'],
            'Legal Reasoning': ['clat'],
            'Current Affairs': ['clat', 'upsc'],
            'Quantitative Techniques': ['clat'],
            'Engineering Mathematics': ['gate'],
            'Computer Science': ['gate', 'class-11', 'class-12']
        };

        // Extract raw topics grouped by subject would be hard with regex.
        // Let's try to load the file using jiti or ts-node if available, but we can't assume environment.
        // fallback: we will rely on a "best effort" parsing.

        const lines = constantsContent.split('\n');
        let currentSubject = null;

        lines.forEach(line => {
            // Check for Subject Start roughly
            // Matches: Physics: [  OR  "Physics": [  OR  'Physics': [
            const subjectMatch = line.match(/^\s*["']?([\w\s]+)["']?:\s*\[/);
            if (subjectMatch) {
                currentSubject = subjectMatch[1].trim();
            }

            // Check for topic
            // Matches: { topic: "Name", ... }
            if (currentSubject) {
                const topicMatch = line.match(/topic:\s*["']([^"']+)["']/);
                if (topicMatch) {
                    const topicName = topicMatch[1];
                    const supportedExams = SUBJECT_MAP[currentSubject];

                    if (supportedExams) {
                        supportedExams.forEach(exam => {
                            // URL: /:exam/:subject/:topic
                            const url = `/${exam}/${slugify(currentSubject)}/${slugify(topicName)}`;
                            if (!urls.find(u => u.loc === url)) { // Prevent duplicates
                                urls.push({
                                    loc: url,
                                    priority: 0.7,
                                    changefreq: 'weekly'
                                });
                            }

                            // Also add Subject Page if not added
                            const subjectUrl = `/${exam}/${slugify(currentSubject)}`;
                            if (!urls.find(u => u.loc === subjectUrl)) {
                                urls.push({
                                    loc: subjectUrl,
                                    priority: 0.8,
                                    changefreq: 'weekly'
                                });
                            }
                        });
                    }
                }
            }
        });

    } catch (e) {
        console.error("Error parsing constants for sitemap:", e);
    }

    // Generate XML
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    fs.writeFileSync(SITEMAP_PATH, sitemapContent);
    console.log(`✅ Sitemap generated at ${SITEMAP_PATH} with ${urls.length} URLs`);

    // Generate Robots.txt
    const robotsContent = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap.xml
`;
    fs.writeFileSync(ROBOTS_PATH, robotsContent);
    console.log(`✅ Robots.txt generated at ${ROBOTS_PATH}`);
}

generateSitemap();

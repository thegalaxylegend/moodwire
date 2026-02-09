
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

const constantsPath = path.join(__dirname, '../src/lib/constants.ts');
const manifestPath = path.join(__dirname, '../public/seo-manifest.json');
const registryPath = path.join(__dirname, '../public/slug-registry.json');

async function generate() {
    try {
        console.log('🚀 Generating Global SEO Manifest and Registry...');
        const content = fs.readFileSync(constantsPath, 'utf8');

        // Parse Mapping
        const mappingMatch = content.match(/export const EXAM_SUBJECT_MAPPING: Record<string, string\[\]> = ({[\s\S]+?});/);
        if (!mappingMatch) throw new Error('Could not find EXAM_SUBJECT_MAPPING');

        const mappingStr = mappingMatch[1]
            .replace(/\/\/.*$/gm, '')
            .replace(/(['"])?([a-zA-Z0-9- ]+)(['"])?:/g, '"$2":')
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');

        const EXAM_SUBJECT_MAPPING = JSON.parse(mappingStr);

        // Parse Syllabus
        const SYLLABUS_DATA = {};
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
            const topicMatches = block.matchAll(/topic:\s*["']([^"']+)["']/g);
            for (const tMatch of topicMatches) {
                topics.push(tMatch[1]);
            }
            SYLLABUS_DATA[subject.name] = topics;
        }

        const manifest = {};
        const registry = {}; // URL -> Metadata (or vice versa)

        Object.entries(EXAM_SUBJECT_MAPPING).forEach(([examSlug, subjects]) => {
            subjects.forEach(subjectName => {
                const subjectSlug = slugify(subjectName);
                const subjectUrl = `/${examSlug}/${subjectSlug}`;

                manifest[subjectUrl] = {
                    title: `${subjectName} for ${examSlug.toUpperCase().replace(/-/g, ' ')} | Syllabus & PYQs`,
                    description: `Complete ${subjectName} preparation for ${examSlug.replace(/-/g, ' ').toUpperCase()}. Get chapter-wise weightage and practice questions.`,
                    h1: subjectName,
                    type: 'hub'
                };

                const topics = SYLLABUS_DATA[subjectName] || [];
                topics.forEach(topicName => {
                    const topicSlug = slugify(topicName);
                    const topicUrl = `${subjectUrl}/${topicSlug}`;

                    manifest[topicUrl] = {
                        title: `${topicName} - ${subjectName} for ${examSlug.toUpperCase().replace(/-/g, ' ')}`,
                        description: `Study ${topicName} from ${subjectName} for ${examSlug.replace(/-/g, ' ').toUpperCase()}. AI roadmaps and 50+ PYQs.`,
                        h1: topicName,
                        type: 'topic',
                        subject: subjectName,
                        exam: examSlug
                    };
                });
            });
        });

        // Registry is simply the list of URLs allowed
        const urls = Object.keys(manifest);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        fs.writeFileSync(registryPath, JSON.stringify(urls, null, 2));

        console.log(`✅ Success! Generated ${urls.length} SEO entries.`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

generate();

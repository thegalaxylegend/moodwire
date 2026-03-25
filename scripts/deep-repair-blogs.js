import fs from 'fs';
import path from 'path';

const blogsDir = './src/content/blogs';
const imagesDir = './public/blog-images';

const SUBJECT_KEYWORDS = {
    'Mathematics': [/Math/i, /Algebra/i, /Calculus/i, /Geometry/i, /Trigonometry/i, /Probability/i, /Statistics/i, /Sets/i, /Functions/i, /Limits/i, /Derivatives/i, /Integration/i, /Vectors/i, /Complex Numbers/i, /Binomial/i, /Sequence/i, /Series/i, /Permutations/i, /Combinations/i, /Induction/i, /Conic/i, /Linear Inequalities/i],
    'Physics': [/Physics/i, /Mechanics/i, /Gravitation/i, /Thermodynamics/i, /Kinetic Theory/i, /Oscillations/i, /Waves/i, /Electrostatics/i, /Magnetism/i, /Optics/i, /Atoms/i, /Nuclei/i, /Semiconductor/i, /Motion/i, /Force/i, /Energy/i, /Power/i, /Current/i, /Capacitance/i, /Radiation/i],
    'Chemistry': [/Chemistry/i, /Atom/i, /Elements/i, /Periodicity/i, /Chemical Bonding/i, /Equilibrium/i, /Redox/i, /Hydrogen/i, /Organic/i, /Hydrocarbons/i, /Solid State/i, /Solutions/i, /Electrochemistry/i, /Kinetics/i, /Surface/i, /Metallurgy/i, /Biomolecules/i, /p-Block/i, /s-Block/i, /d-and-f/i, /Coordination/i, /Haloalkanes/i, /Alcohols/i, /Aldehydes/i, /Amines/i],
    'Biology': [/Biology/i, /Living World/i, /Plant Kingdom/i, /Animal Kingdom/i, /Morphology/i, /Anatomy/i, /Cell/i, /Photosynthesis/i, /Respiration/i, /Digestion/i, /Breathing/i, /Excretory/i, /Locomotion/i, /Neural/i, /Coordination/i, /Reproduction/i, /Genetics/i, /Evolution/i, /Biotechnology/i, /Ecosystem/i, /Biodiversity/i, /Organisms/i, /Heredity/i, /Health/i, /Microbes/i, /Environmental/i],
    'History': [/History/i, /Ancient India/i, /Medieval India/i, /Modern India/i, /Revolution/i, /Nationalism/i, /Industrialisation/i, /Print Culture/i, /World History/i, /Indus Valley/i, /Mahajanapadas/i, /Vedic Age/i, /Mughal/i, /Sultanate/i, /Bhakti/i, /Sufi/i, /Empire/i, /Timeline/i],
    'Geography': [/Geography/i, /Physical Features/i, /Drainage/i, /Climate/i, /Vegetation/i, /Wildlife/i, /Resources/i, /Development/i, /Agriculture/i, /Minerals/i, /Manufacturing/i, /Climatology/i, /Geomorphology/i, /Oceanography/i, /Population/i, /Water Resources/i],
    'Social Science': [/Social Science/i, /Economics/i, /Civics/i, /Polity/i, /Political/i, /Democratic/i, /Constitution/i, /Federalism/i, /Gender/i, /Caste/i, /Religion/i, /Money/i, /Credit/i, /Globalisation/i, /Poverty/i, /Food Security/i, /Government/i, /Marginalisation/i, /Secularism/i, /Parliament/i, /Judiciary/i],
    'Computer Science': [/Computer Science/i, /Data Structures/i, /Algorithms/i, /Digital Logic/i, /Computer Organization/i, /Operating Systems/i, /Databases/i, /DBMS/i, /Networks/i, /Python/i, /Logic Gates/i, /Ai Exam Prep/i, /Ai Study Hack/i, /Computation/i, /Compiler/i]
};

const SUBJECT_FALLBACKS = {
    'Mathematics': '/blog-images/fallbacks/generic-math.webp',
    'Physics': '/blog-images/fallbacks/generic-physics.webp',
    'Chemistry': '/blog-images/fallbacks/generic-chemistry.webp',
    'Biology': '/blog-images/fallbacks/generic-biology.webp',
    'Computer Science': '/blog-images/fallbacks/generic-cs.webp',
    'History': '/blog-images/fallbacks/generic-humanities.webp',
    'Geography': '/blog-images/fallbacks/generic-humanities.webp',
    'Social Science': '/blog-images/fallbacks/generic-humanities.webp',
    'General': '/blog-images/fallbacks/generic-study.webp'
};

function detectSubject(body, title) {
    const text = (title + ' ' + body.slice(0, 3000)).toLowerCase();
    
    // 1. High-Priority Title Signals
    if (/Biology/i.test(title)) return 'Biology';
    if (/Chemistry/i.test(title)) return 'Chemistry';
    if (/Physics/i.test(title)) return 'Physics';
    if (/Math/i.test(title)) return 'Mathematics';
    if (/History/i.test(title)) return 'History';
    if (/Geography/i.test(title) || /Climatology/i.test(title)) return 'Geography';
    if (/Social Science/i.test(title) || /Civics/i.test(title) || /Polity/i.test(title)) return 'Social Science';
    if (/Computer Science/i.test(title) || /Computer/i.test(title)) return 'Computer Science';

    // 2. Scoring System
    const scores = {};
    for (const [subject, patterns] of Object.entries(SUBJECT_KEYWORDS)) {
        scores[subject] = 0;
        for (const pattern of patterns) {
            const matches = text.match(new RegExp(pattern.source, 'gi'));
            if (matches) scores[subject] += matches.length;
        }
    }

    // Boost History/Social Science for specific keywords
    if (text.includes('ancient india') || text.includes('medieval india')) scores['History'] += 10;
    if (text.includes('constitution') || text.includes('federalism')) scores['Social Science'] += 10;

    let bestSubject = 'General';
    let maxScore = 0;
    for (const [subject, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestSubject = subject;
        }
    }

    return maxScore > 0 ? bestSubject : 'General';
}

async function fixBlogs() {
    console.log('🚀 Starting refined deep blog repair...');
    const files = fs.readdirSync(blogsDir).filter(f => f.endsWith('.md'));
    const diskImages = fs.readdirSync(imagesDir);

    let fixedCount = 0;

    for (const file of files) {
        const filePath = path.join(blogsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        const slug = file.replace('.md', '');

        // Split frontmatter and body
        const parts = content.split('---');
        if (parts.length < 3) continue;
        
        const frontmatter = parts[1];
        const body = parts.slice(2).join('---');

        // Extract Title from frontmatter
        const titleMatch = frontmatter.match(/^title:\s*["'](.*?)["']/m);
        const title = titleMatch ? titleMatch[1] : '';

        // 1. Fix Subject (Category)
        const oldCatMatch = frontmatter.match(/^category:\s*["'](.*?)["']/m);
        const currentCat = oldCatMatch ? oldCatMatch[1] : '';
        const trueCat = detectSubject(body, title);
        
        let newFrontmatter = frontmatter;
        if (trueCat !== currentCat) {
            newFrontmatter = newFrontmatter.replace(/^category:\s*["'](.*?)["']/m, `category: "${trueCat}"`);
            // Update keywords
            newFrontmatter = newFrontmatter.replace(/^keywords:\s*["'](.*?)["']/m, (match, p1) => {
                // Remove all old subject names and put the new one
                const cleanKeywords = p1.split(',')
                    .map(k => k.trim())
                    .filter(k => !Object.keys(SUBJECT_KEYWORDS).includes(k))
                    .join(', ');
                return `keywords: "${cleanKeywords}, ${trueCat}, Exam Compass"`;
            });
        }

        // 2. Fix Image
        const heroMatch = newFrontmatter.match(/^heroImage:\s*["'](.*?)["']/m) || newFrontmatter.match(/^hero_image:\s*["'](.*?)["']/m);
        let currentHero = heroMatch ? heroMatch[1] : '';
        let heroFilename = currentHero.split('/').pop();
        
        const existsOnDisk = diskImages.includes(heroFilename);
        
        if (!existsOnDisk || !currentHero || currentHero.includes('fallbacks')) {
            // Try to find a better one
            const possibleNames = [
                slug + '.webp',
                slug + '.png',
                slug.replace('-revision-notes-gate-boards', '') + '-notes.webp',
                slug.replace('-revision-notes-jee', '') + '-notes.webp',
                slug.replace('-revision-notes-neet', '') + '-notes.webp',
                slug.replace(/-class-\d+.*$/, '') + '-notes.webp'
            ];

            let found = false;
            for (const name of possibleNames) {
                if (diskImages.includes(name)) {
                    const newHero = `/blog-images/${name}`;
                    if (heroMatch) {
                        newFrontmatter = newFrontmatter.replace(/^heroImage:\s*["'](.*?)["']/m, `heroImage: "${newHero}"`);
                        newFrontmatter = newFrontmatter.replace(/^hero_image:\s*["'](.*?)["']/m, `heroImage: "${newHero}"`);
                    } else {
                        newFrontmatter += `heroImage: "${newHero}"\n`;
                    }
                    found = true;
                    break;
                }
            }

            if (!found && (!currentHero || currentHero.includes('fallbacks'))) {
                const fallback = SUBJECT_FALLBACKS[trueCat] || SUBJECT_FALLBACKS['General'];
                if (heroMatch) {
                    newFrontmatter = newFrontmatter.replace(/^heroImage:\s*["'](.*?)["']/m, `heroImage: "${fallback}"`);
                    newFrontmatter = newFrontmatter.replace(/^hero_image:\s*["'](.*?)["']/m, `heroImage: "${fallback}"`);
                } else {
                    newFrontmatter += `heroImage: "${fallback}"\n`;
                }
            }
        }

        // Reconstruct content
        const finalContent = `---\n${newFrontmatter.trim()}\n---\n${body.trim()}`;
        fs.writeFileSync(filePath, finalContent);
        fixedCount++;
    }

    console.log(`✅ Success: ${fixedCount} blogs processed and repaired.`);
}

fixBlogs();

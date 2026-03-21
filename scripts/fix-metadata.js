import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

// Correcting Categories specifically mentioned by the user and more
const CATEGORY_MAP = {
    'climatology-class-11-notes.md': 'Geography',
    'geomorphology-class-11-notes.md': 'Geography',
    'oceanography-class-11-notes.md': 'Geography',
    'world-history-industrial-revolution-class-11-notes.md': 'History',
    'art-culture-architecture-class-11-notes.md': 'History',
    'ancient-india-vedic-age-class-11-notes.md': 'History',
    'ancient-india-mahajanapadas-class-11-notes.md': 'History',
    'ancient-india-indus-valley-class-11-notes.md': 'History',
    'medieval-india-bhakti-sufi-class-11-notes.md': 'History',
    'medieval-india-delhi-sultanate-class-11-notes.md': 'History',
    'medieval-india-mughals-class-11-notes.md': 'History',
    
    'moving-charges-magnetism-revision-notes.md': 'Physics',
    'current-electricity-revision-notes.md': 'Physics',
    'waves-revision-notes.md': 'Physics',
    'work-energy-and-power-revision-notes.md': 'Physics',
    'thermodynamics-revision-notes.md': 'Physics',
    'motion-in-a-plane-revision-notes.md': 'Physics',
    'motion-in-a-straight-line-revision-notes.md': 'Physics',
    'laws-of-motion-revision-notes.md': 'Physics',
    'laws-of-motion-common-mistakes.md': 'Physics',
    'roatation-motion-revision-notes.md': 'Physics',
    'rotational-motion-revision-notes.md': 'Physics',
    'gravitation-revision-notes.md': 'Physics',
    'mechanical-properties-of-fluids-revision-notes.md': 'Physics',
    'mechanical-properties-of-solids-revision-notes.md': 'Physics',
    'thermal-properties-of-matter-revision-notes.md': 'Physics',
    'kinetic-theory-revision-notes.md': 'Physics',
    'oscillations-revision-notes.md': 'Physics',
    'electric-charges-fields-revision-notes.md': 'Physics',
    'ray-optics-class-12-quick-revision-notes.md': 'Physics',
    'physical-world-class-11-notes.md': 'Physics',

    'hydrocarbons-class-11-notes.md': 'Chemistry',
    'redox-reactions-class-11-notes.md': 'Chemistry',
    'hydrogen-class-11-notes.md': 'Chemistry',
    'environmental-chemistry-class-11-notes.md': 'Chemistry',
    'thermodynamics-chemistry-revision-notes.md': 'Chemistry',
    'states-of-matter-revision-notes.md': 'Chemistry',
    'equilibrium-revision-notes.md': 'Chemistry',
    'chemical-bonding-class-11-notes.md': 'Chemistry',
    'classification-of-elements-class-11-notes.md': 'Chemistry',
    'classification-elements-periodicity-revision-notes.md': 'Chemistry',
    'structure-of-the-atom-class-11-notes.md': 'Chemistry',
    'structure-of-atom-revision-notes.md': 'Chemistry',
    'the-s-block-elements-class-11-notes.md': 'Chemistry',
    'the-p-block-elements-11-class-11-notes.md': 'Chemistry',

    'three-dimensional-geometry-revision-notes.md': 'Mathematics',
    '3d-geometry-intro-class-11-notes.md': 'Mathematics',
    'complex-numbers-revision-notes.md': 'Mathematics',
    'straight-lines-revision-notes.md': 'Mathematics',
    'linear-inequalities-revision-notes.md': 'Mathematics',
    'binomial-theorem-revision-notes.md': 'Mathematics',
    'sequences-series-revision-notes.md': 'Mathematics',
    'conic-sections-revision-notes.md': 'Mathematics',
    'limits-derivatives-revision-notes.md': 'Mathematics',
    'mathematical-reasoning-revision-notes.md': 'Mathematics',
    'statistics-revision-notes.md': 'Mathematics',
    'probability-revision-notes.md': 'Mathematics',
    'relations-functions-revision-notes.md': 'Mathematics',
    'trigonometric-functions-revision-notes.md': 'Mathematics',
    'mathematical-induction-revision-notes.md': 'Mathematics',
    'sets-revision-notes.md': 'Mathematics'
};

for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Fix "Class Class"
    content = content.replace(/Class Class (\d+)/g, 'Class $1');
    content = content.replace(/Class\sClass\b/g, 'Class');
    
    // 2. Fix Category Tags based on robust manual mapping over the actual filenames
    if (CATEGORY_MAP[file]) {
        content = content.replace(/category:\s*".*?"/, `category: "${CATEGORY_MAP[file]}"`);
    }

    // 3. Fix Organic Chemistry description specifically mentioned by user
    if (file.includes('organic-chemistry') && content.includes('description: "Here"')) {
        content = content.replace('description: "Here"', 'description: "Quick Organic Chemistry Basic Principles Revision Notes & Recap for Class 11. Core concepts, isomers, and quick formulas."');
    }
    
    fs.writeFileSync(filePath, content);
}

// 4. Delete Duplicate Chemistry Basics Post
const dup = path.join(BLOG_DIR, 'some-basic-concepts-chemistry-revision-notes.md');
if (fs.existsSync(dup)) {
    fs.unlinkSync(dup);
    console.log("🗑️ Deleted duplicate basic concepts of chemistry blog.");
}

console.log("✅ Fixed metadata across all 100+ files!");

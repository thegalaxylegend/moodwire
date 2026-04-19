/**
 * GLOBAL TITLE NORMALIZATION
 * Fixes titles in BOTH blogs.ts and markdown frontmatter
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOGS_DIR = path.resolve(__dirname, '..', 'src', 'content', 'blogs');
const BLOGS_TS = path.resolve(__dirname, '..', 'src', 'data', 'blogs.ts');

const SUBJECT_MAP = {
  'alternating-current': 'Physics',
  'electromagnetic-waves': 'Physics',
  'electromagnetic-induction': 'Physics',
  'electrostatics': 'Physics',
  'magnetic-effects-of-current': 'Physics',
  'magnetism-and-matter': 'Physics',
  'current-electricity': 'Physics',
  'moving-charges-magnetism': 'Physics',
  'waves-class-11': 'Physics',
  'work-energy-and-power': 'Physics',
  'thermodynamics-class-11': 'Physics',
  'units-and-measurements': 'Physics',
  'thermal-properties-of-matter': 'Physics',
  'oscillations': 'Physics',
  'rotational-motion': 'Physics',
  'motion-in-a-straight-line': 'Physics',
  'motion-in-a-plane': 'Physics',
  'mechanical-properties-of-solids': 'Physics',
  'mechanical-properties-of-fluids': 'Physics',
  'laws-of-motion-class-11': 'Physics',
  'kinetic-theory': 'Physics',
  'gravitation': 'Physics',
  'physical-world': 'Physics',
  'electric-charges-fields': 'Physics',
  'ray-optics': 'Physics',
  'wave-optics': 'Physics',
  'dual-nature-of-radiation': 'Physics',
  'semiconductor-electronics': 'Physics',
  'communication-systems': 'Physics',
  'atoms-class-12': 'Physics',
  'nuclei-class-12': 'Physics',
  'trigonometric-functions': 'Mathematics',
  'inverse-trigonometric-functions': 'Mathematics',
  'straight-lines': 'Mathematics',
  'complex-numbers': 'Mathematics',
  'mathematical-reasoning': 'Mathematics',
  'mathematical-induction': 'Mathematics',
  'linear-inequalities': 'Mathematics',
  'three-dimensional-geometry': 'Mathematics',
  'limits-derivatives': 'Mathematics',
  'limits-and-derivatives': 'Mathematics',
  'conic-sections': 'Mathematics',
  'sets-class-11': 'Mathematics',
  'relations-functions': 'Mathematics',
  'sequences-series': 'Mathematics',
  'permutations-combinations': 'Mathematics',
  'probability-class-11': 'Mathematics',
  'statistics-class-11': 'Mathematics',
  'binomial-theorem': 'Mathematics',
  'poverty-unemployment': 'Economics',
  'local-government': 'Political Science',
  'fundamental-rights': 'Political Science',
  'constitutional-framework': 'Political Science',
  'planning-in-india': 'Economics',
  'indian-geography': 'Geography',
  'geomorphology': 'Geography',
  'climatology': 'Geography',
  'biogeography': 'Geography',
  'art-culture': 'History',
  'medieval-india': 'History',
  'ancient-india': 'History',
};

const EXAM_MAP = {
  'Physics': 'JEE & NEET 2026',
  'Chemistry': 'JEE & NEET 2026',
  'Biology': 'NEET 2026',
  'Mathematics': 'JEE 2026',
  'History': 'CBSE 2026',
  'Geography': 'CBSE 2026',
  'Political Science': 'CBSE 2026',
  'Economics': 'CBSE 2026',
  'Social Science': 'CBSE 2026',
  'Study Strategy': 'All Exams 2026',
};

const FORMAT_MAP = {
  'Physics': 'Revision',
  'Chemistry': 'Revision',
  'Biology': 'Revision',
  'Mathematics': 'Revision',
  'History': 'Recap',
  'Geography': 'Recap',
  'Political Science': 'Recap',
  'Economics': 'Recap',
  'Study Strategy': 'Guide',
};

function getCorrectSubject(id) {
  for (const [key, subject] of Object.entries(SUBJECT_MAP)) {
    if (id.includes(key)) return subject;
  }
  if (id.includes('chemistry')) return 'Chemistry';
  if (id.includes('biology') || id.includes('plants') || id.includes('animals')) return 'Biology';
  if (id.includes('math') || id.includes('algebra') || id.includes('geometry') || id.includes('trigonometry')) return 'Mathematics';
  return 'Exam Prep';
}

function getCorrectTitle(id) {
  const subject = getCorrectSubject(id);
  const exam = EXAM_MAP[subject] || 'CBSE 2026';
  const format = FORMAT_MAP[subject] || 'Revision';
  
  let name = id.split('-')
    .filter(w => !['class', '10', '11', '12', 'notes', 'revision', 'jee', 'neet', 'cbse'].includes(w))
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  
  const classMatch = id.match(/class-(\d+)/);
  const classStr = classMatch ? `Class ${classMatch[1]}` : '';
  
  return `${name} ${classStr} ${subject} ${format} — ${exam} Grandmaster Guide`.replace(/\s+/g, ' ').trim();
}

// 1. Fix Markdown Files
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md'));
files.forEach(file => {
  const filePath = path.join(BLOGS_DIR, file);
  const id = file.replace('.md', '');
  let content = fs.readFileSync(filePath, 'utf-8');
  const correctTitle = getCorrectTitle(id);
  
  content = content.replace(/title:\s*"[^"]*"/, `title: "${correctTitle}"`);
  content = content.replace(/description:\s*"[^"]*"/, `description: "${correctTitle} Revision Notes. Last Updated: 2026-04-18."`);
  
  fs.writeFileSync(filePath, content, 'utf-8');
});

// 2. Fix blogs.ts
let blogsTs = fs.readFileSync(BLOGS_TS, 'utf-8');
const entryRegex = /\{\s*"id":\s*"([^"]+)",\s*"title":\s*"([^"]+)",\s*"description":\s*"([^"]+)"/g;
let match;
while ((match = entryRegex.exec(blogsTs)) !== null) {
  const [full, id, title, desc] = match;
  const correctTitle = getCorrectTitle(id);
  if (title !== correctTitle) {
    blogsTs = blogsTs.replace(`"title": "${title}"`, `"title": "${correctTitle}"`);
    blogsTs = blogsTs.replace(`"description": "${desc}"`, `"description": "${correctTitle} Revision Notes. Last Updated: 2026-04-18."`);
  }
}
fs.writeFileSync(BLOGS_TS, blogsTs, 'utf-8');

console.log(`\n✅ Global title normalization complete for ${files.length} files and the registry.\n`);

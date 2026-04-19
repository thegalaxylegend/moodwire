/**
 * LOCAL BLOG REPAIR SCRIPT — Zero API Usage
 * Fixes: Title/Subject mismatches, description mismatches in blogs.ts
 * 
 * TOPIC → CORRECT SUBJECT mapping based on actual academic curriculum
 */
import fs from 'fs';
import path from 'path';

const BLOGS_PATH = path.resolve('src/data/blogs.ts');

// Deterministic topic → correct subject mapping
const SUBJECT_MAP = {
  // === PHYSICS topics incorrectly labeled ===
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
  'thermodynamics-class-11-revision-notes-neet': 'Physics',
  'units-and-measurements': 'Physics',
  'thermal-properties-of-matter': 'Physics',
  'oscillations': 'Physics',
  'rotational-motion': 'Physics',
  'motion-in-a-straight-line': 'Physics',
  'motion-in-a-plane': 'Physics',
  'mechanical-properties-of-solids': 'Physics',
  'mechanical-properties-of-fluids': 'Physics',
  'laws-of-motion-class-11': 'Physics',
  'laws-of-motion-common-mistakes': 'Physics',
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
  
  // === CHEMISTRY topics incorrectly labeled ===
  'chemical-bonding': 'Chemistry',
  'some-basic-concepts-of-chemistry': 'Chemistry',
  'states-of-matter': 'Chemistry',
  'thermodynamics-chemistry': 'Chemistry',
  'the-s-block-elements': 'Chemistry',
  'structure-of-atom-class-11-revision-notes-jee': 'Chemistry',
  'equilibrium-class-11': 'Chemistry',
  'redox-reactions': 'Chemistry',
  'hydrogen-class-11': 'Chemistry',
  'environmental-chemistry': 'Chemistry',
  'the-p-block-elements': 'Chemistry',
  'classification-of-elements': 'Chemistry',
  'classification-elements-periodicity': 'Chemistry',
  'hydrocarbons': 'Chemistry',
  'organic-chemistry-basic-principles': 'Chemistry',
  'chemical-coordination-and-integration': 'Biology', // this IS biology
  
  // === MATHEMATICS topics incorrectly labeled ===
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
  
  // === GEOGRAPHY topics incorrectly labeled ===
  'oceanography': 'Geography',
  'indian-geography-physical': 'Geography',
  'indian-geography-climate': 'Geography',
  'climatology': 'Geography',
  'geomorphology': 'Geography',
  'biogeography': 'Geography',
  
  // === POLITICAL SCIENCE / SOCIAL SCIENCE topics ===
  'dpsp-duties': 'Political Science',
  'planning-in-india': 'Economics',
  'fundamental-rights': 'Political Science',
  'constitutional-framework': 'Political Science',
  'federalism': 'Political Science',
  'local-government': 'Political Science',
  'poverty-unemployment': 'Economics',
  
  // === HISTORY topics ===
  'art-culture-architecture': 'History',
  'medieval-india-bhakti-sufi': 'History',
  'medieval-india-delhi-sultanate': 'History',
  'medieval-india-mughals': 'History',
  'ancient-india-indus-valley': 'History',
  'ancient-india-mahajanapadas': 'History',
  'ancient-india-vedic-age': 'History',
  'world-history-industrial-revolution': 'History',
  
  // === STUDY STRATEGY / META articles ===
  'study-12-hours-daily-tips': 'Study Strategy',
  'state-scholarship-guide-2026': 'Study Strategy',
  'cuet-2026-master-strategy': 'Study Strategy',
  'ai-exam-prep-future': 'Study Strategy',
  'ai-study-hack-pomodoro': 'Study Strategy',
  'jee-mains-high-weightage-chapters': 'Study Strategy',
  'jee-mains-chemistry-repeated-concepts': 'Study Strategy',
  'jee-advanced-math-difficulty-trends': 'Study Strategy',
  'neet-biology-80-20-rule': 'Study Strategy',
  'neet-2026-weightage-prediction': 'Study Strategy',
  'class-10-science-pyq-strategy': 'Study Strategy',
  'class-10-30-day-timetable': 'Study Strategy',
  'upsc-optional-selection-guide': 'Study Strategy',
};

// Exam type mapping based on subject
const EXAM_MAP = {
  'Physics': 'JEE & NEET 2026',
  'Chemistry': 'JEE & NEET 2026',
  'Biology': 'NEET 2026',
  'Mathematics': 'JEE 2026',
  'Computer Science': 'GATE & Boards 2026',
  'History': 'CBSE 2026',
  'Geography': 'CBSE 2026',
  'Political Science': 'CBSE 2026',
  'Economics': 'CBSE 2026',
  'Social Science': 'CBSE 2026',
  'Study Strategy': 'All Exams 2026',
};

// Format type mapping
const FORMAT_MAP = {
  'Physics': 'Revision',
  'Chemistry': 'Revision',
  'Biology': 'Revision',
  'Mathematics': 'Revision',
  'Computer Science': 'Revision',
  'History': 'Recap',
  'Geography': 'Recap',
  'Political Science': 'Recap',
  'Economics': 'Recap',
  'Social Science': 'Recap',
  'Study Strategy': 'Guide',
};

const GUIDE_MAP = {
  'Revision': 'Grandmaster Guide',
  'Recap': 'Quick Guide',
  'Guide': 'Grandmaster Guide',
};

function detectCorrectSubject(id) {
  for (const [key, subject] of Object.entries(SUBJECT_MAP)) {
    if (id.includes(key)) return subject;
  }
  return null;
}

function extractTopicName(id) {
  // Remove class info and exam suffixes
  let clean = id
    .replace(/-class-\d+-revision-notes?-(?:jee-neet|jee|neet|cbse|gate-boards)/gi, '')
    .replace(/-class-\d+-notes?/gi, '')
    .replace(/-revision-notes?-(?:jee-neet|jee|neet|cbse|gate-boards)/gi, '')
    .replace(/-quick$/gi, '');
  
  // Convert kebab-case to Title Case
  return clean.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractClass(id) {
  const match = id.match(/class-(\d+)/);
  return match ? match[1] : null;
}

function buildCorrectTitle(id, correctSubject) {
  const topicName = extractTopicName(id);
  const classNum = extractClass(id);
  const format = FORMAT_MAP[correctSubject] || 'Revision';
  const exam = EXAM_MAP[correctSubject] || 'CBSE 2026';
  const guide = GUIDE_MAP[format] || 'Grandmaster Guide';
  
  if (!classNum) {
    return `${topicName} ${correctSubject} ${format} — ${exam} ${guide}`;
  }
  return `${topicName} Class ${classNum} ${correctSubject} ${format} — ${exam} ${guide}`;
}

// Read the file
let content = fs.readFileSync(BLOGS_PATH, 'utf-8');

// Parse all blog entries
const entryRegex = /\{\s*"id":\s*"([^"]+)",\s*"title":\s*"([^"]+)",\s*"description":\s*"([^"]+)",/g;

let fixCount = 0;
const fixes = [];

let match;
while ((match = entryRegex.exec(content)) !== null) {
  const [fullMatch, id, currentTitle, currentDesc] = match;
  const correctSubject = detectCorrectSubject(id);
  
  if (!correctSubject) continue;
  
  // Check if current title has wrong subject
  const currentTitleLower = currentTitle.toLowerCase();
  const correctSubjectLower = correctSubject.toLowerCase();
  
  // Detect mismatches
  const hasBiologyWrong = currentTitleLower.includes('biology') && correctSubject !== 'Biology';
  const hasPhysicsWrong = currentTitleLower.includes('physics') && correctSubject !== 'Physics';
  const hasChemistryWrong = currentTitleLower.includes('chemistry') && !['Chemistry'].includes(correctSubject) && !id.includes('chemistry');
  const hasClassMismatch = currentTitleLower.includes('class 10 exam notes recap') && id.includes('class-11');
  const hasLowercaseSlug = currentTitle.match(/^[a-z]/) && !currentTitle.startsWith('p-'); // slug-style title
  
  if (hasBiologyWrong || hasPhysicsWrong || hasChemistryWrong || hasClassMismatch || hasLowercaseSlug) {
    const newTitle = buildCorrectTitle(id, correctSubject);
    const classNum = extractClass(id);
    const dateMatch = currentDesc.match(/Last Updated: (\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '2026-04-18';
    const newDesc = `${newTitle} Revision Notes. Last Updated: ${date}.`;
    
    // Replace in content
    const oldTitleStr = `"title": "${currentTitle}"`;
    const newTitleStr = `"title": "${newTitle}"`;
    const oldDescStr = `"description": "${currentDesc}"`;
    const newDescStr = `"description": "${newDesc}"`;
    
    content = content.replace(oldTitleStr, newTitleStr);
    content = content.replace(oldDescStr, newDescStr);
    
    fixes.push({ id, from: currentTitle, to: newTitle, subject: correctSubject });
    fixCount++;
  }
}

fs.writeFileSync(BLOGS_PATH, content, 'utf-8');

console.log(`\n✅ Fixed ${fixCount} blog title/subject mismatches\n`);
fixes.forEach(f => {
  console.log(`📝 ${f.id}`);
  console.log(`   FROM: ${f.from}`);
  console.log(`   TO:   ${f.to}\n`);
});

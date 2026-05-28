import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('public/question-db.json');
const questionDb = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const keys = Object.keys(questionDb);
console.log(`Total keys in question-db.json: ${keys.length}`);

for (let i = 0; i < 5; i++) {
  console.log(`\nSample ${i}:`);
  const q = questionDb[keys[i]];
  console.log(JSON.stringify({ text: q.text, options: q.options }, null, 2));
}

// Find questions that might be math related but don't use standard LaTeX delimiters
const mathQuestions = keys.map(k => questionDb[k]).filter(q => {
  const text = q.text || '';
  return text.includes('^') || text.includes('_') || text.includes('integral') || text.includes('matrix');
});

console.log(`\nFound ${mathQuestions.length} math-related questions`);
for (let i = 0; i < Math.min(3, mathQuestions.length); i++) {
  console.log(`\nMath Sample ${i}:`);
  console.log(mathQuestions[i].text);
}

const fs = require('fs');
const db = JSON.parse(fs.readFileSync('c:/Users/Admin/Downloads/Desktop/public/question-db.json', 'utf8'));
let placeholders = 0;
let realQuestions = 0;
for (const key of Object.keys(db)) {
    const q = db[key];
    if (q.text === 'Practice Question' || (q.explanation && q.explanation.toLowerCase().includes('placeholder'))) {
        placeholders++;
    } else {
        realQuestions++;
    }
}
console.log('Total questions:', Object.keys(db).length);
console.log('Placeholder questions:', placeholders);
console.log('Real questions:', realQuestions);

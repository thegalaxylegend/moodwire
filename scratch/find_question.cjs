const fs = require('fs');
const db = JSON.parse(fs.readFileSync('c:/Users/Admin/Downloads/Desktop/public/question-db.json', 'utf8'));
const slug = 'practice-question-ihrano8csmdhiydwi25l';
const foundKey = Object.keys(db).find(k => k.includes(slug) || db[k].slug === slug);
if (foundKey) {
    console.log('Found question in DB!');
    console.log('Key:', foundKey);
    console.log('Content:', JSON.stringify(db[foundKey], null, 2));
} else {
    console.log('Question not found in DB!');
}

const fs = require('fs');
const db = JSON.parse(fs.readFileSync('c:/Users/Admin/Downloads/Desktop/public/question-db.json', 'utf8'));
const keys = Object.keys(db);
console.log('First question key:', keys[0]);
console.log('First question content:', JSON.stringify(db[keys[0]], null, 2));

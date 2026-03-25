const fs = require('fs');
const path = require('path');

const seoManifestPath = path.resolve(__dirname, 'public/seo-manifest.json');
const questionDbPath = path.resolve(__dirname, 'public/question-db.json');

function cleanSeoManifest() {
    if (!fs.existsSync(seoManifestPath)) return;
    const data = JSON.parse(fs.readFileSync(seoManifestPath, 'utf8'));
    const cleaned = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (key.includes('/upsc/')) continue;
        
        const entry = { ...value };
        if (entry.title) entry.title = entry.title.replace(/,?\s*and\s*UPSC/gi, '').replace(/UPSC,?\s*/gi, '');
        if (entry.description) entry.description = entry.description.replace(/,?\s*and\s*UPSC/gi, '').replace(/UPSC,?\s*/gi, '');
        
        cleaned[key] = entry;
    }
    
    fs.writeFileSync(seoManifestPath, JSON.stringify(cleaned, null, 2));
    console.log('Cleaned seo-manifest.json');
}

function cleanQuestionDb() {
    if (!fs.existsSync(questionDbPath)) return;
    const data = JSON.parse(fs.readFileSync(questionDbPath, 'utf8'));
    // If it's an array of questions
    if (Array.isArray(data)) {
        const cleaned = data.filter(q => !q.examCategory?.includes('UPSC') && !q.exam?.includes('UPSC'));
        fs.writeFileSync(questionDbPath, JSON.stringify(cleaned, null, 2));
    } else if (data.questions && Array.isArray(data.questions)) {
         const cleaned = data.questions.filter(q => !q.examCategory?.includes('UPSC') && !q.exam?.includes('UPSC'));
         data.questions = cleaned;
         fs.writeFileSync(questionDbPath, JSON.stringify(data, null, 2));
    }
    console.log('Cleaned question-db.json');
}

cleanSeoManifest();
cleanQuestionDb();

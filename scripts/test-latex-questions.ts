import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Need to run via npx tsx scripts/test-latex-questions.ts

async function main() {
    console.log('Fetching questions with LaTeX...');

    const serviceAccountPath = path.resolve('service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
        console.error('⚠️ service-account.json not found.');
        return;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }

    const db = admin.firestore();

    // Get some questions to look for LaTeX
    const snapshot = await db.collection('engine_questions').limit(200).get();

    const latexQuestions = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        const text = data.text || '';
        if (text.includes('$') || text.includes('\\')) {
            latexQuestions.push({
                id: doc.id,
                text: text,
                options: data.options || []
            });
        }
    });

    console.log(`Found ${latexQuestions.length} questions with LaTeX`);

    for (let i = 0; i < Math.min(5, latexQuestions.length); i++) {
        console.log(`\n--- Question ${latexQuestions[i].id} ---`);
        console.log(latexQuestions[i].text);
        console.log('Options:', latexQuestions[i].options);
    }

    fs.writeFileSync('latex_questions_sample.json', JSON.stringify(latexQuestions.slice(0, 30), null, 2));
    console.log('\nSaved sample to latex_questions_sample.json');
}

main().catch(err => {
    console.error('Error:', err);
});

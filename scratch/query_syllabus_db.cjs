const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    const uid = "2O6DegBgTxg0AjglYDdUEmdwMKk2";
    console.log(`=== Querying syllabus collection for: ${uid} ===`);
    const ref = db.collection('syllabus').where('user_id', '==', uid);
    const snap = await ref.get();
    
    console.log(`Total syllabus entries: ${snap.size}`);
    const matches = [];
    snap.docs.forEach(d => {
        const data = d.data();
        const t = (data.topic || '').toLowerCase();
        matches.push({
            topic: data.topic,
            subject: data.subject,
            is_completed: data.is_completed,
            mastery_score: data.mastery_score
        });
    });
    console.log(JSON.stringify(matches, null, 2));
}

run().catch(console.error);

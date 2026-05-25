const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    const uid = "2O6DegBgTxg0AjglYDdUEmdwMKk2";
    console.log(`=== Querying user_topic_stats for: ${uid} ===`);
    const ref = db.collection('user_topic_stats').where('user_id', '==', uid);
    const snap = await ref.get();
    
    console.log(`Total stats: ${snap.size}`);
    const matches = [];
    snap.docs.forEach(d => {
        const data = d.data();
        const t = (data.topic || '').toLowerCase();
        if (t.includes('force') || t.includes('newton') || t.includes('pressure') || t.includes('light') || t.includes('atom')) {
            matches.push({
                topic: data.topic,
                user_class: data.user_class,
                target_exam: data.target_exam,
                status: data.status,
                score_percentage: data.score_percentage
            });
        }
    });
    console.log(JSON.stringify(matches, null, 2));
}

run().catch(console.error);

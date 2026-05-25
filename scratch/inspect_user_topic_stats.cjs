const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function run() {
    const userId = "2O6DegBgTxg0AjglYDdUEmdwMKk2";
    console.log(`=== Querying user_topic_stats for: ${userId} ===`);
    const snap = await db.collection('user_topic_stats').where('user_id', '==', userId).get();
    console.log(`Total stats docs: ${snap.size}`);
    const docs = [];
    snap.forEach(d => {
        docs.push({ id: d.id, ...d.data() });
    });
    console.log("Sample of docs:");
    docs.slice(0, 20).forEach(d => {
        console.log(`Topic: "${d.topic}", ID: "${d.id}", Subject: "${d.subject}", Class: "${d.user_class}", Exam: "${d.target_exam}", Status: "${d.status}", Score: ${d.score_percentage}%`);
    });
}

run().catch(console.error);

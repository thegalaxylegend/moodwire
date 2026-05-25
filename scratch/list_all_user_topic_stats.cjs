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
    snap.forEach(d => {
        const data = d.data();
        console.log(`Topic: "${data.topic}", ID: "${d.id}", Class: "${data.user_class}", Exam: "${data.target_exam}", Status: "${data.status}", Score: ${data.score_percentage}%`);
    });
}

run().catch(console.error);

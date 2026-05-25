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
    console.log(`=== Querying ALL mock_attempts for: ${userId} ===`);
    const snap = await db.collection('mock_attempts').where('user_id', '==', userId).get();
    console.log(`Total mock attempts: ${snap.size}`);
    const topics = new Set();
    snap.forEach(d => {
        const data = d.data();
        topics.add(data.topic || data.exam_name || data.exam_type || 'Unknown');
    });
    console.log("Unique Topics in mock_attempts:");
    console.log(Array.from(topics));
}

run().catch(console.error);

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    const uid = "2O6DegBgTxg0AjglYDdUEmdwMKk2";
    console.log(`=== Querying mock_attempts for: ${uid} ===`);
    const ref = db.collection('mock_attempts').where('user_id', '==', uid);
    const snap = await ref.get();
    
    console.log(`Total mocks: ${snap.size}`);
    const topics = new Set();
    snap.docs.forEach(d => {
        const data = d.data();
        if (data.topic) topics.add(data.topic);
    });
    console.log("Topics:", Array.from(topics));
}

run().catch(console.error);

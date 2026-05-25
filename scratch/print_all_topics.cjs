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
    const topics = snap.docs.map(d => d.data().topic);
    console.log("Topics in DB:", topics);
}

run().catch(console.error);

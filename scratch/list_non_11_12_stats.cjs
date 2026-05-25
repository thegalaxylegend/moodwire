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
    const snap = await db.collection('user_topic_stats').where('user_id', '==', userId).get();
    const docs = [];
    snap.forEach(d => {
        docs.push({ id: d.id, ...d.data() });
    });
    console.log(`Total stats: ${docs.length}`);
    const non11_12 = docs.filter(d => {
        const c = String(d.user_class || '').toLowerCase();
        return !c.includes('11') && !c.includes('12') && !c.includes('dropper');
    });
    console.log(`Total non-11/12 stats: ${non11_12.length}`);
    non11_12.slice(0, 50).forEach(d => {
        console.log(`Topic: "${d.topic}", ID: "${d.id}", Class: "${d.user_class}", Exam: "${d.target_exam}", Status: "${d.status}"`);
    });
}

run().catch(console.error);

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
    const class8_9 = docs.filter(d => {
        const c = String(d.user_class || '').toLowerCase();
        const t = String(d.topic || '').toLowerCase();
        return c.includes('8') || c.includes('9') || t.includes('class 8') || t.includes('class 9');
    });
    console.log(`Total class 8/9 stats: ${class8_9.length}`);
    class8_9.forEach(d => {
        console.log(`Topic: "${d.topic}", ID: "${d.id}", Class: "${d.user_class}", Exam: "${d.target_exam}", Status: "${d.status}"`);
    });
}

run().catch(console.error);

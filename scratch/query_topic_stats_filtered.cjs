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
    
    console.log(`Found ${snap.size} stats:`);
    snap.docs.forEach(d => {
        const data = d.data();
        const topic = data.topic || '';
        if (topic.includes('Class 9') || topic.includes('Class 8') || topic.includes('Force') || topic.includes('Pressure') || topic.includes('Light')) {
            console.log(`- Topic: ${data.topic}, Class: ${data.user_class}, Exam: ${data.target_exam}, Status: ${data.status}, Score: ${data.score_percentage}%`);
        }
    });
}

run().catch(console.error);

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    const uid = "2O6DegBgTxg0AjglYDdUEmdwMKk2";
    console.log(`=== Querying diagnostic_results for: ${uid} ===`);
    const ref = db.collection('diagnostic_results').where('user_id', '==', uid);
    const snap = await ref.get();
    
    console.log(`Total diagnostics: ${snap.size}`);
    snap.docs.forEach((d, i) => {
        const data = d.data();
        console.log(`${i+1}: Class: ${data.class}, Exam: ${data.exam}, Created: ${data.created_at || data.date}`);
        if (data.results) {
            console.log("  Results keys:", Object.keys(data.results));
        }
    });
}

run().catch(console.error);

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    const uid = "2O6DegBgTxg0AjglYDdUEmdwMKk2";
    const ref = db.collection('mock_attempts').where('user_id', '==', uid);
    const snap = await ref.get();
    console.log(`Cloud mock attempts for ${uid}: ${snap.size}`);
    
    // Check if there are other collections like diagnostic_results or syllabus
    const diagRef = db.collection('diagnostic_results').where('user_id', '==', uid);
    const diagSnap = await diagRef.get();
    console.log(`Diagnostic results: ${diagSnap.size}`);
    
    const sylRef = db.collection('syllabus').where('user_id', '==', uid);
    const sylSnap = await sylRef.get();
    console.log(`Syllabus entries: ${sylSnap.size}`);
}

run().catch(console.error);

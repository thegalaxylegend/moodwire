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
    const uid = "2O6DegBgTxg0AjglYDdUEmdwMKk2";
    console.log(`\n=== Checking FULL User Profile for: ${uid} ===`);
    const userRef = db.collection('profiles').doc(uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
        console.log(`❌ User profile doc 'profiles/${uid}' does not exist.`);
        return;
    }
    
    const userData = userSnap.data() || {};
    console.log(JSON.stringify(userData, null, 2));
}

run().catch(console.error);

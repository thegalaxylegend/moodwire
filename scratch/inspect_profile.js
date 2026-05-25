const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    const uids = ["2O6DegBgTxg0AjglYDdUEmdwMKk2", "tTkJfBNdleNp76XbDlExJDqO4tA3"];
    
    for (const uid of uids) {
        console.log(`\n=== Checking User Profile for: ${uid} ===`);
        const userRef = db.collection('profiles').doc(uid);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) {
            console.log(`❌ User profile doc 'profiles/${uid}' does not exist.`);
            continue;
        }
        
        const userData = userSnap.data() || {};
        console.log(`- Name: ${userData.full_name || userData.name}`);
        console.log(`- ability_score: ${userData.ability_score}`);
        console.log(`- calibration_profile:`, JSON.stringify(userData.calibration_profile, null, 2));
    }
}

run().catch(console.error);

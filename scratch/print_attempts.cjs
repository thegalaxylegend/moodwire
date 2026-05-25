const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    const uid = "Gglb4myPgyXxlwIAjcGR3sLqcOE3";
    console.log(`=== Fetching profile for ${uid} ===`);
    const profileSnap = await db.collection('profiles').doc(uid).get();
    if (profileSnap.exists) {
        console.log("Profile Data:", JSON.stringify(profileSnap.data(), null, 2));
    } else {
        console.log("Profile does not exist!");
    }

    console.log(`=== Fetching mock attempts for ${uid} ===`);
    const attemptsSnap = await db.collection('mock_attempts').where('user_id', '==', uid).get();
    console.log(`Found ${attemptsSnap.size} mock attempts:`);
    attemptsSnap.docs.forEach(doc => {
        console.log(JSON.stringify(doc.data(), null, 2));
    });

    console.log(`\n=== Fetching syllabus progress for ${uid} ===`);
    const sylSnap = await db.collection('syllabus').where('user_id', '==', uid).get();
    console.log(`Found ${sylSnap.size} syllabus entries:`);
    sylSnap.docs.forEach(doc => {
        console.log(JSON.stringify(doc.data(), null, 2));
    });
}

run().catch(console.error);

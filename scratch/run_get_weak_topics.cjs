const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin so that the local services can import it if they run in Node
const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Mock browser localStorage since we are in Node
global.localStorage = {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
    key: () => null,
    length: 0
};

// Mock standard imports
const { getWeakTopics } = require('./src/services/topicStrengthService.ts');

async function run() {
    const uid = "2O6DegBgTxg0AjglYDdUEmdwMKk2";
    console.log("Calling getWeakTopics in Node...");
    const stats = await getWeakTopics(uid, 5, "Dropper", "JEE Mains");
    console.log("Returned stats count:", stats.length);
    console.log("Stats:", JSON.stringify(stats, null, 2));
}

run().catch(console.error);

const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    console.log("-----------------------------------------");
    console.log("Firebase Admin CJS Initialized Successfully.");
    console.log("-----------------------------------------");

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
        const targetExam = userData.target_exam || userData.targetExam || 'General';
        console.log(`User Profile Data:`);
        console.log(`- Name: ${userData.full_name || userData.name}`);
        console.log(`- Email: ${userData.email}`);
        console.log(`- Target Exam (target_exam): ${userData.target_exam}`);
        console.log(`- Target Exam (targetExam): ${userData.targetExam}`);
        console.log(`- Resolved Target Exam: ${targetExam}`);

        console.log(`\n=== Checking Leaderboard Entry for: ${uid} in 2026-05 ===`);
        const leaderboardRef = db.collection('leaderboards').doc('2026-05').collection('users').doc(uid);
        const leaderboardSnap = await leaderboardRef.get();
        
        if (!leaderboardSnap.exists) {
            console.log(`❌ Leaderboard entry for ${uid} does not exist in 2026-05.`);
            continue;
        }
        
        const leaderboardData = leaderboardSnap.data() || {};
        console.log(`Leaderboard Document Data:`, JSON.stringify(leaderboardData, null, 2));

        if (!leaderboardData.examType) {
            console.log(`⚠️ Missing examType! Healing leaderboard document...`);
            await leaderboardRef.set({
                examType: targetExam
            }, { merge: true });
            console.log(`✅ Successfully healed leaderboard entry with examType: "${targetExam}"`);
        } else {
            console.log(`⚡ Leaderboard entry already has examType: "${leaderboardData.examType}"`);
        }
    }
    
    console.log("\nChecking all documents in leaderboards/2026-05/users to heal any remaining documents...");
    const allUsersRef = db.collection('leaderboards').doc('2026-05').collection('users');
    const allSnap = await allUsersRef.get();
    console.log(`Found ${allSnap.size} total entries in the leaderboard.`);
    
    for (const d of allSnap.docs) {
        const data = d.data();
        if (!data.examType) {
            console.log(`⚠️ Leaderboard doc ${d.id} is missing examType. Querying user profile...`);
            const pRef = db.collection('profiles').doc(d.id);
            const pSnap = await pRef.get();
            let examType = 'General';
            if (pSnap.exists) {
                const pData = pSnap.data() || {};
                examType = pData.target_exam || pData.targetExam || 'General';
            }
            await d.ref.set({ examType }, { merge: true });
            console.log(`✅ Healed leaderboard doc ${d.id} with examType: "${examType}"`);
        }
    }

    console.log("\nAll inspections and auto-heals completed successfully!");
}

run().catch(console.error);

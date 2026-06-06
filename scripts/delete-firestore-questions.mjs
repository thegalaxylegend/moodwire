// ═══════════════════════════════════════════════════════════════════════════
// EXAMCOMPASS — FIRESTORE CLEANUP SCRIPT
// Deletes the mistakenly added 'engine_questions' collection in Firebase.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  console.error('firebase-admin not found. Run: npm install firebase-admin');
  process.exit(1);
}

const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
if (!existsSync(serviceAccountPath)) {
  console.error('❌ service-account.json not found. Cannot clean up.');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const COLLECTION = 'engine_questions';

async function deleteCollection(db, collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject, 0);
  });
}

async function deleteQueryBatch(db, query, resolve, reject, deletedCount) {
  try {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
      resolve(deletedCount);
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    const currentDeleted = deletedCount + batchSize;
    process.stdout.write(`\r   Deleted ${currentDeleted} questions so far...`);

    // Recurse on the next batch
    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject, currentDeleted);
    });
  } catch (err) {
    reject(err);
  }
}

async function main() {
  console.log('═'.repeat(68));
  console.log('🔥 EXAMCOMPASS — FIRESTORE QUESTIONS CLEANUP');
  console.log('─'.repeat(68));
  console.log(`   Collection: ${COLLECTION}`);
  console.log(`   Project:    ${serviceAccount.project_id}`);
  console.log('═'.repeat(68) + '\n');

  try {
    // First, count total documents
    console.log('🔍 Checking for questions in Firestore...');
    const snapshot = await db.collection(COLLECTION).limit(1).get();
    if (snapshot.empty) {
      console.log('✅ The collection is already empty! Nothing to delete.');
      return;
    }

    console.log(`🧹 Starting batch deletion of "${COLLECTION}"...`);
    const totalDeleted = await deleteCollection(db, COLLECTION, 400);
    console.log(`\n\n🎉 Successfully deleted ${totalDeleted} questions from Firestore!`);
  } catch (e) {
    console.error('\n❌ Error during deletion:', e.message);
  }
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});

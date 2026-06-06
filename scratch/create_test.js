import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'service-account.json'), 'utf-8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const COLLECTION = 'engine_questions';

async function testCreate() {
  const knownId = '000118ac10574adfdc52c215a069f1dd';
  const ref = db.collection(COLLECTION).doc(knownId);

  try {
    console.log(`Trying to create existing doc: ${knownId}`);
    await ref.create({ test: 'exists' });
    console.log('Success (unexpected, since it should exist now)');
  } catch (err) {
    console.log('Caught expected error:');
    console.log('Code:', err.code);
    console.log('Message:', err.message);
  }
}

testCreate().catch(console.error);

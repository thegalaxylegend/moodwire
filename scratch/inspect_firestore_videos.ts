import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "../service-account.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function main() {
  console.log("🔗 Inspecting Firestore collections for videos...");
  try {
    const collections = await db.listCollections();
    console.log("Collections found in Firestore:", collections.map(c => c.id).join(", "));

    // Check collections like 'topic_videos', 'videos', 'curated_videos'
    const targets = ['topic_videos', 'videos', 'curated_videos', 'discovered_videos'];
    for (const t of targets) {
      const snap = await db.collection(t).limit(5).get();
      console.log(`Collection '${t}' has documents? ${!snap.empty}`);
      if (!snap.empty) {
        // count docs
        const allSnap = await db.collection(t).select().get();
        console.log(`Collection '${t}' total document count: ${allSnap.size}`);
        
        console.log("Sample documents:");
        snap.forEach(doc => {
          console.log(`- Document ID: ${doc.id}`);
          console.log(JSON.stringify(doc.data(), null, 2));
        });
      }
    }
  } catch (e: any) {
    console.error("❌ Firestore inspection failed:", e.message);
  }
}

main().then(() => process.exit(0));

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------
// ADMIN INIT
// ----------------------
const serviceAccountPath = path.join(__dirname, "../service-account.json");
if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ Critical: service-account.json missing.");
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const BLOG_DIR = path.join(__dirname, '../src/content/blogs');

async function syncFirestore() {
    console.log("🚀 Jules: Syncing Firestore metadata...");

    const blogs = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    
    // Example logic: Update a general 'stats' doc or update specific topic records
    // Here we ensure the 'metadata' collection has entries for these blogs
    // so the search engine/sitemap logic knows they exist.

    const batch = db.batch();
    const metaRef = db.collection('content_metadata').doc('blogs');
    
    const blogList = blogs.map(b => b.replace('.md', ''));
    
    batch.set(metaRef, {
        active_blogs: blogList,
        last_updated: new Date().toISOString(),
        total_count: blogList.length
    }, { merge: true });

    // Also update individual topic coverage status if needed
    // This part is optional but good for ensuring 100% coverage reporting
    
    await batch.commit().catch(err => {
        if (err.message.includes('PERMISSION_DENIED')) {
            console.error("\n❌ FIREBASE PERMISSION ERROR:");
            console.error("The service account used in GITHUB SECRETS does not have 'Cloud Datastore User' role.");
            console.error("Please go to https://console.cloud.google.com/iam-admin/iam and grant 'Cloud Datastore User' to your service account email.\n");
        }
        throw err;
    });
    console.log(`✅ Firestore sync complete. ${blogList.length} blogs indexed.`);
}

syncFirestore().catch(err => {
    console.error("❌ Jules Firestore Sync Error:", err);
    process.exit(1);
});

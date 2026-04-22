/**
 * 💾 Firestore Auto-Backup (NEXUS v2)
 * 
 * Exports critical Firestore collections to JSON files
 * for disaster recovery. Keeps last 7 daily backups.
 * 
 * Uses existing service-account.json credentials.
 * 
 * Run: npx tsx scripts/firestore-backup.ts
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../jules-reports/backups');
const TODAY = new Date().toISOString().split('T')[0];
const MAX_BACKUPS = 7; // Keep 7 days of backups

// Collections to back up
const COLLECTIONS_TO_BACKUP = [
    'engine_questions',
    'blog_metadata',
    'user_test_history',
];

async function main() {
    console.log('💾 Firestore Auto-Backup\n');

    // Init Firebase Admin
    const serviceAccountPath = path.join(__dirname, '../service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
        console.warn('⚠️ service-account.json not found. Skipping Firestore backup.');
        return;
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }

    const db = admin.firestore();

    // Create backup directory
    const todayBackupDir = path.join(BACKUP_DIR, TODAY);
    if (!fs.existsSync(todayBackupDir)) {
        fs.mkdirSync(todayBackupDir, { recursive: true });
    }

    let totalDocs = 0;

    for (const collectionName of COLLECTIONS_TO_BACKUP) {
        try {
            console.log(`📦 Backing up: ${collectionName}...`);
            
            const snapshot = await db.collection(collectionName).get();
            
            if (snapshot.empty) {
                console.log(`   ⏭️ ${collectionName}: empty, skipping`);
                continue;
            }

            const docs: Record<string, any>[] = [];
            snapshot.forEach(doc => {
                docs.push({
                    _id: doc.id,
                    ...doc.data(),
                });
            });

            const outputPath = path.join(todayBackupDir, `${collectionName}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2));
            
            const sizeKb = Math.round(fs.statSync(outputPath).size / 1024);
            console.log(`   ✅ ${collectionName}: ${docs.length} docs (${sizeKb} KB)`);
            totalDocs += docs.length;
        } catch (err: any) {
            console.error(`   ❌ Failed to backup ${collectionName}: ${err.message}`);
        }
    }

    // Cleanup old backups (keep last MAX_BACKUPS days)
    if (fs.existsSync(BACKUP_DIR)) {
        const backupDirs = fs.readdirSync(BACKUP_DIR)
            .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
            .sort()
            .reverse();

        for (let i = MAX_BACKUPS; i < backupDirs.length; i++) {
            const oldDir = path.join(BACKUP_DIR, backupDirs[i]);
            fs.rmSync(oldDir, { recursive: true, force: true });
            console.log(`🗑️ Removed old backup: ${backupDirs[i]}`);
        }
    }

    console.log(`\n✨ Backup complete! ${totalDocs} total documents backed up.`);
    console.log(`📁 Location: ${todayBackupDir}`);
}

main().catch(err => {
    console.error('❌ Backup failed:', err);
    // Don't exit(1) — backup failure shouldn't break the pipeline
});

// Offline Sync Service — v2 (BUG-07 + BUG-08 fixes)
// BUG-07 FIX: No longer imports from questionEngine to break circular dependency.
// Instead, directly queries Firestore for cached questions.
import { openDB } from 'idb';
import { getWeakTopics } from './topicStrengthService';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

const DB_NAME = 'ExamCompassOffline';
const DB_VERSION = 1;

// BUG-08 FIX: Cooldown — only sync once per hour
const SYNC_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export const initOfflineDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('questions')) {
                db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta');
            }
        },
    });
};

export const offlineSyncService = {
    async preCacheWeakTopics(userId: string, userClass?: string, targetExam?: string) {
        try {
            // BUG-08 FIX: Check cooldown before running
            const idb = await initOfflineDB();
            const lastSync = await idb.get('meta', 'lastSync');
            if (lastSync && Date.now() - lastSync < SYNC_COOLDOWN_MS) {
                console.log('[OfflineSync] Cooldown active. Skipping pre-cache.');
                return;
            }

            console.log('[OfflineSync] Starting weak topics pre-cache...');
            const weakTopics = await getWeakTopics(userId, 3, userClass, targetExam);
            
            let questionsAdded = 0;
            const newQuestions: any[] = [];
            
            // BUG-07 FIX: Query Firestore directly instead of calling questionEngine
            // BUG-08 FIX: Only fetch 5 questions total (not 30!)
            for (const topicStat of weakTopics) {
                try {
                    const topicId = topicStat.topic.toLowerCase().replace(/\s+/g, '-');
                    const q = query(
                        collection(db, 'engine_questions'),
                        where('topic_id', '==', topicId),
                        orderBy('confidence', 'desc'),
                        limit(2) // 2 per topic × 3 topics = 6 max
                    );
                    const snap = await getDocs(q);
                    snap.forEach(doc => {
                        newQuestions.push({ id: doc.id, ...doc.data() });
                        questionsAdded++;
                    });
                } catch {
                    // Firestore permission or connectivity error — skip silently
                }
            }

            if (questionsAdded > 0) {
                const tx = idb.transaction('questions', 'readwrite');
                const store = tx.objectStore('questions');
                
                for (const q of newQuestions) {
                    await store.put(q);
                }
                
                await tx.done;
                await idb.put('meta', Date.now(), 'lastSync');
                console.log(`[OfflineSync] Pre-cached ${questionsAdded} questions for offline use.`);
            }
            
        } catch (error) {
            console.error('[OfflineSync] Failed to pre-cache questions:', error);
        }
    },
    
    async getOfflineQuestions(topic?: string, count: number = 10) {
        try {
            const idb = await initOfflineDB();
            const allQs = await idb.getAll('questions');
            let filtered = allQs;
            if (topic) {
                const topicLower = topic.toLowerCase();
                filtered = allQs.filter((q: any) => 
                    q.topic?.toLowerCase() === topicLower || 
                    q.topic_id?.toLowerCase() === topicLower.replace(/\s+/g, '-')
                );
            }
            // Shuffle with Fisher-Yates (better than sort-random)
            for (let i = filtered.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
            }
            return filtered.slice(0, count);
        } catch (error) {
            console.error('[OfflineSync] Failed to retrieve offline questions:', error);
            return [];
        }
    }
};

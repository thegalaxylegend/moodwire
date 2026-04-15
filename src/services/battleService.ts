import { db } from '../lib/firebase';
import { 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    onSnapshot, 
    query, 
    where, 
    serverTimestamp,
    getDocs,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';

export interface BattlePlayer {
    id: string;
    name: string;
    score: number;
    completed: boolean;
    ready: boolean;
}

export interface BattleSession {
    id?: string;
    status: 'waiting' | 'starting' | 'active' | 'completed' | 'abandoned';
    player1: BattlePlayer;
    player2?: BattlePlayer;
    subject: string;
    createdAt: any;
    questions?: any[];
}

// BUG-13 FIX: Max queue age in milliseconds (5 minutes)
const MAX_QUEUE_AGE_MS = 5 * 60 * 1000;

export const battleService = {
    // Join the matchmaking queue
    async joinQueue(userId: string, userName: string, subject: string): Promise<string> {
        try {
            const queueRef = collection(db, 'battle_sessions');
            const q = query(
                queueRef, 
                where('subject', '==', subject), 
                where('status', '==', 'waiting')
            );
            
            const snapshot = await getDocs(q);
            
            // BUG-04 FIX: Filter out own sessions AND stale sessions (BUG-13)
            const now = Date.now();
            const validSession = snapshot.docs.find(docSnap => {
                const data = docSnap.data();
                // Skip self-matches
                if (data.player1?.id === userId) return false;
                // BUG-13 FIX: Skip stale sessions older than 5 minutes
                if (data.createdAt) {
                    const createdMs = data.createdAt instanceof Timestamp 
                        ? data.createdAt.toMillis() 
                        : (typeof data.createdAt === 'number' ? data.createdAt : 0);
                    if (now - createdMs > MAX_QUEUE_AGE_MS) {
                        // Clean up stale session in background
                        deleteDoc(docSnap.ref).catch(() => {});
                        return false;
                    }
                }
                return true;
            });
            
            if (validSession) {
                // Join existing session
                await updateDoc(validSession.ref, {
                    status: 'starting',
                    player2: { id: userId, name: userName, score: 0, completed: false, ready: true }
                });
                return validSession.id;
            } else {
                // Create new session
                const newSessionRef = await addDoc(queueRef, {
                    subject,
                    status: 'waiting',
                    player1: { id: userId, name: userName, score: 0, completed: false, ready: true },
                    createdAt: serverTimestamp()
                });
                return newSessionRef.id;
            }
        } catch (e) {
            console.error('Error joining queue:', e);
            throw e;
        }
    },

    // Listen to session changes
    subscribeToSession(sessionId: string, callback: (session: BattleSession | null) => void) {
        if (!sessionId) return () => {};
        
        const docRef = doc(db, 'battle_sessions', sessionId);
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() } as BattleSession);
            } else {
                callback(null);
            }
        });
    },

    // Update player score
    async updateScore(sessionId: string, _playerId: string, isPlayer1: boolean, score: number) {
        const docRef = doc(db, 'battle_sessions', sessionId);
        const updateField = isPlayer1 ? 'player1.score' : 'player2.score';
        await updateDoc(docRef, {
            [updateField]: score
        });
    },

    // Mark player as completed
    async markCompleted(sessionId: string, isPlayer1: boolean) {
        const docRef = doc(db, 'battle_sessions', sessionId);
        const updateField = isPlayer1 ? 'player1.completed' : 'player2.completed';
        await updateDoc(docRef, {
            [updateField]: true
        });
    },

    // BUG-12 FIX: Only delete if waiting; otherwise mark abandoned
    async leaveQueue(sessionId: string) {
        try {
            const docRef = doc(db, 'battle_sessions', sessionId);
            const { getDoc } = await import('firebase/firestore');
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;
            
            const data = snap.data();
            if (data.status === 'waiting') {
                // Safe to delete — no opponent yet
                await deleteDoc(docRef);
            } else {
                // Match was in progress — mark abandoned so opponent gets notified
                await updateDoc(docRef, { status: 'abandoned' });
            }
        } catch (e) {
            // Fallback: try delete anyway
            try { await deleteDoc(doc(db, 'battle_sessions', sessionId)); } catch {}
        }
    }
};

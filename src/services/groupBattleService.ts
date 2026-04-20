import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    getDoc,
    onSnapshot,
    query,
    where,
    getDocs,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GroupPlayer {
    id: string;
    name: string;
    score: number;
    completed: boolean;
    joinedAt: number;
    completedAt?: number;
    answers?: Record<number, number>; // questionIndex -> optionIndex
}

export interface GroupBattleSession {
    id?: string;
    hostId: string;
    hostName: string;
    subject: string;
    inviteCode: string;
    status: 'waiting' | 'active' | 'completed';
    players: Record<string, GroupPlayer>; // keyed by playerId
    questions?: any[];
    maxPlayers: number;
    questionCount: number;
    timeLimit: number; // in seconds
    topic?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    createdAt: any;
    startedAt?: any;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a short 6-character alphanumeric invite code */
const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I/1/O/0
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const groupBattleService = {

    /**
     * Create a new group battle room
     */
    async createRoom(
        hostId: string,
        hostName: string,
        subject: string,
        maxPlayers: number = 10,
        topic: string = '',
        difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
    ): Promise<{ sessionId: string; inviteCode: string }> {
        const inviteCode = generateInviteCode();

        const sessionData: Omit<GroupBattleSession, 'id'> = {
            hostId,
            hostName,
            subject,
            inviteCode,
            status: 'waiting',
            players: {
                [hostId]: {
                    id: hostId,
                    name: hostName,
                    score: 0,
                    completed: false,
                    joinedAt: Date.now()
                }
            },
            maxPlayers,
            questionCount: 5,
            timeLimit: 15 * 60, // 15 minutes
            topic,
            difficulty,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'group_battles'), sessionData);
        return { sessionId: docRef.id, inviteCode };
    },

    /**
     * Join an existing room by invite code
     */
    async joinByCode(
        inviteCode: string,
        playerId: string,
        playerName: string
    ): Promise<string> {
        // Find session by invite code
        const q = query(
            collection(db, 'group_battles'),
            where('inviteCode', '==', inviteCode.toUpperCase()),
            where('status', '==', 'waiting')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            throw new Error('Room not found or already started. Check your code and try again.');
        }

        const sessionDoc = snapshot.docs[0];
        const sessionData = sessionDoc.data() as GroupBattleSession;

        // Check if already in room
        if (sessionData.players[playerId]) {
            return sessionDoc.id; // Already joined
        }

        // Check capacity
        const playerCount = Object.keys(sessionData.players).length;
        if (playerCount >= sessionData.maxPlayers) {
            throw new Error('Room is full!');
        }

        // Add player
        await updateDoc(sessionDoc.ref, {
            [`players.${playerId}`]: {
                id: playerId,
                name: playerName,
                score: 0,
                completed: false,
                joinedAt: Date.now()
            }
        });

        return sessionDoc.id;
    },

    /**
     * Join by session ID directly (from shared link)
     */
    async joinById(
        sessionId: string,
        playerId: string,
        playerName: string
    ): Promise<void> {
        const docRef = doc(db, 'group_battles', sessionId);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
            throw new Error('Battle room not found.');
        }

        const data = snap.data() as GroupBattleSession;

        if (data.status !== 'waiting') {
            throw new Error('Battle has already started or ended.');
        }

        if (data.players[playerId]) return; // Already in

        const playerCount = Object.keys(data.players).length;
        if (playerCount >= data.maxPlayers) {
            throw new Error('Room is full!');
        }

        await updateDoc(docRef, {
            [`players.${playerId}`]: {
                id: playerId,
                name: playerName,
                score: 0,
                completed: false,
                joinedAt: Date.now()
            }
        });
    },

    /**
     * Start the battle (host only) — attaches questions and sets status to active
     */
    async startBattle(sessionId: string, questions: any[]): Promise<void> {
        const docRef = doc(db, 'group_battles', sessionId);
        await updateDoc(docRef, {
            status: 'active',
            questions,
            startedAt: serverTimestamp()
        });
    },

    /**
     * Update a player's score
     */
    async updatePlayerScore(
        sessionId: string,
        playerId: string,
        score: number,
        answers: Record<number, number>
    ): Promise<void> {
        const docRef = doc(db, 'group_battles', sessionId);
        await updateDoc(docRef, {
            [`players.${playerId}.score`]: score,
            [`players.${playerId}.answers`]: answers
        });
    },

    /**
     * Update room configuration (question count and time limit)
     */
    async updateRoomConfig(sessionId: string, questionCount: number, timeLimit: number): Promise<void> {
        const docRef = doc(db, 'group_battles', sessionId);
        await updateDoc(docRef, {
            questionCount,
            timeLimit
        });
    },

    /**
     * Mark a player as completed (submitted or time ran out)
     */
    async markPlayerCompleted(sessionId: string, playerId: string, score: number): Promise<void> {
        const docRef = doc(db, 'group_battles', sessionId);
        await updateDoc(docRef, {
            [`players.${playerId}.completed`]: true,
            [`players.${playerId}.score`]: score,
            [`players.${playerId}.completedAt`]: Date.now()
        });

        // Check if ALL players completed → mark session as completed
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data() as GroupBattleSession;
            const allDone = Object.values(data.players).every(p => p.completed);
            if (allDone) {
                await updateDoc(docRef, { status: 'completed' });
            }
        }
    },

    /**
     * Force-complete the session (e.g. when timer expires)
     */
    async forceComplete(sessionId: string): Promise<void> {
        const docRef = doc(db, 'group_battles', sessionId);
        await updateDoc(docRef, { status: 'completed' });
    },

    /**
     * Subscribe to real-time session updates
     */
    subscribeToSession(
        sessionId: string,
        callback: (session: GroupBattleSession | null) => void
    ): () => void {
        if (!sessionId) return () => {};
        const docRef = doc(db, 'group_battles', sessionId);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback({ id: docSnap.id, ...docSnap.data() } as GroupBattleSession);
            } else {
                callback(null);
            }
        });
    },

    /**
     * Leave a room (before battle starts)
     */
    async leaveRoom(sessionId: string, playerId: string, isHost: boolean): Promise<void> {
        const docRef = doc(db, 'group_battles', sessionId);

        if (isHost) {
            // Host leaving = destroy the room
            await deleteDoc(docRef);
        } else {
            // Remove player from the map
            const snap = await getDoc(docRef);
            if (!snap.exists()) return;
            const data = snap.data() as GroupBattleSession;
            const newPlayers = { ...data.players };
            delete newPlayers[playerId];
            await updateDoc(docRef, { players: newPlayers });
        }
    },

    /**
     * Get session by invite code (for validation)
     */
    async getByInviteCode(inviteCode: string): Promise<GroupBattleSession | null> {
        const q = query(
            collection(db, 'group_battles'),
            where('inviteCode', '==', inviteCode.toUpperCase()),
            where('status', '==', 'waiting')
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as GroupBattleSession;
    }
};

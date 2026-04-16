import { db } from '../lib/firebase';
import { 
    doc, 
    collection, 
    query, 
    getDocs, 
    addDoc, 
    updateDoc, 
    arrayUnion, 
    increment, 
    serverTimestamp,
    orderBy,
    limit,
    runTransaction
} from 'firebase/firestore';

export interface Clan {
    id?: string;
    name: string;
    slogan: string;
    creatorId: string;
    members: string[];
    powerScore: number;
    memberCount: number;
    avatarUrl?: string;
    createdAt: any;
}

export const clanService = {
    /**
     * Creates a new study clan.
     */
    createClan: async (userId: string, name: string, slogan: string) => {
        const clanData: Omit<Clan, 'id'> = {
            name,
            slogan,
            creatorId: userId,
            members: [userId],
            powerScore: 0,
            memberCount: 1,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'clans'), clanData);
        
        // Link user to clan
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { clanId: docRef.id });

        return { id: docRef.id, ...clanData };
    },

    /**
     * Joins an existing clan.
     */
    joinClan: async (userId: string, clanId: string) => {
        const clanRef = doc(db, 'clans', clanId);
        const userRef = doc(db, 'users', userId);

        await runTransaction(db, async (transaction) => {
            const clanDoc = await transaction.get(clanRef);
            if (!clanDoc.exists()) throw new Error("Clan not found");
            
            const data = clanDoc.data();
            if (data.members.includes(userId)) return;

            transaction.update(clanRef, {
                members: arrayUnion(userId),
                memberCount: increment(1)
            });

            transaction.update(userRef, { clanId });
        });
    },

    /**
     * Fetches top-performing clans.
     */
    getTopClans: async (limitCount = 20) => {
        const q = query(
            collection(db, 'clans'),
            orderBy('powerScore', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Clan));
    },

    /**
     * Syncs XP gains to the clan power score.
     */
    syncXPToClan: async (clanId: string, xpGained: number) => {
        if (!clanId) return;
        const clanRef = doc(db, 'clans', clanId);
        await updateDoc(clanRef, {
            powerScore: increment(xpGained)
        });
    }
};

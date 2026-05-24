import { db } from '../lib/firebase';
import { doc, getDoc, increment, collection, runTransaction, writeBatch, query, where, getDocs, documentId } from 'firebase/firestore';

const REFERRAL_XP_BONUS = 500;
const REFEREE_XP_BONUS = 200;

export const generateReferralCode = (userId: string): string => {
    // Cryptographically secure generation of a 2-char random suffix
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(2);
    crypto.getRandomValues(array);
    const suffix = chars[array[0] % chars.length] + chars[array[1] % chars.length];
    const prefix = userId.slice(-4).toUpperCase();
    return `${prefix}${suffix}`;
};

export const getReferralStats = async (userId: string) => {
    try {
        const statsRef = doc(db, 'referral_stats', userId);
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
            return snap.data() as { count: number; total_xp_earned: number; codes_generated: string[] };
        }
        return { count: 0, total_xp_earned: 0, codes_generated: [] };
    } catch (e: unknown) {
        console.error("Error fetching referral stats", e);
        return null;
    }
};

export const claimReferralCode = async (code: string, newUserId: string) => {
    // 1. Validate Code
    if (!code || code.length < 4) return { success: false, message: "Invalid code format." };

    // Normalize
    const cleanCode = code.trim().toUpperCase();

    try {
        // Find owner of the code
        // We need a lookup because code is not just a user ID.
        // Option A: Store codes in a separate 'referral_codes' collection { code: "XYZ", ownerId: "UID" }
        // Option B: Query users collection where referralCode == code. (Requires index)

        // Let's use Option A for speed and scalability (KV lookup)
        const codeDoc = await getDoc(doc(db, 'referral_codes', cleanCode));

        if (!codeDoc.exists()) {
            return { success: false, message: "Referral code not found." };
        }

        const referrerId = codeDoc.data().owner_id;

        if (referrerId === newUserId) {
            return { success: false, message: "You cannot refer yourself." };
        }

        // 2. Process Referral (Transaction)
        await runTransaction(db, async (transaction) => {
            // Check if user already claimed a referral
            const userRef = doc(db, 'profiles', newUserId);
            const userSnap = await transaction.get(userRef);

            if (userSnap.exists() && userSnap.data().redeemed_referral) {
                throw "Already redeemed a referral code.";
            }

            // Award Referrer
            const referrerRef = doc(db, 'profiles', referrerId);
            transaction.update(referrerRef, {
                xp: increment(REFERRAL_XP_BONUS),
                referral_count: increment(1),
                total_referral_xp: increment(REFERRAL_XP_BONUS)
            });

            // Award Referee (New User)
            transaction.update(userRef, {
                xp: increment(REFEREE_XP_BONUS),
                redeemed_referral: true,
                referred_by: referrerId,
                referred_by_code: cleanCode
            });

            // Log/Tracking (Optional but good)
            const logRef = doc(collection(db, 'referral_logs'));
            transaction.set(logRef, {
                referrer_id: referrerId,
                referee_id: newUserId,
                code: cleanCode,
                timestamp: new Date().toISOString()
            });
        });

        // Update local store via userStore actions if needed,
        // but the listener in userStore for onAuthStateChanged/snapshot might handle it?
        // Actually userStore currently does one-time fetch. We might need to manually trigger skill/xp update.
        // For now, return success and let caller handle UI feedback.

        return { success: true, message: `Code applied! You got +${REFEREE_XP_BONUS} XP.` };

    } catch (e: unknown) {
        console.error("Referral claim failed", e);
        if (typeof e === 'string') return { success: false, message: e };
        return { success: false, message: "Failed to apply code. Please try again." };
    }
};

export const registerReferralCode = async (userId: string) => {
    // Checks if user has a code, if not generates and saves it.
    // Returns the code.
    try {
        const userRef = doc(db, 'profiles', userId);
        const snap = await getDoc(userRef);

        if (snap.exists() && snap.data().referral_code) {
            return snap.data().referral_code;
        }

        // Generate candidates
        const candidates = Array.from({ length: 5 }, () => generateReferralCode(userId));

        // Check collisions in batch
        const q = query(collection(db, 'referral_codes'), where(documentId(), 'in', candidates));
        const checkSnap = await getDocs(q);
        const existingCodes = new Set(checkSnap.docs.map(d => d.id));

        const code = candidates.find(c => !existingCodes.has(c));

        if (!code) throw new Error("Failed to generate unique code");

        const batch = writeBatch(db);

        // Let's just do sequential awaits for simplicity as this is a rare action per user.
        batch.set(doc(db, 'referral_codes', code), {
            owner_id: userId,
            created_at: new Date().toISOString()
        });

        batch.update(userRef, {
            referral_code: code
        });

        await batch.commit();

        return code;

    } catch (e: unknown) {
        console.error("Register code failed", e);
        return null;
    }
};

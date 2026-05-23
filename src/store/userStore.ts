import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, deleteUser, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { performDeepMigration } from '../migrationService';
import { SYLLABUS_DB } from '../lib/constants';
import type { DailyMission } from '../services/missionService';
import { DEFAULT_CALIBRATION, type CalibrationProfile } from '../services/eloService';
import { MissionService } from '../services/missionService';
import { getCurrentSeason, getCurrentPointCycle } from '../services/gamificationService';
import { getUserStats } from '../services/leaderboardService';
import { storageService } from '../services/storageService';
import { REFERRAL_TTL_MS, TEST_INACTIVITY_TTL_MS, PUBLIC_PROFILE_FIELDS, ADMIN_EMAILS } from '../lib/securityConfig';

export type User = {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    targetExam?: string;
    targetYear?: number;
    prepLevel?: string;
    streak: number;
    lastVisit?: string; // IPO Date String YYYY-MM-DD
    lastTestDate?: string;
    userClass?: string;
    onboardingCompleted: boolean;
    role?: 'user' | 'admin';
    skills?: {
        physics: number;
        chemistry: number;
        math: number;
        lastUpdated: string;
    };
    commonMistakes?: string[]; // Semantic memory for weak topics
    syllabusProgress?: number;
    recentChat?: { role: 'user' | 'bot'; text: string; timestamp: number }[];
    isGuest?: boolean;
    xp: number;
    totalPoints: number;
    lifetimeXp?: number;
    lastSeasonReset?: string;
    lastPointReset?: string;
    dailyStudyTime: number; // seconds
    lastStudyDate?: string;
    dailyChallengeCompleted?: boolean;
    lastStreakIncrementDate?: string;
    referralCode?: string;
    referralCount?: number;
    redeemedReferral?: boolean;
    abilityScore?: number; // Elo Rating
    calibrationProfile?: CalibrationProfile; // Per-subject difficulty calibration
    dailyMissions?: DailyMission[];
    examDate?: string; // ISO date string for exam countdown
    pendingPublicSync?: boolean; // Flag for public profile mirror retry
    pendingPrompts?: string[]; // e.g., ['exam_reconfirmation']
    promptSnoozedUntil?: string; // ISO timestamp
};

interface UserState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    authResolved: boolean;
    initialize: () => Promise<void>;
    logout: () => Promise<void>;
    loginAsGuest: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    updateSkill: (subject: 'physics' | 'chemistry' | 'math' | 'biology', delta: number) => Promise<void>;
    recordMistake: (topic: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    fetchSyllabusProgress: () => Promise<void>;
    addGains: (gains: { xp: number; pts: number }) => Promise<void>;
    recordActivity: (seconds: number) => Promise<void>;
    completeDailyChallenge: () => Promise<void>;
    refreshMissions: () => Promise<void>;
    completeMission: (missionId: string) => Promise<void>;
    syncUserData: () => Promise<void>;
    checkAbandonment: () => Promise<void>;
    onClassChange: (uid: string, oldClass: string, newClass: string, targetExam?: string) => Promise<boolean>;
}

// Helper to synchronously hydrate from localStorage (Optimistic Load)
const hydrateFromLocal = (uid?: string): User | null => {
    if (typeof window === 'undefined') return null;
    try {
        // 1. Try Scoped Cache first (if UID provided)
        if (uid) {
            const cachedAuth = localStorage.getItem(`exam_compass_auth_cache_${uid}`);
            if (cachedAuth) {
                const user = JSON.parse(cachedAuth);
                if (user && user.id === uid && !user.isGuest) return user;
            }
        }

        // 2. Try General Cache (Legacy/Startup)
        const cachedAuth = localStorage.getItem('exam_compass_auth_cache');
        if (cachedAuth) {
            const user = JSON.parse(cachedAuth);
            // Basic validity check
            if (user && user.id && !user.isGuest && (!uid || user.id === uid)) {
                return user;
            }
        }

        // 3. Fallback to Guest
        const fixedId = localStorage.getItem('exam_compass_fixed_guest_id');
        if (!fixedId) return null;

        const profileStr = localStorage.getItem(`guest_profile_${fixedId}`);
        if (!profileStr) return null;

        const profile = JSON.parse(profileStr);

        return {
            id: fixedId,
            email: `guest_${fixedId.slice(0, 6)}@examcompass.app`,
            name: profile.full_name || 'Guest Student',
            avatarUrl: profile.avatar_url,
            targetExam: profile.target_exam,
            targetYear: profile.target_year,
            prepLevel: profile.prep_level || 'Beginner',
            streak: profile.streak || 0,
            lastVisit: profile.last_visit,
            lastTestDate: profile.last_test_date,
            userClass: profile.user_class,
            onboardingCompleted: profile.onboarding_completed || false,
            role: profile.role || 'user',
            skills: profile.skills || { physics: 0.5, chemistry: 0.5, math: 0.5, lastUpdated: new Date().toISOString() },
            commonMistakes: profile.common_mistakes || [],
            syllabusProgress: 0,
            recentChat: profile.recent_chat || [],
            isGuest: true,
            xp: profile.xp || 0,
            totalPoints: profile.total_points || 0,
            dailyStudyTime: profile.daily_study_time || 0,
            lastStudyDate: profile.last_study_date,
            dailyChallengeCompleted: profile.daily_challenge_completed || false,
            lastStreakIncrementDate: profile.last_streak_increment_date,
            abilityScore: profile.ability_score || 1000,
            calibrationProfile: profile.calibration_profile || DEFAULT_CALIBRATION
        };
    } catch (e) {
        return null;
    }
};

const localUser = hydrateFromLocal();
let isAuthListenerAttached = false;
let classChangeInProgress = false;

export const useUserStore = create<UserState>((set, get) => ({
    user: localUser,
    isAuthenticated: !!localUser,
    isLoading: typeof window !== 'undefined' && !localUser, // Only load if no cache
    isInitialized: !!localUser, // Initialized if cache exists
    authResolved: false, // Wait for Firebase Auth SDK to fully establish session

    initialize: async () => {
        if (isAuthListenerAttached) return;
        isAuthListenerAttached = true;

        // OPTIMISTIC LOAD: Handle local state immediately
        if (get().isInitialized && !get().user?.isGuest) {
            // Keep existing profile but DO NOT set authResolved to true yet.
            // We MUST wait for Firebase to confirm the session.
        }

        const timeout = setTimeout(() => {
            if (!get().authResolved) {
                console.warn("🚨 [Auth] Initialization hang guard fired. Falling back to cached state.");
                set({ isLoading: false, isInitialized: true, authResolved: true });
            }
        }, 5000);

        onAuthStateChanged(auth, async (user) => {
            clearTimeout(timeout);
            console.log("🔑 [Auth] State Changed:", user ? `UID: ${user.uid}` : "Logged Out");

            // --- ABANDONMENT CHECK ---
            get().checkAbandonment();

            // --- SESSION COLLISION GUARD ---
            if (typeof window !== 'undefined') {
                const globalCacheRaw = localStorage.getItem('exam_compass_auth_cache');
                if (globalCacheRaw) {
                    try {
                        const globalCache = JSON.parse(globalCacheRaw);
                        // If UID mismatch, PURGE global data to prevent leak
                        if (user && globalCache.id && globalCache.id !== user.uid) {
                            console.warn("🚨 [Security] UID mismatch detected. Purging global stale caches.");
                            localStorage.removeItem('exam_compass_auth_cache');
                            localStorage.removeItem('exam_compass_local_history');
                            // Note: we don't clear sessionStorage entirely, just auth keys
                            sessionStorage.removeItem('referral_code'); 
                        }
                    } catch (e) { }
                }
            }

            if (user) {
                // --- MIGRATION & SYNC RETRY ---
                storageService.migrateGlobalHistory(user.uid);
                storageService.syncPendingTests(user.uid);

                let profile: any = null;
                let rawFirestoreProfile: any = null;

                try {
                    const docRef = doc(db, "profiles", user.uid);
                    console.log(`📡 [Firestore] Fetching profile for ${user.uid}...`);

                    let fetchFailed = false;
                    try {
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            profile = docSnap.data();
                        }
                    } catch (fetchErr: any) {
                        console.error("📡 [Firestore] Fetch failed:", fetchErr);
                        fetchFailed = true;
                    }

                    // CRITICAL: Capture the RAW state from Firestore before any local healing
                    rawFirestoreProfile = profile ? { ...profile } : null;

                    // Fallback to email search if no profile found
                    // SAFETY: Only create new profiles if the initial fetch succeeded (not a network error)
                    if (!profile && !user.isAnonymous && user.email) {
                        const searchEmail = user.email.toLowerCase().trim();
                        const profilesRef = collection(db, "profiles");
                        const q = query(profilesRef, where("email", "==", searchEmail), limit(1));

                        try {
                            const emailSnap = await getDocs(q);
                            if (!emailSnap.empty) {
                                const oldDoc = emailSnap.docs[0];
                                const oldProfile = oldDoc.data();
                                const oldUID = oldDoc.id;
                                console.log(`[userStore] Found existing profile ${oldUID}. Migrating.`);

                                profile = {
                                    ...oldProfile,
                                    full_name: user.displayName || oldProfile.full_name,
                                    avatar_url: user.photoURL || oldProfile.avatar_url,
                                    migration_source: oldUID,
                                    last_migration: new Date()
                                };
                                await setDoc(docRef, profile, { merge: true });
                                await updateDoc(oldDoc.ref, { migrated_to: user.uid });
                            } else if (!fetchFailed) {
                                // Only create a fresh profile if the initial getDoc succeeded
                                // (returned no doc). If getDoc FAILED (network error), skip creation
                                // to avoid overwriting a profile we couldn't read.
                                let migrationSource = null;
                                const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id');
                                if (fixedGuestId) migrationSource = fixedGuestId;

                                profile = {
                                    full_name: user.displayName || user.email?.split('@')[0] || 'User',
                                    email: user.email.toLowerCase().trim(),
                                    avatar_url: user.photoURL,
                                    created_at: new Date(),
                                    streak: 0,
                                    onboarding_completed: false,
                                    migration_source: migrationSource,
                                    role: (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) ? 'admin' : 'user'
                                };
                                await setDoc(docRef, profile, { merge: true });

                                // Referral will be processed in unified healing block
                            } else {
                                console.warn("⚠️ [Auth] Skipping profile creation — initial fetch failed (network error). Using cached data instead.");
                            }
                        } catch (queryErr) {
                            console.error("❌ Email lookup/creation failed:", queryErr);
                        }
                    }
                } catch (err) {
                    console.error("❌ Fatal profile error:", err);
                }

                // --- DATA RECOVERY & CONSOLIDATION ---
                const cached = hydrateFromLocal(user.uid);
                
                // A. Fallback to Cache if Firestore Fetch failed (or doc missing)
                if (!profile && cached && cached.id === user.uid && !cached.isGuest) {
                    console.log("🩹 [Fallback] No Firestore profile found. Hydrating from local cache.");
                    profile = {
                        full_name: cached.name,
                        email: cached.email || user.email,
                        avatar_url: cached.avatarUrl,
                        target_exam: cached.targetExam,
                        target_year: cached.targetYear,
                        user_class: cached.userClass,
                        prep_level: cached.prepLevel,
                        onboarding_completed: cached.onboardingCompleted,
                        streak: cached.streak,
                        xp: cached.xp,
                        total_points: cached.totalPoints,
                        lifetime_xp: cached.lifetimeXp,
                        skills: cached.skills,
                        daily_study_time: cached.dailyStudyTime,
                        last_study_date: cached.lastStudyDate,
                    };
                }

                // ... Streak Logic ...
                let currentStreak = profile?.streak || 0;
                if (user.isAnonymous) {
                    const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id');
                    let localProfileString = fixedGuestId ? localStorage.getItem(`guest_profile_${fixedGuestId}`) : null;
                    if (!localProfileString) localProfileString = localStorage.getItem(`guest_profile_${user.uid}`);

                    if (localProfileString) {
                        try {
                            const localProfile = JSON.parse(localProfileString);
                            profile = { ...profile, ...localProfile };
                            if (profile.streak) currentStreak = profile.streak;
                        } catch (e) { }
                    }
                }

                console.log(`👤 [Auth] User Detected: ${user.email} (Photo: ${user.photoURL})`);
                
                // --- SUPER ADMIN BOOTSTRAP ---
                if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                    console.log("🛡️ [Security] Bootstrap Admin Detected. Elevating privileges.");
                    if (profile) profile.role = 'admin';
                }

                // --- RECONCILIATION ---
                const currentSeason = getCurrentSeason();
                const currentPointCycle = getCurrentPointCycle();

                // 0. Intent & Referral Healing (Applies to ALL profiles if incomplete)
                if (profile && !profile.onboarding_completed) {
                    try {
                        // A. Check for Signup/URL Intent
                        const storedIntent = localStorage.getItem('exam_compass_intent');
                        if (storedIntent) {
                            const parsed = JSON.parse(storedIntent);
                            // TTL Check: Using REFERRAL_TTL_MS (24h)
                            if (parsed.savedAt && (Date.now() - parsed.savedAt < REFERRAL_TTL_MS)) {
                                console.log("🩹 [Healing] Applying stored intent to incomplete profile:", parsed);
                                profile.user_class = profile.user_class || parsed.class;
                                profile.target_exam = profile.target_exam || parsed.exam;
                                profile.target_year = profile.target_year || parsed.year;
                                
                                // Removed auto-completion here to force users to confirm on onboarding page
                                // if (profile.user_class && profile.target_exam) {
                                //     console.log("🩹 [Healing] Auto-completing onboarding via healed intent.");
                                //     profile.onboarding_completed = true;
                                // }
                            } else {
                                localStorage.removeItem('exam_compass_intent');
                            }
                        }

                        // B. Check for Referral
                        const storedRef = localStorage.getItem('referral_code');
                        if (storedRef) {
                            const parsed = JSON.parse(storedRef);
                            // TTL Check: Using REFERRAL_TTL_MS (24h)
                            if (parsed.savedAt && (Date.now() - parsed.savedAt < REFERRAL_TTL_MS)) {
                                console.log("🩹 [Healing] Claiming referral code from localStorage.");
                                const { claimReferralCode } = await import('../services/referralService');
                                await claimReferralCode(parsed.code, user.uid);
                            }
                            localStorage.removeItem('referral_code');
                        }
                    } catch (e) {
                        console.error("🩹 [Healing] Intent/Referral recovery failed:", e);
                    }
                }

                // 0.5. Strict Onboarding Check (Only explicit flags count)
                const hasOnboardingDone = 
                    profile?.onboarding_completed === true || 
                    profile?.onboardingCompleted === true || 
                    String(profile?.onboarding_completed) === 'true' ||
                    String(profile?.onboardingCompleted) === 'true';

                // Healing Case A: Sync from Lifetime XP or Leaderboard (Restores rank for all users)
                if (profile && (profile.xp || 0) < (profile.lifetime_xp || 0)) {
                    console.log(`🩹 [Integrity] Restoring XP from Lifetime records: ${profile.xp} -> ${profile.lifetime_xp}`);
                    profile.xp = profile.lifetime_xp;
                } else if (profile && (profile.xp || 0) === 0) {
                    // DEEP RECOVERY: If profile XP is wiped, check the Leaderboard for the current month
                    console.log("🕵️‍♂️ [Integrity] XP is 0. Checking Leaderboard for historical standings...");
                    try {
                        const stats = await getUserStats(user.uid);
                        if (stats && stats.xp > 0) {
                            console.log(`🕵️‍♂️ [Integrity] XP recovered from Leaderboard: ${stats.xp}`);
                            profile.xp = stats.xp;
                            profile.lifetime_xp = Math.max(profile.lifetime_xp || 0, stats.xp);
                        }
                    } catch (e) {
                        console.warn("🕵️‍♂️ [Integrity] Leaderboard recovery failed:", e);
                    }
                }

                // Healing Case B: Ghost Wipe restoration (Has progress but onboarding=false)
                // NOTE: We no longer auto-complete onboarding here. Users must go through the onboarding page.
                // Data (XP, streak, etc.) is preserved but does not bypass onboarding.
                if (profile && !hasOnboardingDone && ((profile.xp || 0) > 0 || (profile.total_points || 0) > 0 || (profile.streak || 0) > 0)) {
                    console.log("🩹 [Integrity] Ghost Wipe detected. Data preserved but onboarding still required.");
                }
                
                // Healing Case C: Inference Healing (Reconstruct Identity from history)
                // If userClass/exam is missing but they have progress, try to "Guess" from Syllabus items or Diagnostic results
                if (profile && (!profile.target_exam && !profile.targetExam) && (profile.xp || 0) > 0) {
                    console.log("🕵️‍♂️ [Inference] Identity missing. Searching historical records...");
                    try {
                        const diagQ = query(collection(db, 'diagnostic_results'), where('user_id', '==', user.uid), limit(1));
                        const diagSnap = await getDocs(diagQ);
                        if (!diagSnap.empty) {
                            const historical = diagSnap.docs[0].data();
                            console.log("🕵️‍♂️ [Inference] Identity reconstructed from Diagnostic results.");
                            profile.target_exam = historical.exam;
                            profile.user_class = historical.class;
                            // NOTE: Do NOT auto-complete onboarding — user must confirm on onboarding page
                        }
                    } catch (e) {
                        console.warn("🕵️‍♂️ [Inference] Identity reconstruction failed:", e);
                    }
                }

                // Final check: Removed auto-onboarding. Users must explicitly complete onboarding.
                // Having exam data alone is not sufficient — the user must confirm via the onboarding form.

                // 1. Fix corrupted cycle fields if they contain data meant for the other cycle
                if (profile?.last_season_reset?.includes('-P') && profile?.last_point_reset?.includes('-S')) {
                    console.log("🩹 [Healing] Found Swapped Cycle Fields. Restoring data.");
                    const tempSeason = profile.last_season_reset;
                    profile.last_season_reset = profile.last_point_reset;
                    profile.last_point_reset = tempSeason;
                } else if (profile?.last_season_reset?.includes('-P')) {
                    console.log("🩹 [Healing] Found Point Cycle in Season field. Resetting.");
                    profile.last_season_reset = currentSeason;
                }
                else if (profile?.last_point_reset?.includes('-S')) {
                    console.log("🩹 [Healing] Found Season Cycle in Point field. Resetting.");
                    profile.last_point_reset = currentPointCycle;
                }

                // 2. Reconciliation: Compare Cache vs Current Profile (Fires for existing users too)
                if (cached && cached.id === user.uid && !cached.isGuest) {
                    // Check if cache has better stats or status
                    const needsRecovery = 
                        (cached.xp || 0) > (profile?.xp || 0) || 
                        (cached.onboardingCompleted && !profile?.onboarding_completed);

                    if (needsRecovery) {
                        console.log(`🩹 [Reconciliation] Local Cache > Current Data. Merging improvements.`);
                        profile = { 
                            ...profile, 
                            xp: Math.max(cached.xp || 0, profile?.xp || 0), 
                            total_points: Math.max(cached.totalPoints || 0, profile?.total_points || 0),
                            lifetime_xp: Math.max(cached.lifetimeXp || 0, profile?.lifetime_xp || 0),
                            // If either is true, it's true.
                            onboarding_completed: profile?.onboarding_completed || cached.onboardingCompleted,
                            user_class: profile?.user_class || cached.userClass,
                            target_exam: profile?.target_exam || cached.targetExam,
                            full_name: profile?.full_name || cached.name
                        };
                    }
                }

                console.log(`📡 [Profile] Firestore Data (processed):`, profile);

                const finalUserObj: User = {
                    id: user.uid,
                    email: user.email || `guest_${user.uid.slice(0, 6)}@examcompass.app`,
                    name: profile?.full_name || (user.isAnonymous ? 'Guest Student' : user.email?.split('@')[0] || 'User'),
                    avatarUrl: (profile?.avatar_url && profile.avatar_url.trim().length > 0) ? profile.avatar_url : (user.photoURL || undefined),
                    targetExam: profile?.target_exam || profile?.targetExam,
                    targetYear: profile?.target_year || profile?.targetYear,
                    prepLevel: profile?.prep_level || profile?.prepLevel,
                    streak: currentStreak,
                    lastVisit: profile?.last_visit || profile?.lastVisit,
                    lastTestDate: profile?.last_test_date || profile?.lastTestDate,
                    userClass: profile?.user_class || profile?.userClass,
                    onboardingCompleted: !!(profile?.onboarding_completed === true || profile?.onboardingCompleted === true || String(profile?.onboarding_completed) === 'true' || String(profile?.onboardingCompleted) === 'true'),
                    role: profile?.role || 'user',
                    skills: profile?.skills || { physics: 0.5, chemistry: 0.5, math: 0.5, lastUpdated: new Date().toISOString() },
                    commonMistakes: profile?.common_mistakes || [],
                    recentChat: profile?.recent_chat || [],
                    isGuest: user.isAnonymous,
                    xp: profile?.xp || 0,
                    totalPoints: profile?.total_points || 0,
                    lifetimeXp: profile?.lifetime_xp || 0,
                    lastSeasonReset: profile?.last_season_reset || getCurrentSeason(),
                    lastPointReset: profile?.last_point_reset || getCurrentPointCycle(),
                    dailyStudyTime: profile?.daily_study_time || 0,
                    lastStudyDate: profile?.last_study_date,
                    dailyChallengeCompleted: profile?.daily_challenge_completed || false,
                    lastStreakIncrementDate: profile?.last_streak_increment_date,
                    referralCode: profile?.referral_code,
                    referralCount: profile?.referral_count || 0,
                    redeemedReferral: profile?.redeemed_referral || false,
                    abilityScore: profile?.ability_score || 1000,
                    calibrationProfile: profile?.calibration_profile || DEFAULT_CALIBRATION,
                    examDate: profile?.exam_date
                };

                set({
                    isAuthenticated: true,
                    isInitialized: true,
                    authResolved: true,
                    isLoading: false,
                    user: finalUserObj
                });
                
                console.log(`✅ [UserStore] Final User Object:`, finalUserObj);

                // CACHE FOR INSTANT LOAD
                if (!user.isAnonymous) {
                    localStorage.setItem('exam_compass_auth_cache', JSON.stringify(finalUserObj));
                    localStorage.setItem(`exam_compass_auth_cache_${user.uid}`, JSON.stringify(finalUserObj));
                    // Cleanup intent once successfully authenticated
                    localStorage.removeItem('exam_compass_intent');
                    // Trigger Background Syncs
                    get().syncUserData();
                }

                // --- DUAL-CYCLE RESET LOGIC ---
                const todayStr = new Date().toISOString().split('T')[0];
                const userState = get().user;

                if (userState) {
                    const updates: Partial<User> = {};
                    console.log("🔍 [UserStore] Analyzing profile for sync/healing...");

                    // 0. Sync Healed Data to Firestore (Class, Exam, Onboarding status)
                    // We compare against rawFirestoreProfile to see if healing happened
                    if (userState.userClass && userState.userClass !== rawFirestoreProfile?.user_class) {
                        console.log(`🩹 [Sync] Healing userClass: ${rawFirestoreProfile?.user_class} -> ${userState.userClass}`);
                        updates.userClass = userState.userClass;
                    }
                    if (userState.targetExam && userState.targetExam !== rawFirestoreProfile?.target_exam) {
                        console.log(`🩹 [Sync] Healing targetExam: ${rawFirestoreProfile?.target_exam} -> ${userState.targetExam}`);
                        updates.targetExam = userState.targetExam;
                    }
                    if (userState.onboardingCompleted && !rawFirestoreProfile?.onboarding_completed) {
                        console.log("🩹 [Sync] Healing onboardingCompleted: false -> true");
                        updates.onboardingCompleted = true;
                    }

                    // 1. Daily Reset (Study Time & Challenge)
                    if (userState.lastStudyDate !== todayStr) {
                        console.log("🌅 [Daily] Resetting study progress for new day.");
                        updates.dailyStudyTime = 0;
                        updates.lastStudyDate = todayStr;
                        updates.dailyChallengeCompleted = false;

                        // Check if streak was missed (yesterday was neither lastStreakIncrementDate nor lastStudyDate)
                        const lastInc = userState.lastStreakIncrementDate;
                        if (lastInc) {
                            const lastDate = new Date(lastInc);
                            const diff = (new Date(todayStr).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
                            if (diff > 1) {
                                console.log("💔 [Streak] Streak broken. Resetting to 0.");
                                updates.streak = 0;
                            }
                        }
                    }

                    // 2. XP Reset (Rank Season - Odd Months)
                    if (userState.lastSeasonReset !== currentSeason || !rawFirestoreProfile?.last_season_reset) {
                        if (!rawFirestoreProfile?.last_season_reset) {
                            console.log("🩹 [Healing] Missing Season Reset field. Locking in current season.");
                            updates.lastSeasonReset = currentSeason;
                        } else {
                            console.log(`🌀 [XP Cycle] New Season: ${currentSeason}. Archiving XP...`);
                            const oldXP = userState.xp || 0;
                            updates.xp = 0;
                            updates.lifetimeXp = (userState.lifetimeXp || 0) + oldXP;
                            updates.lastSeasonReset = currentSeason;
                        }
                    }

                    // 3. Points Reset (Point Cycle - Even Months)
                    if (userState.lastPointReset !== currentPointCycle || !rawFirestoreProfile?.last_point_reset) {
                        if (!rawFirestoreProfile?.last_point_reset) {
                            console.log("🩹 [Healing] Missing Point Reset field. Locking in current cycle.");
                            updates.lastPointReset = currentPointCycle;
                        } else {
                            console.log(`💎 [Point Cycle] New Cycle: ${currentPointCycle}. Resetting Points...`);
                            updates.totalPoints = 0;
                            updates.lastPointReset = currentPointCycle;
                        }
                    }

                    if (Object.keys(updates).length > 0) {
                        console.log("📤 [UserStore] Pushing initialization updates to Firestore:", updates);
                        try {
                            await get().updateProfile(updates);
                        } catch (e) {
                            console.error("⚠️ [UserStore] Non-critical sync update failed:", e);
                        }
                    } else {
                        console.log("✅ [UserStore] Profile is stable and synced.");
                    }
                }

                // --- CRITICAL RECOVERY: If a migration happened, trigger deep data move ---
                if (profile?.migration_source) {
                    performDeepMigration(profile.migration_source, user.uid);
                }

                // --- LOCAL HISTORY MIGRATION (Idempotent) ---
                storageService.migrateGlobalHistory(user.uid);
            } else {
                // LOGGED OUT — BUT BE CAREFUL about race conditions.
                // Firebase can fire 'null' temporarily during token refresh.
                // If we have a valid cached user, don't wipe immediately.
                const cachedUser = hydrateFromLocal();
                if (cachedUser && !cachedUser.isGuest) {
                    // Keep cached user alive for now — wait for potential re-auth
                    console.log("🔑 [Auth] Null state received but valid cache exists. Keeping cached session for 8s grace period.");
                    set({ 
                        user: cachedUser, 
                        isAuthenticated: true, 
                        isLoading: false, 
                        isInitialized: true, 
                        authResolved: true 
                    });
                    
                    // Set a delayed check: if after 8s we still have no Firebase user, THEN clear
                    setTimeout(() => {
                        if (!auth.currentUser) {
                            console.log("🔑 [Auth] Grace period expired. No re-auth detected. Clearing session.");
                            localStorage.removeItem('exam_compass_auth_cache');
                            const guest = hydrateFromLocal(); // try guest fallback
                            if (guest) {
                                set({ user: guest, isAuthenticated: true, isLoading: false, isInitialized: true, authResolved: true });
                            } else {
                                set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true, authResolved: true });
                            }
                        } else {
                            console.log("🔑 [Auth] Re-auth confirmed after grace period. Session preserved.");
                        }
                    }, 8000); // Increased to 8s to accommodate slow dev API response
                } else {
                    // No valid cache: truly logged out
                    localStorage.removeItem('exam_compass_auth_cache');
                    const local = hydrateFromLocal(); // Fallback to guest
                    if (local) {
                        set({ user: local, isAuthenticated: true, isLoading: false, isInitialized: true, authResolved: true });
                    } else {
                        set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true, authResolved: true });
                    }
                }
            }
        });
    },

    // --- ABANDONMENT LOGIC ---
    checkAbandonment: async () => {
        const { user } = get();
        if (!user) return;
        
        const cachedSession = sessionStorage.getItem('active_test_session');
        if (cachedSession) {
            try {
                const data = JSON.parse(cachedSession);
                const isTooOld = (Date.now() - (data.timestamp || 0)) > TEST_INACTIVITY_TTL_MS;
                if (isTooOld) {
                    console.log("🧹 [Abandonment] Active test session is stale (>30m). Clearing.");
                    sessionStorage.removeItem('active_test_session');
                }
            } catch (e) { }
        }
    },

    syncUserData: async () => {
        const { user } = get();
        if (!user || user.isGuest) return;

        // --- PUBLIC PROFILE SYNC ---
        // Mirror safe fields to help with leaderboards/referrals without exposing private data
        try {
            const publicRef = doc(db, "public_profiles", user.id);
            const publicData: any = {
                updated_at: serverTimestamp()
            };

            // Mirror only allowed fields
            PUBLIC_PROFILE_FIELDS.forEach(field => {
                // Map snake_case or camelCase correctly
                if (field === 'full_name') publicData.full_name = user.name;
                if (field === 'avatar_url') publicData.avatar_url = user.avatarUrl;
                if (field === 'xp') publicData.xp = user.xp;
            });

            await setDoc(publicRef, publicData, { merge: true });
            
            // Success: clear pending flag if it was set
            if (user.pendingPublicSync) {
                const updatedUser = { ...user, pendingPublicSync: false };
                set({ user: updatedUser });
                localStorage.setItem(`exam_compass_auth_cache_${user.id}`, JSON.stringify(updatedUser));
            }
            console.log("📡 [Sync] Public profile mirrored.");
        } catch (e) {
            console.warn("📡 [Sync] Public profile mirror failed (queueing retry):", e);
            if (!user.pendingPublicSync) {
                const updatedUser = { ...user, pendingPublicSync: true };
                set({ user: updatedUser });
                localStorage.setItem(`exam_compass_auth_cache_${user.id}`, JSON.stringify(updatedUser));
            }
        }

        // --- PENDING TESTS SYNC ---
        await storageService.syncPendingTests(user.id);
    },

    onClassChange: async (uid: string, oldClass: string, newClass: string, targetExam?: string) => {
        if (classChangeInProgress) return false;
        classChangeInProgress = true;
        
        console.log(`🎓 [Transition] Advancement from ${oldClass} to ${newClass} detected.`);
        
        try {
            const isCompetitive = ['JEE', 'NEET'].includes(targetExam || '');
            
            // 1. ARCHIVE (Gated)
            if (!isCompetitive) {
                try {
                    console.log(`📦 [Archive] Snapshoting Class ${oldClass} stats...`);
                    // We reach for current local performance map
                    const performanceKey = `exam_compass_performance_${uid}`;
                    const localPerfRaw = localStorage.getItem(performanceKey);
                    
                    if (localPerfRaw) {
                        const archiveRef = doc(db, "profiles", uid, "archives", `stats_${oldClass}`);
                        await setDoc(archiveRef, {
                            stats: JSON.parse(localPerfRaw),
                            archived_at: serverTimestamp(),
                            class: oldClass
                        });
                        console.log("✅ [Archive] Success.");
                    }
                } catch (archiveErr) {
                    console.error("❌ [Archive] Failed. Aborting transition to protect data.", archiveErr);
                    classChangeInProgress = false;
                    return false; // Signal failure
                }
            } else {
                console.log("⏩ [Transition] Competitive exam user. Skipping archive to keep Class 11 stats active.");
            }

            // 2. EXPLICIT CLEANUP (Specific Keys)
            console.log("🧹 [Transition] Clearing stale caches...");
            const keysToClear = [
                `exam_compass_chapters_${uid}`,
                `exam_compass_performance_${uid}`,
                `exam_compass_active_test_${uid}` // Mid-test discard
            ];
            
            keysToClear.forEach(k => {
                localStorage.removeItem(k);
                sessionStorage.removeItem(k); // Just in case
            });
            // Also clear the actual session storage for tests (if any)
            sessionStorage.removeItem('active_test_session');

            // 3. PERSISTENT PROMPT
            const docRef = doc(db, "profiles", uid);
            await setDoc(docRef, {
                pending_prompts: ['exam_reconfirmation'],
                updated_at: serverTimestamp()
            }, { merge: true });
            
            console.log("✅ [Transition] Finalized. Prompt queued.");
            return true;
        } catch (fatalErr) {
            console.error("❌ [Transition] Fatal error during class change:", fatalErr);
            return false;
        } finally {
            classChangeInProgress = false;
        }
    },

    updateProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        const newUser = { ...user, ...data };
        set({ user: newUser });

        if (!user.isGuest) {
            localStorage.setItem('exam_compass_auth_cache', JSON.stringify(newUser));
            localStorage.setItem(`exam_compass_auth_cache_${user.id}`, JSON.stringify(newUser));
        }

        const updates: any = { updated_at: new Date() };
        if (data.targetExam !== undefined) updates.target_exam = data.targetExam;
        if (data.targetYear !== undefined) updates.target_year = data.targetYear;
        if (data.prepLevel !== undefined) updates.prep_level = data.prepLevel;
        if (data.streak !== undefined) updates.streak = data.streak;
        if (data.lastTestDate !== undefined) updates.last_test_date = data.lastTestDate;
        if (data.name !== undefined) updates.full_name = data.name;
        if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;
        if (data.userClass !== undefined) updates.user_class = data.userClass;
        if (data.onboardingCompleted !== undefined) updates.onboarding_completed = data.onboardingCompleted;
        if (data.skills !== undefined) updates.skills = data.skills;
        if (data.commonMistakes !== undefined) updates.common_mistakes = data.commonMistakes;
        if (data.recentChat !== undefined) updates.recent_chat = data.recentChat;
        if (data.xp !== undefined) updates.xp = data.xp;
        if (data.totalPoints !== undefined) updates.total_points = data.totalPoints;
        if (data.lifetimeXp !== undefined) updates.lifetime_xp = data.lifetimeXp;
        if (data.lastSeasonReset !== undefined) updates.last_season_reset = data.lastSeasonReset;
        if (data.lastPointReset !== undefined) updates.last_point_reset = data.lastPointReset;
        if (data.dailyStudyTime !== undefined) updates.daily_study_time = data.dailyStudyTime;
        if (data.lastStudyDate !== undefined) updates.last_study_date = data.lastStudyDate;
        if (data.dailyChallengeCompleted !== undefined) updates.daily_challenge_completed = data.dailyChallengeCompleted;
        if (data.lastStreakIncrementDate !== undefined) updates.last_streak_increment_date = data.lastStreakIncrementDate;
        if (data.referralCode !== undefined) updates.referral_code = data.referralCode;
        if (data.referralCount !== undefined) updates.referral_count = data.referralCount;
        if (data.redeemedReferral !== undefined) updates.redeemed_referral = data.redeemedReferral;
        if (data.abilityScore !== undefined) updates.ability_score = data.abilityScore;
        if (data.calibrationProfile !== undefined) updates.calibration_profile = data.calibrationProfile;
        if (data.examDate !== undefined) updates.exam_date = data.examDate;

        try {
            if (!user.isGuest) {
                console.log(`📡 [Firestore] Updating profile for ${user.id}:`, updates);
                const docRef = doc(db, "profiles", user.id);

                // --- CLASS CHANGE DETECTION (Read-Before-Write) ---
                if (data.userClass && data.userClass !== user.userClass) {
                    const success = await get().onClassChange(user.id, user.userClass || 'General', data.userClass, user.targetExam);
                    if (!success) {
                        // If onClassChange failed/aborted, do not commit the profile update.
                        console.warn("🚫 [Transition] Aborted profile update due to archive failure.");
                        return;
                    }
                }

                await setDoc(docRef, updates, { merge: true });
                console.log(`✅ [Firestore] Profile updated successfully.`);

                // Reactive Mirroring: trigger mirror sync if relevant fields changed
                const mirrorChanged = PUBLIC_PROFILE_FIELDS.some(f => {
                   if (f === 'full_name' && data.name !== undefined) return true;
                   if (f === 'avatar_url' && data.avatarUrl !== undefined) return true;
                   if (f === 'xp' && data.xp !== undefined) return true;
                   return false;
                });

                if (mirrorChanged) {
                    get().syncUserData(); // This handles mirroring logic & retry flag
                }
            }
        } catch (error: any) {
            console.error('❌ [Firestore] Profile update failed:', error.message);
            // Revert local state and re-throw on critical updates (onboarding completion)
            if (data.onboardingCompleted === true) {
                set({ user: { ...user } }); // Revert to pre-update user
                if (!user.isGuest) {
                    localStorage.setItem('exam_compass_auth_cache', JSON.stringify(user));
                }
                throw error;
            }
        }

        if (auth.currentUser?.isAnonymous) {
            let fixedId = localStorage.getItem('exam_compass_fixed_guest_id');
            if (!fixedId) {
                fixedId = user.id;
                localStorage.setItem('exam_compass_fixed_guest_id', fixedId as string);
            }
            const existing = JSON.parse(localStorage.getItem(`guest_profile_${fixedId}`) || '{}');
            const newContent = JSON.stringify({ ...existing, ...updates });
            localStorage.setItem(`guest_profile_${fixedId}`, newContent);
        }
    },

    logout: async () => {
        const uid = auth.currentUser?.uid; // Read fresh from auth
        
        // 1. Clear Global Keys (Security)
        localStorage.removeItem('exam_compass_auth_cache');
        localStorage.removeItem('exam_compass_local_history');
        localStorage.removeItem('exam_compass_intent');

        // 2. Conditional Referral Clear
        const refRaw = localStorage.getItem('referral_code');
        if (refRaw) {
            try {
                const parsed = JSON.parse(refRaw);
                const isOld = (Date.now() - (parsed.savedAt || 0)) > REFERRAL_TTL_MS;
                // Clear if old or if we have a mismatching UID (but here we are logging out, 
                // so we only keep it if it's fresh and might be used by a guest/new signup)
                if (isOld) localStorage.removeItem('referral_code');
            } catch (e) {
                localStorage.removeItem('referral_code');
            }
        }

        // 3. Clear Scoped Cache
        if (uid) {
            localStorage.removeItem(`exam_compass_auth_cache_${uid}`);
            localStorage.removeItem(`syllabus_cache_${uid}`);
            localStorage.removeItem(`guest_profile_${uid}`);
        }

        await signOut(auth);
        set({ user: null, isAuthenticated: false });
        
        // Force redirect
        window.location.href = '/login';
    },

    loginAsGuest: async () => {
        await signInAnonymously(auth);
    },

    deleteAccount: async () => {
        if (auth.currentUser) {
            try {
                const fixedId = localStorage.getItem('exam_compass_fixed_guest_id');
                if (fixedId) {
                    localStorage.removeItem(`guest_profile_${fixedId}`);
                    localStorage.removeItem('exam_compass_fixed_guest_id');
                }
                await deleteUser(auth.currentUser);
                set({ user: null, isAuthenticated: false });
            } catch (error) {
                console.error("Error deleting account:", error);
                await signOut(auth);
                set({ user: null, isAuthenticated: false });
            }
        }
    },

    updateSkill: async (subject, delta) => {
        const { user, updateProfile } = get();
        if (!user || !user.skills) return;

        // Normalize subject to match schema keys
        const key = subject.toLowerCase() as keyof typeof user.skills;
        if (!['physics', 'chemistry', 'math'].includes(key)) return;

        const currentVal = (user.skills as any)[key] || 0.5;
        let newVal = currentVal + delta;

        // Clamp between 0.1 and 1.0 (never 0)
        if (newVal > 1.0) newVal = 1.0;
        if (newVal < 0.1) newVal = 0.1;

        const newSkills = {
            ...user.skills,
            [key]: Number(newVal.toFixed(2)),
            lastUpdated: new Date().toISOString()
        };

        // Dispatch update (this handles both local & firestore)
        await updateProfile({ skills: newSkills });
    },

    recordMistake: async (topic) => {
        const { user, updateProfile } = get();
        if (!user) return;

        const currentMistakes = user.commonMistakes || [];
        // Avoid duplicates and cap at 20 items to prevent bloat
        if (currentMistakes.includes(topic)) return;

        const newMistakes = [...currentMistakes, topic].slice(-20);
        await updateProfile({ commonMistakes: newMistakes });
    },

    fetchSyllabusProgress: async () => {
        const { user } = get();
        if (!user?.id || user.isGuest) return; // Skip for guests

        // Don't refetch if we already have it (basic caching)
        if (user.syllabusProgress !== undefined) return;

        try {
            const currentAuthUser = auth.currentUser;
            if (!currentAuthUser) {
                if (get().authResolved) {
                    console.warn("[Syllabus] No authenticated Firebase user. Skipping fetch.");
                }
                return;
            }

            console.log(`[Syllabus] Querying for AuthUID: ${currentAuthUser.uid}, Class: ${user.userClass}, Exam: ${user.targetExam}`);
            
            const cacheKey = `syllabus_cache_${currentAuthUser.uid}_${user.userClass || 'General'}_${user.targetExam || 'General'}`;
            
            // 1. Optimistic Load from Cache
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    // Check if cache is fresh (1 hour)
                    if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
                        set({ user: { ...user, syllabusProgress: parsed.progress } });
                    }
                } catch (e) {}
            }

            // Partition by user_id, user_class, and target_exam
            let q = query(
                collection(db, "syllabus"), 
                where("user_id", "==", currentAuthUser.uid)
            );

            const normUserClass = user.userClass ? user.userClass.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim() : '';
            const targetExam = user.targetExam?.toLowerCase() || 'jee';
            const isComp = ['jee', 'neet'].some(e => targetExam.includes(e));
            const isDropper = normUserClass.includes('dropper');

            if (user.userClass) {
                if (isComp || isDropper) {
                    q = query(q, where("user_class", "in", ["Class 11th", "Class 12th", "Class 11", "Class 12", "Dropper", "dropper"]));
                } else {
                    q = query(q, where("user_class", "==", user.userClass));
                }
            }
            if (user.targetExam) {
                q = query(q, where("target_exam", "==", user.targetExam));
            }

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => doc.data());

            // --- REFINED COVERAGE LOGIC ---
            // Calculate progress against total topics in DB for the user's exam AND class
            let totalPossibleTopics = 0;
            const userClass = user.userClass;
            const isMedical = targetExam.includes('neet') || targetExam.includes('medical');

            // Filter subjects by exam type
            const relevantSubjects = Object.keys(SYLLABUS_DB).filter(s => {
                const sLow = s.toLowerCase();
                if (isMedical) return sLow !== 'mathematics'; // NEET: Bio, Phy, Chem
                return sLow !== 'biology'; // JEE/Other: Math, Phy, Chem
            });

            relevantSubjects.forEach(sub => {
                // Filter topics by the user's current class
                const classTopics = SYLLABUS_DB[sub].filter(t => {
                    if (!userClass) return true;
                    const normTopicClass = t.class.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim();
                    if (isComp || isDropper) {
                        return normTopicClass === 'class 11' || normTopicClass === 'class 12';
                    }
                    return normTopicClass === normUserClass;
                });
                totalPossibleTopics += classTopics.length;
            });

            let progress = 0;
            if (data && data.length > 0) {
                // Count completed topics in data that match the normalized class context
                const completedCount = data.filter(s => {
                    if (!s.is_completed) return false;
                    const topicItem = (SYLLABUS_DB[s.subject] || []).find(t => t.topic === s.topic);
                    if (!userClass) return true;
                    if (topicItem) {
                        const normTopicClass = topicItem.class.toLowerCase().replace(/th|st|nd|rd/g, '').replace(/\s+/g, ' ').trim();
                        if (isComp || isDropper) {
                            return normTopicClass === 'class 11' || normTopicClass === 'class 12';
                        }
                        return normTopicClass === normUserClass;
                    }
                    return false;
                }).length;
                
                progress = Math.round((completedCount / (totalPossibleTopics || 1)) * 100);
            }

            const finalProgress = Math.min(100, progress);
            
            // 2. Coordination: Only update if cloud is newer or local is empty
            const cachedRaw = localStorage.getItem(cacheKey);
            if (cachedRaw) {
                try {
                    const cached = JSON.parse(cachedRaw);
                    // If local was updated more recently than Firestore (e.g. offline completion), 
                    // we might want to skip or push to cloud. 
                    // For syllabus, Firestore is usually the source of truth as it's updated on every completion.
                    if (cached.timestamp > Date.now() - 5000) {
                        // Just saved locally 5s ago? likely our own save.
                    }
                } catch(e) {}
            }

            set({ user: { ...user, syllabusProgress: finalProgress } });

            // 3. Save to Cache
            localStorage.setItem(cacheKey, JSON.stringify({
                progress: finalProgress,
                timestamp: Date.now()
            }));
        } catch (error: any) {
            console.error(`Error fetching centralized syllabus progress: [${error.code}] ${error.message}`);
        }
    },


    addGains: async (gains) => {
        const { user, updateProfile } = get();
        if (!user) return;

        const newXP = (user.xp || 0) + gains.xp;
        const newTotalPoints = (user.totalPoints || 0) + gains.pts;
        const newLifetimeXp = (user.lifetimeXp || 0) + gains.xp;

        await updateProfile({
            xp: newXP,
            totalPoints: newTotalPoints,
            lifetimeXp: newLifetimeXp
        });

    },

    recordActivity: async (seconds) => {
        const { user, updateProfile } = get();
        if (!user) return;

        const newTime = (user.dailyStudyTime || 0) + seconds;
        const updates: Partial<User> = { dailyStudyTime: newTime };
        const todayStr = new Date().toISOString().split('T')[0];

        // Gated Streak Increment: 15 mins (900s) AND Daily Challenge completed
        if (newTime >= 900 && user.dailyChallengeCompleted && user.lastStreakIncrementDate !== todayStr) {
            console.log("🔥 [Streak] Goal reached! Incrementing streak.");
            updates.streak = (user.streak || 0) + 1;
            updates.lastStreakIncrementDate = todayStr;
        }

        await updateProfile(updates);
    },

    completeDailyChallenge: async () => {
        const { user, updateProfile } = get();
        if (!user) return;

        const updates: Partial<User> = { dailyChallengeCompleted: true };
        const todayStr = new Date().toISOString().split('T')[0];

        // Gated Streak Increment: Already have 15 mins?
        if ((user.dailyStudyTime || 0) >= 900 && user.lastStreakIncrementDate !== todayStr) {
            console.log("🔥 [Streak] Challenge + Study done! Incrementing streak.");
            updates.streak = (user.streak || 0) + 1;
            updates.lastStreakIncrementDate = todayStr;
        }

        await updateProfile(updates);
    },

    refreshMissions: async () => {
        const { user, updateProfile } = get();
        if (!user) return;

        // Use an empty history for now (will be updated when fatigue service is fully integrated)
        const missions = await MissionService.generateMissions(user.id, [], user.userClass, user.targetExam, user.examDate);
        await updateProfile({ dailyMissions: missions });
    },

    completeMission: async (missionId: string) => {
        const { user, updateProfile, addGains } = get();
        if (!user || !user.dailyMissions) return;

        const mission = user.dailyMissions.find(m => m.id === missionId);
        if (mission && !mission.completed) {
            const updatedMissions = user.dailyMissions.map(m =>
                m.id === missionId ? { ...m, completed: true } : m
            );

            await updateProfile({ dailyMissions: updatedMissions });
            await addGains({ xp: mission.rewardXp, pts: Math.floor(mission.rewardXp / 10) });

            console.log(`🚀 Mission Completed: ${mission.title}. Awarded ${mission.rewardXp} XP.`);
        }
    }
}));

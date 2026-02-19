import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, deleteUser, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { performDeepMigration } from '../migrationService';
import { SYLLABUS_DB } from '../lib/constants';
import type { DailyMission } from '../services/missionService';
import { MissionService } from '../services/missionService';
import { getCurrentSeason, getCurrentPointCycle } from '../services/gamificationService';

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
    dailyMissions?: DailyMission[];
};

interface UserState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
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
}

// Helper to synchronously hydrate from localStorage (Optimistic Load)
const hydrateFromLocal = (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
        // 1. Try Authenticated User Cache First (Instant Load)
        const cachedAuth = localStorage.getItem('exam_compass_auth_cache');
        if (cachedAuth) {
            const user = JSON.parse(cachedAuth);
            // Basic validity check
            if (user && user.id && !user.isGuest) {
                return user;
            }
        }

        // 2. Fallback to Guest
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
            abilityScore: profile.ability_score || 1000
        };
    } catch (e) {
        return null;
    }
};

const localUser = hydrateFromLocal();

export const useUserStore = create<UserState>((set, get) => ({
    user: localUser,
    isAuthenticated: !!localUser,
    isLoading: typeof window !== 'undefined' && !localUser, // Only load if no cache
    isInitialized: !!localUser, // Initialized if cache exists

    initialize: async () => {
        if (get().isInitialized && !get().user?.isGuest) return; // Skip if already auth'd from cache

        const timeout = setTimeout(() => {
            if (!get().isInitialized) {
                console.warn("⚠️ [Auth] Initialization timed out. Proceeding as logged-out/guest.");
                set({ isLoading: false, isInitialized: true });
            }
        }, 5000);

        onAuthStateChanged(auth, async (user) => {
            clearTimeout(timeout);
            console.log("🔑 [Auth] State Changed:", user ? `UID: ${user.uid}` : "Logged Out");

            if (user) {
                let profile: any = null;

                try {
                    const docRef = doc(db, "profiles", user.uid);
                    console.log(`📡 [Firestore] Fetching profile for ${user.uid}...`);

                    try {
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            profile = docSnap.data();
                        }
                    } catch (fetchErr: any) {
                        // ... error handling ...
                    }

                    // Fallback to email search if no profile found
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
                                await setDoc(docRef, profile);
                                await updateDoc(oldDoc.ref, { migrated_to: user.uid });
                            } else {
                                // Create fresh profile
                                // Check for Guest Migration (localStorage)
                                let migrationSource = null;
                                const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id');
                                if (fixedGuestId) migrationSource = fixedGuestId;

                                let intentClass = null;
                                let intentExam = null;
                                try {
                                    const storedIntent = sessionStorage.getItem('exam_compass_intent');
                                    if (storedIntent) {
                                        const parsed = JSON.parse(storedIntent);
                                        intentClass = parsed.class;
                                        intentExam = parsed.exam;
                                    }
                                } catch (e) { }

                                profile = {
                                    full_name: user.displayName || user.email?.split('@')[0] || 'User',
                                    email: user.email.toLowerCase().trim(),
                                    created_at: new Date(),
                                    onboarding_completed: !!intentExam,
                                    user_class: intentClass,
                                    target_exam: intentExam,
                                    streak: 0,
                                    migration_source: migrationSource
                                };
                                await setDoc(docRef, profile);

                                // Referral Logic
                                try {
                                    const refCode = sessionStorage.getItem('referral_code');
                                    if (refCode) {
                                        const { claimReferralCode } = await import('../services/referralService');
                                        await claimReferralCode(refCode, user.uid);
                                        sessionStorage.removeItem('referral_code');
                                        const updatedSnap = await getDoc(docRef);
                                        if (updatedSnap.exists()) profile = updatedSnap.data();
                                    }
                                } catch (err) { }
                            }
                        } catch (queryErr) {
                            console.error("❌ Email lookup/creation failed:", queryErr);
                        }
                    }
                } catch (err) {
                    console.error("❌ Fatal profile error:", err);
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

                const finalUserObj: User = {
                    id: user.uid,
                    email: user.email || `guest_${user.uid.slice(0, 6)}@examcompass.app`,
                    name: profile?.full_name || (user.isAnonymous ? 'Guest Student' : user.email?.split('@')[0] || 'User'),
                    avatarUrl: profile?.avatar_url,
                    targetExam: profile?.target_exam,
                    targetYear: profile?.target_year,
                    prepLevel: profile?.prep_level,
                    streak: currentStreak,
                    lastVisit: profile?.last_visit,
                    lastTestDate: profile?.last_test_date,
                    userClass: profile?.user_class,
                    onboardingCompleted: profile?.onboarding_completed === true || !!profile?.target_exam,
                    role: profile?.role || 'user',
                    skills: profile?.skills || { physics: 0.5, chemistry: 0.5, math: 0.5, lastUpdated: new Date().toISOString() },
                    commonMistakes: profile?.common_mistakes || [],
                    recentChat: profile?.recent_chat || [],
                    isGuest: user.isAnonymous,
                    xp: profile?.xp || 0,
                    totalPoints: profile?.total_points || 0,
                    lifetimeXp: profile?.lifetime_xp || 0,
                    lastSeasonReset: profile?.last_season_reset || getCurrentSeason(),
                    dailyStudyTime: profile?.daily_study_time || 0,
                    lastStudyDate: profile?.last_study_date,
                    dailyChallengeCompleted: profile?.daily_challenge_completed || false,
                    lastStreakIncrementDate: profile?.last_streak_increment_date,
                    referralCode: profile?.referral_code,
                    referralCount: profile?.referral_count || 0,
                    redeemedReferral: profile?.redeemed_referral || false,
                    abilityScore: profile?.ability_score || 1000
                };

                set({
                    isAuthenticated: true,
                    isInitialized: true,
                    isLoading: false,
                    user: finalUserObj
                });

                // CACHE FOR INSTANT LOAD
                if (!user.isAnonymous) {
                    localStorage.setItem('exam_compass_auth_cache', JSON.stringify(finalUserObj));
                }

                // --- DUAL-CYCLE RESET LOGIC ---
                const currentSeason = getCurrentSeason();
                const currentPointCycle = getCurrentPointCycle();
                const todayStr = new Date().toISOString().split('T')[0];
                const userState = get().user;

                if (userState) {
                    const updates: Partial<User> = {};

                    // 0. Daily Reset (Study Time & Challenge)
                    if (userState.lastStudyDate !== todayStr) {
                        console.log("🌅 [Daily] Resetting study progress for new day.");
                        updates.dailyStudyTime = 0;
                        updates.lastStudyDate = todayStr;
                        updates.dailyChallengeCompleted = false;

                        // Check if streak was missed (yesterday was neither lastStreakIncrementDate nor lastStudyDate)
                        // This handles the "break streak" logic
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

                    // 1. XP Reset (Rank Season - Odd Months)
                    if (userState.lastSeasonReset !== currentSeason) {
                        console.log(`🌀 [XP Cycle] New Season: ${currentSeason}. Archiving XP...`);
                        const oldXP = userState.xp || 0;
                        updates.xp = 0;
                        updates.lifetimeXp = (userState.lifetimeXp || 0) + oldXP;
                        updates.lastSeasonReset = currentSeason;
                    }

                    // 2. Points Reset (Point Cycle - Even Months)
                    if (userState.lastPointReset !== currentPointCycle) {
                        console.log(`💎 [Point Cycle] New Cycle: ${currentPointCycle}. Resetting Points...`);
                        updates.totalPoints = 0;
                        updates.lastPointReset = currentPointCycle;
                    }

                    if (Object.keys(updates).length > 0) {
                        await get().updateProfile(updates);
                    }
                }

                // --- CRITICAL RECOVERY: If a migration happened, trigger deep data move ---
                if (profile?.migration_source) {
                    performDeepMigration(profile.migration_source, user.uid);
                }
            } else {
                // LOGGED OUT
                localStorage.removeItem('exam_compass_auth_cache'); // Clear cache
                const local = hydrateFromLocal(); // Fallback to guest
                if (local) {
                    set({ user: local, isAuthenticated: true, isLoading: false, isInitialized: true });
                } else {
                    set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
                }
            }
        });
    },

    updateProfile: async (data) => {
        const { user } = get();
        if (!user) return;

        const newUser = { ...user, ...data };
        set({ user: newUser });

        // Update Cache Immediately
        if (!user.isGuest) {
            localStorage.setItem('exam_compass_auth_cache', JSON.stringify(newUser));
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
        if (data.lastSeasonReset !== undefined) updates.last_point_reset = data.lastPointReset;
        if (data.dailyStudyTime !== undefined) updates.daily_study_time = data.dailyStudyTime;
        if (data.lastStudyDate !== undefined) updates.last_study_date = data.lastStudyDate;
        if (data.dailyChallengeCompleted !== undefined) updates.daily_challenge_completed = data.dailyChallengeCompleted;
        if (data.lastStreakIncrementDate !== undefined) updates.last_streak_increment_date = data.lastStreakIncrementDate;
        if (data.referralCode !== undefined) updates.referral_code = data.referralCode;
        if (data.referralCount !== undefined) updates.referral_count = data.referralCount;
        if (data.redeemedReferral !== undefined) updates.redeemed_referral = data.redeemedReferral;
        if (data.abilityScore !== undefined) updates.ability_score = data.abilityScore;

        try {
            if (!user.isGuest) {
                const docRef = doc(db, "profiles", user.id);
                await setDoc(docRef, updates, { merge: true });
            }
        } catch (error: any) {
            console.warn('Profile update failed:', error.message);
        }

        if (auth.currentUser?.isAnonymous) {
            let fixedId = localStorage.getItem('exam_compass_fixed_guest_id');
            if (!fixedId) {
                fixedId = user.id;
                localStorage.setItem('exam_compass_fixed_guest_id', fixedId);
            }
            const existing = JSON.parse(localStorage.getItem(`guest_profile_${fixedId}`) || '{}');
            const newContent = JSON.stringify({ ...existing, ...updates });
            localStorage.setItem(`guest_profile_${fixedId}`, newContent);
        }
    },

    logout: async () => {
        localStorage.removeItem('exam_compass_auth_cache');
        await signOut(auth);
        set({ user: null, isAuthenticated: false });
        // Force redirect to login on manual logout
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
                console.warn("[Syllabus] No authenticated Firebase user. Skipping fetch.");
                return;
            }

            console.log(`[Syllabus] Querying for AuthUID: ${currentAuthUser.uid}`);

            // STRICTLY use the auth user UID to ensure it matches security rules requirements
            const q = query(collection(db, "syllabus"), where("user_id", "==", currentAuthUser.uid));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => doc.data());

            // --- REFINED COVERAGE LOGIC ---
            // Calculate progress against total topics in DB for the user's exam
            let totalPossibleTopics = 0;
            const targetExam = user.targetExam?.toLowerCase() || 'jee';
            const isMedical = targetExam.includes('neet') || targetExam.includes('medical');

            // Filter subjects by exam type
            const relevantSubjects = Object.keys(SYLLABUS_DB).filter(s => {
                const sLow = s.toLowerCase();
                if (isMedical) return sLow !== 'mathematics'; // NEET: Bio, Phy, Chem
                return sLow !== 'biology'; // JEE/Other: Math, Phy, Chem
            });

            relevantSubjects.forEach(sub => {
                totalPossibleTopics += SYLLABUS_DB[sub].length;
            });

            let progress = 0;
            if (data && data.length > 0) {
                const completedCount = data.filter(s => s.is_completed).length;
                progress = Math.round((completedCount / (totalPossibleTopics || 1)) * 100);
            }

            set({ user: { ...user, syllabusProgress: Math.min(100, progress) } });
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
        const missions = await MissionService.generateMissions(user.id, []);
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

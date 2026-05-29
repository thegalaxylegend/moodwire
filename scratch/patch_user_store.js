const fs = require('fs');
const path = require('path');

const userStorePath = path.join(__dirname, '../src/store/userStore.ts');
let userStore = fs.readFileSync(userStorePath, 'utf8');

// Replacement 1: UserState Interface start
const target1 = `interface UserState {
    user: User | null;
    isAuthenticated: boolean;`;
const replacement1 = `interface UserState {
    user: User | null;
    subProfiles: { id: string; name: string; userClass: string; targetExam: string }[] | null;
    activeProfileId: string | null;
    isAuthenticated: boolean;`;

if (userStore.includes(target1)) {
    userStore = userStore.replace(target1, replacement1);
    console.log('✅ Replacement 1 Applied.');
} else {
    console.error('❌ Replacement 1 Target Not Found!');
}

// Replacement 2: hydrateFromLocal helper
const target2 = `const hydrateFromLocal = (uid?: string): User | null => {
    if (typeof window === 'undefined') return null;
    try {
        // 1. Try Scoped Cache first (if UID provided)
        if (uid) {
            const cachedAuth = localStorage.getItem(\`exam_compass_auth_cache_\${uid}\`);
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

        const profileStr = localStorage.getItem(\`guest_profile_\${fixedId}\`);`;

const replacement2 = `const hydrateFromLocal = (uid?: string): User | null => {
    if (typeof window === 'undefined') return null;
    try {
        // 1. Try Scoped Cache first (if UID provided)
        if (uid) {
            const activeId = localStorage.getItem(\`ec_active_profile_id_\${uid}\`) || uid;
            const cachedAuth = localStorage.getItem(\`exam_compass_auth_cache_\${activeId}\`);
            if (cachedAuth) {
                const user = JSON.parse(cachedAuth);
                if (user && user.id === activeId && !user.isGuest) return user;
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

        const activeId = localStorage.getItem(\`ec_active_profile_id_\${fixedId}\`) || fixedId;
        const profileStr = localStorage.getItem(\`guest_profile_\${activeId}\`);`;

if (userStore.includes(target2)) {
    userStore = userStore.replace(target2, replacement2);
    console.log('✅ Replacement 2 Applied.');
} else {
    console.error('❌ Replacement 2 Target Not Found!');
}

// Replacement 3: UserState interface additions at the end
const target3 = `    onClassChange: (uid: string, oldClass: string, newClass: string, targetExam?: string) => Promise<boolean>;
}`;
const replacement3 = `    onClassChange: (uid: string, oldClass: string, newClass: string, targetExam?: string) => Promise<boolean>;
    createSubProfile: (name: string, userClass: string, targetExam: string) => Promise<void>;
    switchProfile: (profileId: string) => Promise<void>;
    deleteSubProfile: (profileId: string) => Promise<void>;
}`;

if (userStore.includes(target3)) {
    userStore = userStore.replace(target3, replacement3);
    console.log('✅ Replacement 3 Applied.');
} else {
    console.error('❌ Replacement 3 Target Not Found!');
}

// Replacement 4: useUserStore initial states
const target4 = `export const useUserStore = create<UserState>((set, get) => ({
    user: localUser,
    isAuthenticated: !!localUser,`;
const replacement4 = `export const useUserStore = create<UserState>((set, get) => ({
    user: localUser,
    subProfiles: null,
    activeProfileId: null,
    isAuthenticated: !!localUser,`;

if (userStore.includes(target4)) {
    userStore = userStore.replace(target4, replacement4);
    console.log('✅ Replacement 4 Applied.');
} else {
    console.error('❌ Replacement 4 Target Not Found!');
}

// Replacement 5: Insert sub-profiles resolution in initialize
const target5 = `                } catch (err) {
                    console.error("❌ Fatal profile error:", err);
                }

                // --- DATA RECOVERY & CONSOLIDATION ---
                const cached = hydrateFromLocal(user.uid);
                
                // A. Fallback to Cache if Firestore Fetch failed (or doc missing)
                if (!profile && cached && cached.id === user.uid && !cached.isGuest) {`;

const replacement5 = `                } catch (err) {
                    console.error("❌ Fatal profile error:", err);
                }

                // --- SUB-PROFILE INFRASTRUCTURE FETCHING & RESOLUTION ---
                let parsedSubProfiles: { id: string; name: string; userClass: string; targetExam: string }[] = [];
                let activeId = user.uid;
                
                if (user.isAnonymous) {
                    const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id') || user.uid;
                    if (!localStorage.getItem('exam_compass_fixed_guest_id')) {
                        localStorage.setItem('exam_compass_fixed_guest_id', fixedGuestId);
                    }
                    
                    let guestSubProfilesRaw = localStorage.getItem(\`guest_sub_profiles_\${fixedGuestId}\`);
                    if (guestSubProfilesRaw) {
                        try { parsedSubProfiles = JSON.parse(guestSubProfilesRaw); } catch(e) {}
                    }
                    
                    if (!parsedSubProfiles || parsedSubProfiles.length === 0) {
                        parsedSubProfiles = [{
                            id: fixedGuestId,
                            name: 'Guest Student',
                            userClass: 'Class 11',
                            targetExam: 'JEE'
                        }];
                        localStorage.setItem(\`guest_sub_profiles_\${fixedGuestId}\`, JSON.stringify(parsedSubProfiles));
                    }
                    
                    activeId = localStorage.getItem(\`ec_active_profile_id_\${fixedGuestId}\`) || fixedGuestId;
                } else {
                    const primaryProfile = profile;
                    if (primaryProfile && primaryProfile.sub_profiles) {
                        parsedSubProfiles = primaryProfile.sub_profiles.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            userClass: p.user_class || p.userClass || '',
                            targetExam: p.target_exam || p.targetExam || ''
                        }));
                    }
                    
                    if (!parsedSubProfiles.some(p => p.id === user.uid)) {
                        parsedSubProfiles.unshift({
                            id: user.uid,
                            name: primaryProfile?.full_name || user.email?.split('@')[0] || 'Primary Student',
                            userClass: primaryProfile?.user_class || 'Class 11',
                            targetExam: primaryProfile?.target_exam || 'JEE'
                        });
                    }
                    
                    activeId = localStorage.getItem(\`ec_active_profile_id_\${user.uid}\`) || user.uid;
                    if (activeId !== user.uid) {
                        try {
                            console.log(\`📡 [Firestore] Fetching active sub-profile for \${activeId}...\`);
                            const subDocRef = doc(db, "profiles", activeId);
                            const subDocSnap = await getDoc(subDocRef);
                            if (subDocSnap.exists()) {
                                profile = subDocSnap.data();
                            } else {
                                console.warn(\`Sub-profile document \${activeId} not found in Firestore. Falling back to primary.\`);
                                localStorage.setItem(\`ec_active_profile_id_\${user.uid}\`, user.uid);
                                activeId = user.uid;
                            }
                        } catch (subErr) {
                            console.error("Error fetching sub-profile doc:", subErr);
                            activeId = user.uid;
                        }
                    }
                }

                // --- DATA RECOVERY & CONSOLIDATION ---
                const cached = hydrateFromLocal(user.uid);
                
                // A. Fallback to Cache if Firestore Fetch failed (or doc missing)
                if (!profile && cached && cached.id === activeId && !cached.isGuest) {`;

if (userStore.includes(target5)) {
    userStore = userStore.replace(target5, replacement5);
    console.log('✅ Replacement 5 Applied.');
} else {
    console.error('❌ Replacement 5 Target Not Found!');
}

// Replacement 5.5: Guest localProfileString fallback
const target55 = `                // ... Streak Logic ...
                let currentStreak = profile?.streak || 0;
                if (user.isAnonymous) {
                    const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id');
                    let localProfileString = fixedGuestId ? localStorage.getItem(\`guest_profile_\${fixedGuestId}\`) : null;
                    if (!localProfileString) localProfileString = localStorage.getItem(\`guest_profile_\${user.uid}\`);`;

const replacement55 = `                // ... Streak Logic ...
                let currentStreak = profile?.streak || 0;
                if (user.isAnonymous) {
                    const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id');
                    let localProfileString = fixedGuestId ? localStorage.getItem(\`guest_profile_\${fixedGuestId}\`) : null;
                    if (!localProfileString) localProfileString = localStorage.getItem(\`guest_profile_\${activeId}\`);`;

if (userStore.includes(target55)) {
    userStore = userStore.replace(target55, replacement55);
    console.log('✅ Replacement 5.5 Applied.');
} else {
    console.error('❌ Replacement 5.5 Target Not Found!');
}

// Replacement 6: finalUserObj parsing and caching updates
const target6 = `                const finalUserObj: User = {
                    id: user.uid,
                    email: user.email || \`guest_\${user.uid.slice(0, 6)}@examcompass.app\`,
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
                
                console.log(\`✅ [UserStore] Final User Object:\`, finalUserObj);

                // CACHE FOR INSTANT LOAD
                if (!user.isAnonymous) {
                    localStorage.setItem('exam_compass_auth_cache', JSON.stringify(finalUserObj));
                    localStorage.setItem(\`exam_compass_auth_cache_\${user.uid}\`, JSON.stringify(finalUserObj));`;

const replacement6 = `                const finalUserObj: User = {
                    id: activeId,
                    email: user.isAnonymous ? \`guest_\${activeId.slice(0, 6)}@examcompass.app\` : (activeId === user.uid ? (user.email || \`guest_\${user.uid.slice(0, 6)}@examcompass.app\`) : \`sub_\${activeId.slice(-6)}@examcompass.app\`),
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
                    user: finalUserObj,
                    subProfiles: parsedSubProfiles,
                    activeProfileId: activeId
                });
                
                console.log(\`✅ [UserStore] Final User Object:\`, finalUserObj);

                // CACHE FOR INSTANT LOAD
                if (!user.isAnonymous) {
                    localStorage.setItem('exam_compass_auth_cache', JSON.stringify(finalUserObj));
                    localStorage.setItem(\`exam_compass_auth_cache_\${activeId}\`, JSON.stringify(finalUserObj));`;

if (userStore.includes(target6)) {
    userStore = userStore.replace(target6, replacement6);
    console.log('✅ Replacement 6 Applied.');
} else {
    console.error('❌ Replacement 6 Target Not Found!');
}

// Replacement 7: updateProfile sync & ID bug fix
const target7 = `    updateProfile: async (data: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        const newUser = { ...user, ...data };
        set({ user: newUser });

        if (!user.isGuest) {
            localStorage.setItem('exam_compass_auth_cache', JSON.stringify(newUser));
            localStorage.setItem(\`exam_compass_auth_cache_\${user.id}\`, JSON.stringify(newUser));
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
                console.log(\`📡 [Firestore] Updating profile for \${user.id}:\`, updates);
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
                console.log(\`✅ [Firestore] Profile updated successfully.\`);

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
            const existing = JSON.parse(localStorage.getItem(\`guest_profile_\${fixedId}\`) || '{}');
            const newContent = JSON.stringify({ ...existing, ...updates });
            localStorage.setItem(\`guest_profile_\${fixedId}\`, newContent);
        }
    },`;

const replacement7 = `    updateProfile: async (data: Partial<User>) => {
        const { user, subProfiles, activeProfileId } = get();
        if (!user) return;

        const newUser = { ...user, ...data };
        set({ user: newUser });

        if (!user.isGuest) {
            localStorage.setItem('exam_compass_auth_cache', JSON.stringify(newUser));
            localStorage.setItem(\`exam_compass_auth_cache_\${user.id}\`, JSON.stringify(newUser));
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

        // If sub-profile metadata changes, update the subProfiles list in memory and in primary document / localStorage
        if (data.name !== undefined || data.userClass !== undefined || data.targetExam !== undefined) {
            if (subProfiles && activeProfileId) {
                const updatedSubProfiles = subProfiles.map((p: any) => {
                    if (p.id === activeProfileId) {
                        return {
                            ...p,
                            name: data.name !== undefined ? data.name : p.name,
                            userClass: data.userClass !== undefined ? data.userClass : p.userClass,
                            targetExam: data.targetExam !== undefined ? data.targetExam : p.targetExam
                        };
                    }
                    return p;
                });
                
                set({ subProfiles: updatedSubProfiles });
                
                const primaryUid = auth.currentUser?.uid;
                if (primaryUid) {
                    if (auth.currentUser?.isAnonymous) {
                        const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id') || primaryUid;
                        localStorage.setItem(\`guest_sub_profiles_\${fixedGuestId}\`, JSON.stringify(updatedSubProfiles));
                    } else {
                        // For authenticated users, update the sub_profiles in primary document
                        const subProfilesData = updatedSubProfiles.map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            user_class: p.userClass,
                            target_exam: p.targetExam
                        }));
                        await updateDoc(doc(db, "profiles", primaryUid), { sub_profiles: subProfilesData });
                    }
                }
            }
        }

        try {
            if (!user.isGuest) {
                console.log(\`📡 [Firestore] Updating profile for \${user.id}:\`, updates);
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
                console.log(\`✅ [Firestore] Profile updated successfully.\`);

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
            const existing = JSON.parse(localStorage.getItem(\`guest_profile_\${user.id}\`) || '{}');
            const newContent = JSON.stringify({ ...existing, ...updates });
            localStorage.setItem(\`guest_profile_\${user.id}\`, newContent);
        }
    },`;

if (userStore.includes(target7)) {
    userStore = userStore.replace(target7, replacement7);
    console.log('✅ Replacement 7 Applied.');
} else {
    console.error('❌ Replacement 7 Target Not Found!');
}

// Replacement 8: createSubProfile, switchProfile, deleteSubProfile
const target8 = `    completeMission: async (missionId: string) => {
        const { user, updateProfile, addGains } = get();
        if (!user || !user.dailyMissions) return;

        const mission = user.dailyMissions.find(m => m.id === missionId);
        if (mission && !mission.completed) {
            const updatedMissions = user.dailyMissions.map(m =>
                m.id === missionId ? { ...m, completed: true } : m
            );

            await updateProfile({ dailyMissions: updatedMissions });
            await addGains({ xp: mission.rewardXp, pts: Math.floor(mission.rewardXp / 10) });

            console.log(\`🚀 Mission Completed: \${mission.title}. Awarded \${mission.rewardXp} XP.\`);
        }
    }
}));`;

const replacement8 = `    completeMission: async (missionId: string) => {
        const { user, updateProfile, addGains } = get();
        if (!user || !user.dailyMissions) return;

        const mission = user.dailyMissions.find(m => m.id === missionId);
        if (mission && !mission.completed) {
            const updatedMissions = user.dailyMissions.map(m =>
                m.id === missionId ? { ...m, completed: true } : m
            );

            await updateProfile({ dailyMissions: updatedMissions });
            await addGains({ xp: mission.rewardXp, pts: Math.floor(mission.rewardXp / 10) });

            console.log(\`🚀 Mission Completed: \${mission.title}. Awarded \${mission.rewardXp} XP.\`);
        }
    },

    createSubProfile: async (name: string, userClass: string, targetExam: string) => {
        const primaryUid = auth.currentUser?.uid;
        if (!primaryUid) return;

        const subId = \`\${primaryUid}_sub_\${Date.now()}\`;
        const { subProfiles } = get();
        
        const newSub = {
            id: subId,
            name,
            userClass,
            targetExam
        };
        const updatedSubProfiles = [...(subProfiles || []), newSub];

        if (auth.currentUser?.isAnonymous) {
            const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id') || primaryUid;
            localStorage.setItem(\`guest_sub_profiles_\${fixedGuestId}\`, JSON.stringify(updatedSubProfiles));
            
            const subProfileData = {
                full_name: name,
                user_class: userClass,
                target_exam: targetExam,
                streak: 0,
                xp: 0,
                total_points: 0,
                onboarding_completed: true,
                skills: { physics: 0.5, chemistry: 0.5, math: 0.5, lastUpdated: new Date().toISOString() }
            };
            localStorage.setItem(\`guest_profile_\${subId}\`, JSON.stringify(subProfileData));
        } else {
            // Write sub-profiles registry update in primary profile doc
            const subProfilesData = updatedSubProfiles.map((p: any) => ({
                id: p.id,
                name: p.name,
                user_class: p.userClass,
                target_exam: p.targetExam
            }));
            await updateDoc(doc(db, "profiles", primaryUid), { sub_profiles: subProfilesData });

            // Create new sub-profile document in Firestore
            const subProfileData = {
                full_name: name,
                user_class: userClass,
                target_exam: targetExam,
                created_at: new Date(),
                streak: 0,
                xp: 0,
                total_points: 0,
                lifetime_xp: 0,
                onboarding_completed: true,
                skills: { physics: 0.5, chemistry: 0.5, math: 0.5, lastUpdated: new Date().toISOString() },
                common_mistakes: [],
                role: 'user'
            };
            await setDoc(doc(db, "profiles", subId), subProfileData);
        }

        // Set new active profile and trigger reload
        localStorage.setItem(\`ec_active_profile_id_\${primaryUid}\`, subId);
        // Clear syllabus cache
        localStorage.removeItem(\`syllabus_cache_\${primaryUid}\`);
        window.location.reload();
    },

    switchProfile: async (profileId: string) => {
        const primaryUid = auth.currentUser?.uid;
        if (!primaryUid) return;

        localStorage.setItem(\`ec_active_profile_id_\${primaryUid}\`, profileId);
        // Clear syllabus cache
        localStorage.removeItem(\`syllabus_cache_\${primaryUid}\`);
        window.location.reload();
    },

    deleteSubProfile: async (profileId: string) => {
        const primaryUid = auth.currentUser?.uid;
        if (!primaryUid) return;

        // Disallow deleting the primary profile
        if (profileId === primaryUid) return;

        const { subProfiles, activeProfileId } = get();
        if (!subProfiles) return;

        const updatedSubProfiles = subProfiles.filter((p: any) => p.id !== profileId);

        if (auth.currentUser?.isAnonymous) {
            const fixedGuestId = localStorage.getItem('exam_compass_fixed_guest_id') || primaryUid;
            localStorage.setItem(\`guest_sub_profiles_\${fixedGuestId}\`, JSON.stringify(updatedSubProfiles));
            localStorage.removeItem(\`guest_profile_\${profileId}\`);
        } else {
            // Update primary document sub_profiles array
            const subProfilesData = updatedSubProfiles.map((p: any) => ({
                id: p.id,
                name: p.name,
                user_class: p.userClass,
                target_exam: p.targetExam
            }));
            await updateDoc(doc(db, "profiles", primaryUid), { sub_profiles: subProfilesData });
            // Optionally, delete/ignore the firestore document for this sub-profile.
        }

        // If the deleted profile was the active one, switch back to primary
        if (activeProfileId === profileId) {
            localStorage.setItem(\`ec_active_profile_id_\${primaryUid}\`, primaryUid);
        }

        window.location.reload();
    }
}));`;

if (userStore.includes(target8)) {
    userStore = userStore.replace(target8, replacement8);
    console.log('✅ Replacement 8 Applied.');
} else {
    console.error('❌ Replacement 8 Target Not Found!');
}

fs.writeFileSync(userStorePath, userStore, 'utf8');
console.log('🎉 Successfully patched userStore.ts!');

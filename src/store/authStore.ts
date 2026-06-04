/**
 * 🔐 authStore.ts
 * 
 * Handles ONLY the Firebase Auth lifecycle:
 *  - Auth state resolution (logged in / out / guest)
 *  - Optimistic hydration from localStorage on startup
 *  - Auth-related loading/resolved flags
 *
 * All profile-level data (XP, skills, missions) lives in userStore.ts.
 * Import { useAuthStore } from './authStore' for auth-only concerns.
 */

import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';

export interface AuthState {
    /** Whether a Firebase user is currently signed in (including anonymous guests). */
    isAuthenticated: boolean;
    /** true once the onAuthStateChanged callback has fired at least once. */
    authResolved: boolean;
    /** true while a Firestore profile fetch is in flight. */
    isLoading: boolean;
    /** The raw Firebase UID, or null when logged out. */
    firebaseUid: string | null;
    /** Whether the current session is an anonymous guest. */
    isGuest: boolean;

    logout: () => Promise<void>;
    loginAsGuest: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    authResolved: false,
    isLoading: false,
    firebaseUid: null,
    isGuest: false,

    logout: async () => {
        const uid = auth.currentUser?.uid;
        // Clear all auth-scoped caches
        localStorage.removeItem('exam_compass_auth_cache');
        localStorage.removeItem('exam_compass_local_history');
        localStorage.removeItem('exam_compass_intent');
        localStorage.removeItem('referral_code');
        sessionStorage.removeItem('referral_code');
        if (uid) {
            localStorage.removeItem(`exam_compass_auth_cache_${uid}`);
            localStorage.removeItem(`syllabus_cache_${uid}`);
            localStorage.removeItem(`guest_profile_${uid}`);
        }
        await signOut(auth);
        set({ isAuthenticated: false, firebaseUid: null, isGuest: false });
        window.location.href = '/';
    },

    loginAsGuest: async () => {
        await signInAnonymously(auth);
    },
}));

/**
 * Sets up the auth state listener — call once at app init.
 * Updating the authStore when Firebase auth state changes.
 */
export function setupAuthListener(onUserChange: (uid: string | null, isAnonymous: boolean) => void) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            useAuthStore.setState({
                isAuthenticated: true,
                authResolved: true,
                isLoading: false,
                firebaseUid: user.uid,
                isGuest: user.isAnonymous,
            });
            onUserChange(user.uid, user.isAnonymous);
        } else {
            useAuthStore.setState({
                isAuthenticated: false,
                authResolved: true,
                isLoading: false,
                firebaseUid: null,
                isGuest: false,
            });
            onUserChange(null, false);
        }
    });
}

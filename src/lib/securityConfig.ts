/**
 * Security Hardening Constants
 */

// Time-to-Live (TTL) for transient data
export const REFERRAL_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
export const TEST_INACTIVITY_TTL_MS = 30 * 60 * 1000; // 30 Minutes

// Allowed fields for the public_profiles collection (Mirrored from profiles)
export const PUBLIC_PROFILE_FIELDS = ['full_name', 'avatar_url', 'xp'] as const;

export type PublicProfileField = (typeof PUBLIC_PROFILE_FIELDS)[number];

/**
 * ⛔ FIRESTORE QUESTIONS GUARD
 * 
 * This file exists to permanently document that questions are stored in
 * CLOUDFLARE D1 ONLY — never in Firebase Firestore.
 * 
 * If you (or any AI agent) are about to write questions to Firestore, STOP.
 * 
 * ✅ CORRECT:  scripts/d1-push.ts   → Cloudflare D1 (examcompass-questions)
 * ❌ WRONG:    Any Firebase/Firestore script for questions
 * 
 * Question DB:
 *   - Provider:   Cloudflare D1
 *   - DB Name:    examcompass-questions
 *   - DB ID:      63abfee4-2340-47bd-a9ad-ebc4a9c50580
 *   - Push cmd:   npx tsx scripts/d1-push.ts
 * 
 * Firebase is used ONLY for:
 *   - User authentication (Firebase Auth)
 *   - Blog posts (if applicable)
 *   - Hosting
 * 
 * Firebase is NOT used for questions. Period.
 */

throw new Error(
  '⛔ GUARD: Questions must be pushed to Cloudflare D1, not Firestore!\n' +
  '   Run: npx tsx scripts/d1-push.ts\n' +
  '   See: scripts/DO_NOT_USE_FIREBASE_FOR_QUESTIONS.md'
);

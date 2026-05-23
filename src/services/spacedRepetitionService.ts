/**
 * Spaced Repetition Service — SM-2 Algorithm
 * 
 * Implements the SuperMemo SM-2 spaced repetition algorithm for ExamCompass.
 * Schedules review sessions based on forgetting curves to maximize long-term retention.
 * 
 * Key Concepts:
 * - Each wrong answer creates a "review card"
 * - Cards are scheduled for review at increasing intervals (1d, 3d, 7d, 14d, 30d...)
 * - If the student gets it right on review, interval increases
 * - If the student gets it wrong again, interval resets to 1 day
 * - Ease factor adjusts based on difficulty perceived by the student
 */

import { db, auth } from '../lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    orderBy,
    limit,
    writeBatch
} from 'firebase/firestore';

// ─── TYPES ───────────────────────────────────────────────

export interface ReviewCard {
    id: string;                     // Composite: userId_questionHash
    user_id: string;
    question_hash: string;          // SHA-256 of the question text

    // Question Data (lightweight snapshot)
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    topic: string;
    topic_id: string;
    subject: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';

    // Student's Error Context
    student_answer: string;         // What the student chose (wrong)
    error_type?: 'CONCEPTUAL' | 'SILLY' | 'TIME' | 'MISREAD' | 'OVERCONFIDENCE';

    // SM-2 Algorithm State
    ease_factor: number;            // Default 2.5, min 1.3
    interval: number;               // Days until next review
    repetition: number;             // Number of consecutive correct reviews
    next_review: string;            // ISO date string
    last_reviewed: string;          // ISO date string

    // Tracking
    total_reviews: number;
    correct_reviews: number;
    created_at: string;
    is_resolved: boolean;           // True if student got it right 3+ times consecutively
    user_class?: string;
    target_exam?: string;
}

export interface ReviewSession {
    cards: ReviewCard[];
    total_due: number;
    overdue_count: number;
}

// ─── SM-2 ALGORITHM ─────────────────────────────────────

const SM2_DEFAULTS = {
    INITIAL_EASE: 2.5,
    MIN_EASE: 1.3,
    INITIAL_INTERVAL: 1,        // 1 day
    RESOLVED_THRESHOLD: 3,      // 3 consecutive correct = resolved
    MAX_DAILY_REVIEWS: 25,      // Cap to prevent burnout
};

/**
 * SM-2 Core: Calculate the next interval and ease factor after a review.
 * 
 * Quality score (0-5):
 * 5 - Perfect response, no hesitation
 * 4 - Correct after brief thought
 * 3 - Correct with difficulty
 * 2 - Incorrect, but close (remembered after seeing answer)
 * 1 - Incorrect, vague memory
 * 0 - Complete blackout
 */
const calculateSM2 = (
    currentEase: number,
    currentInterval: number,
    currentRepetition: number,
    quality: number // 0-5
): { ease: number; interval: number; repetition: number } => {
    let newEase = currentEase;
    let newInterval = currentInterval;
    let newRepetition = currentRepetition;

    if (quality >= 3) {
        // Correct answer
        newRepetition = currentRepetition + 1;

        if (newRepetition === 1) {
            newInterval = 1;        // First correct: review tomorrow
        } else if (newRepetition === 2) {
            newInterval = 3;        // Second correct: review in 3 days
        } else {
            newInterval = Math.round(currentInterval * currentEase);
        }

        // Adjust ease factor
        newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    } else {
        // Wrong answer — reset to beginning
        newRepetition = 0;
        newInterval = 1; // Review tomorrow
        // Penalize ease factor more harshly
        newEase = currentEase - 0.2;
    }

    // Enforce minimum ease
    newEase = Math.max(SM2_DEFAULTS.MIN_EASE, newEase);

    // Cap maximum interval at 180 days (6 months)
    newInterval = Math.min(newInterval, 180);

    return {
        ease: Number(newEase.toFixed(2)),
        interval: newInterval,
        repetition: newRepetition
    };
};

// ─── LOCAL CACHE ─────────────────────────────────────────

const getLocalCacheKey = (userId: string) => `srs_cards_${userId}`;

const getLocalCards = (userId: string): ReviewCard[] => {
    try {
        const raw = localStorage.getItem(getLocalCacheKey(userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveLocalCards = (userId: string, cards: ReviewCard[]) => {
    try {
        localStorage.setItem(getLocalCacheKey(userId), JSON.stringify(cards));
    } catch (e) {
        console.warn('[SRS] Local storage save failed:', e);
    }
};

// ─── SERVICE ─────────────────────────────────────────────

export const SpacedRepetitionService = {
    /**
     * Creates a review card from a wrong answer.
     * Called by MockGenerator after test submission for each incorrect question.
     */
    createCard: async (
        userId: string,
        questionData: {
            question_hash: string;
            question_text: string;
            options: string[];
            correct_answer: string;
            explanation: string;
            topic: string;
            topic_id: string;
            subject: string;
            difficulty: 'Easy' | 'Medium' | 'Hard';
            student_answer: string;
            error_type?: ReviewCard['error_type'];
        },
        userClass?: string,
        targetExam?: string
    ): Promise<void> => {
        if (!userId || userId === 'guest' || !auth.currentUser) return;

        const cardId = `${userId}_${questionData.question_hash}`;
        const now = new Date();
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + SM2_DEFAULTS.INITIAL_INTERVAL);

        const card: ReviewCard = {
            id: cardId,
            user_id: userId,
            question_hash: questionData.question_hash,
            question_text: questionData.question_text,
            options: questionData.options,
            correct_answer: questionData.correct_answer,
            explanation: questionData.explanation,
            topic: questionData.topic,
            topic_id: questionData.topic_id,
            subject: questionData.subject,
            difficulty: questionData.difficulty,
            student_answer: questionData.student_answer,
            error_type: questionData.error_type,
            ease_factor: SM2_DEFAULTS.INITIAL_EASE,
            interval: SM2_DEFAULTS.INITIAL_INTERVAL,
            repetition: 0,
            next_review: nextReview.toISOString(),
            last_reviewed: now.toISOString(),
            total_reviews: 0,
            correct_reviews: 0,
            created_at: now.toISOString(),
            is_resolved: false,
            user_class: userClass,
            target_exam: targetExam
        };

        // Save locally first (instant)
        const localCards = getLocalCards(userId);
        const existingIdx = localCards.findIndex(c => c.id === cardId);
        if (existingIdx >= 0) {
            // Card already exists (student got same question wrong again) — reset it
            localCards[existingIdx] = {
                ...localCards[existingIdx],
                student_answer: questionData.student_answer,
                error_type: questionData.error_type,
                repetition: 0,
                interval: SM2_DEFAULTS.INITIAL_INTERVAL,
                next_review: nextReview.toISOString(),
                last_reviewed: now.toISOString(),
                is_resolved: false
            };
        } else {
            localCards.push(card);
        }
        saveLocalCards(userId, localCards);

        // Sync to Firestore (background)
        try {
            const docRef = doc(db, 'review_cards', cardId);
            await setDoc(docRef, card, { merge: true });
        } catch (e) {
            console.warn('[SRS] Firestore sync failed, card saved locally:', e);
        }
    },

    /**
     * Creates multiple cards at once (batch after test submission).
     */
    createCardsFromTestResults: async (
        userId: string,
        wrongQuestions: Array<{
            question_text: string;
            question_hash: string;
            options: string[];
            correct_answer: string;
            explanation: string;
            topic: string;
            topic_id: string;
            subject: string;
            difficulty: 'Easy' | 'Medium' | 'Hard';
            student_answer: string;
            error_type?: ReviewCard['error_type'];
        }>,
        userClass?: string,
        targetExam?: string
    ): Promise<number> => {
        let created = 0;
        for (const q of wrongQuestions) {
            await SpacedRepetitionService.createCard(userId, q, userClass, targetExam);
            created++;
        }
        console.log(`[SRS] Created ${created} review cards from test results.`);
        return created;
    },

    /**
     * Gets all cards due for review today (or overdue).
     */
    getDueCards: async (
        userId: string,
        maxCards: number = SM2_DEFAULTS.MAX_DAILY_REVIEWS
    ): Promise<ReviewSession> => {
        if (!userId || !auth.currentUser) {
            return { cards: [], total_due: 0, overdue_count: 0 };
        }

        const now = new Date();
        const todayStr = now.toISOString();

        // Try local first
        let cards = getLocalCards(userId);

        // If local is empty, try Firestore
        if (cards.length === 0) {
            try {
                const q = query(
                    collection(db, 'review_cards'),
                    where('user_id', '==', userId),
                    where('is_resolved', '==', false),
                    orderBy('next_review', 'asc'),
                    limit(100)
                );
                const snap = await getDocs(q);
                cards = snap.docs.map(d => d.data() as ReviewCard);
                if (cards.length > 0) {
                    saveLocalCards(userId, cards);
                }
            } catch (e) {
                console.warn('[SRS] Firestore fetch failed, using local cache:', e);
            }
        }

        // Filter to due cards (next_review <= now) that aren't resolved
        const dueCards = cards
            .filter(c => !c.is_resolved && c.next_review <= todayStr)
            .sort((a, b) => a.next_review.localeCompare(b.next_review))
            .slice(0, maxCards);

        // Count overdue (more than 1 day past due)
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const overdueCount = dueCards.filter(c => c.next_review < oneDayAgo.toISOString()).length;

        return {
            cards: dueCards,
            total_due: dueCards.length,
            overdue_count: overdueCount
        };
    },

    /**
     * Records the result of a review attempt.
     * Updates the SM-2 scheduling for the card.
     */
    recordReview: async (
        userId: string,
        cardId: string,
        isCorrect: boolean,
        quality: number = -1 // -1 means auto-derive from isCorrect
    ): Promise<ReviewCard | null> => {
        if (!userId || !auth.currentUser) return null;

        // Auto-derive quality if not provided
        if (quality === -1) {
            quality = isCorrect ? 4 : 1;
        }

        const localCards = getLocalCards(userId);
        const cardIdx = localCards.findIndex(c => c.id === cardId);
        if (cardIdx === -1) return null;

        const card = { ...localCards[cardIdx] };

        // Run SM-2 algorithm
        const sm2Result = calculateSM2(
            card.ease_factor,
            card.interval,
            card.repetition,
            quality
        );

        // Update card
        const now = new Date();
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + sm2Result.interval);

        card.ease_factor = sm2Result.ease;
        card.interval = sm2Result.interval;
        card.repetition = sm2Result.repetition;
        card.next_review = nextReview.toISOString();
        card.last_reviewed = now.toISOString();
        card.total_reviews += 1;
        if (isCorrect) card.correct_reviews += 1;

        // Check if resolved (3+ consecutive correct)
        if (card.repetition >= SM2_DEFAULTS.RESOLVED_THRESHOLD) {
            card.is_resolved = true;
        }

        // Save locally
        localCards[cardIdx] = card;
        saveLocalCards(userId, localCards);

        // Sync to Firestore (background)
        try {
            const docRef = doc(db, 'review_cards', cardId);
            await setDoc(docRef, card, { merge: true });
        } catch (e) {
            console.warn('[SRS] Firestore review sync failed:', e);
        }

        return card;
    },

    /**
     * Gets statistics about the user's review progress.
     */
    getStats: (userId: string): {
        totalCards: number;
        resolvedCards: number;
        dueToday: number;
        averageEase: number;
        retentionRate: number;
    } => {
        const cards = getLocalCards(userId);
        const now = new Date().toISOString();

        const resolved = cards.filter(c => c.is_resolved);
        const due = cards.filter(c => !c.is_resolved && c.next_review <= now);
        const reviewed = cards.filter(c => c.total_reviews > 0);

        const totalReviews = reviewed.reduce((sum, c) => sum + c.total_reviews, 0);
        const correctReviews = reviewed.reduce((sum, c) => sum + c.correct_reviews, 0);

        return {
            totalCards: cards.length,
            resolvedCards: resolved.length,
            dueToday: due.length,
            averageEase: cards.length > 0
                ? Number((cards.reduce((sum, c) => sum + c.ease_factor, 0) / cards.length).toFixed(2))
                : SM2_DEFAULTS.INITIAL_EASE,
            retentionRate: totalReviews > 0
                ? Number(((correctReviews / totalReviews) * 100).toFixed(1))
                : 0
        };
    },

    /**
     * Gets cards filtered by subject/topic for targeted review.
     */
    getCardsByTopic: (userId: string, topic: string): ReviewCard[] => {
        return getLocalCards(userId).filter(c =>
            !c.is_resolved && (c.topic === topic || c.subject === topic)
        );
    },

    /**
     * Removes a resolved card permanently.
     */
    removeCard: async (userId: string, cardId: string): Promise<void> => {
        const localCards = getLocalCards(userId);
        saveLocalCards(userId, localCards.filter(c => c.id !== cardId));

        try {
            await deleteDoc(doc(db, 'review_cards', cardId));
        } catch (e) {
            console.warn('[SRS] Firestore delete failed:', e);
        }
    },

    /**
     * Syncs local cards to Firestore (called on app load or manual sync).
     */
    syncToCloud: async (userId: string): Promise<void> => {
        if (!auth.currentUser) return;
        const localCards = getLocalCards(userId);
        
        if (localCards.length === 0) return;

        // Firestore batch write limit is 500
        const chunkSize = 500;
        for (let i = 0; i < localCards.length; i += chunkSize) {
            const chunk = localCards.slice(i, i + chunkSize);
            const batch = writeBatch(db);

            for (const card of chunk) {
                batch.set(doc(db, 'review_cards', card.id), card, { merge: true });
            }

            try {
                await batch.commit();
            } catch (e) {
                // Silent fail — will retry next sync

                // const _ignored = e;
            }
        }
        console.log(`[SRS] Synced ${localCards.length} cards to cloud.`);
    }
};

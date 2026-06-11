import { getAnalytics, logEvent as firebaseLogEvent } from "firebase/analytics";
import app, { db, auth } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { recommendationEngine } from "./recommendation/RecommendationService";

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const trackingService = {
    logEvent: async (eventName: string, params: any = {}) => {
        // 1. Send to Google Analytics (Dashboard)
        if (analytics) {
            try {
                firebaseLogEvent(analytics, eventName, params);
            } catch (e) {
                console.warn("GA Error", e);
            }
        }

        // 2. Forward to Recommendation Engine (Real-time Session Adjustment)
        try {
            if (eventName === 'track_skip' && params.trackId) {
                // We need the full track object for the engine, but sometimes we only have ID in params
                // If params.track exists, use it.
                if (params.track) recommendationEngine.handleFeedback('skip', params.track);
            }
            if (eventName === 'track_complete' && params.track) {
                recommendationEngine.handleFeedback('complete', params.track);
            }
        } catch (e) {
            console.warn("Engine Feedback Error", e);
        }

        // 3. Log to Firestore (ML Training Data)
        const user = auth.currentUser;
        if (user) {
            try {
                // We only care about specific events for ML
                const mlEvents = ['recommendation_served_v2', 'track_skip', 'track_complete', 'track_play', 'track_like'];
                if (mlEvents.includes(eventName)) {
                    await addDoc(collection(db, 'users', user.uid, 'events'), {
                        type: eventName,
                        data: params,
                        timestamp: Date.now(),
                        sessionId: params.sessionId || 'unknown'
                    });
                }
            } catch (e) {
                // Silent fail for logging to avoid blocking UI
                console.warn("Firestore Logging Error", e);
            }
        }
    }
};

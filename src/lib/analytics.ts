
import { getAnalytics, logEvent as firebaseLogEvent, setUserProperties as firebaseSetUserProperties } from "firebase/analytics";
import { app } from "./firebase";

// Initialize Firebase Analytics
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Declare gtag for TS
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
    }
}

const MEASUREMENT_ID = "G-7MWNJDZ5D0";

/**
 * Robust Page View Tracking
 * Uses both global gtag and Firebase SDK for maximum reliability
 */
export const logPageView = () => {
    if (typeof window === 'undefined') return;

    const page = window.location.pathname + window.location.search;
    const title = document.title;

    // Small delay ensures Meta tags (Helmet) have updated before we track
    setTimeout(() => {
        // 1. Dual-Track via Global gtag (Standard)
        if (window.gtag) {
            window.gtag('config', MEASUREMENT_ID, {
                page_path: page,
                page_title: title,
                page_location: window.location.href
            });
            console.log(`[Analytics] 📡 SPA Page View tracked: ${page} (${title})`);
        }

        // 2. Dual-Track via Firebase SDK (Redundancy)
        if (analytics) {
            firebaseLogEvent(analytics, 'page_view', {
                page_path: page,
                page_title: title,
                location: window.location.href
            });
        }
    }, 150);
};

export const logEvent = (name: string, params?: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    // 1. Global gtag
    if (window.gtag) {
        window.gtag('event', name, params);
        console.log(`[Analytics] 🔔 Event: ${name}`, params);
    }

    // 2. Firebase SDK
    if (analytics) {
        firebaseLogEvent(analytics, name, params);
    }
};

/**
 * Track Time spent on a specific question
 */
export const trackQuestionTime = (question_id: string, duration_seconds: number, subject: string) => {
    logEvent('question_time_spent', {
        question_id,
        duration: duration_seconds,
        subject,
        timestamp: new Date().toISOString()
    });
};

/**
 * Track Option Switching behavior
 */
export const trackOptionSwitch = (question_id: string, from_option: string, to_option: string) => {
    logEvent('option_switch', {
        question_id,
        from_option,
        to_option,
        timestamp: new Date().toISOString()
    });
};

/**
 * Track MCQ Attempt
 */
export const trackMCQAttempt = (exam: string, topic: string, status: 'Correct' | 'Incorrect' | 'Partial') => {
    logEvent('mcq_attempt', {
        exam,
        topic,
        status,
        timestamp: new Date().toISOString()
    });
};

/**
 * Track Lecture Engagement
 */
export const trackLectureView = (topic: string, duration_seconds: number) => {
    logEvent('lecture_watch', {
        topic,
        duration: duration_seconds,
        timestamp: new Date().toISOString()
    });
};

/**
 * Set User Properties
 */
export const setUserProperties = (properties: { user_class?: string, selected_exam?: string, auth_status: string }) => {
    if (typeof window === 'undefined') return;

    // 1. gtag
    if (window.gtag) {
        window.gtag('set', 'user_properties', properties);
        console.log('[Analytics] 👤 User Properties:', properties);
    }

    // 2. Firebase SDK
    if (analytics) {
        firebaseSetUserProperties(analytics, properties);
    }
};

/**
 * Error Tracking (Glitch Detection)
 */
export const trackGlitch = (error: string, component?: string) => {
    logEvent('exception', {
        description: error,
        fatal: false,
        component_name: component,
        url: window.location.href
    });
};

/**
 * Vital SEO Monitoring
 */
export const trackWebVitals = () => {
    if (typeof window === 'undefined') return;

    // LCP
    new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            logEvent('web_vitals', {
                metric_name: 'LCP',
                value: Math.round(entry.startTime),
                url: window.location.href
            });
        }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any) {
            if (!entry.hadRecentInput) {
                clsValue += entry.value;
            }
        }
        logEvent('web_vitals', {
            metric_name: 'CLS',
            value: clsValue,
            url: window.location.href
        });
    }).observe({ type: 'layout-shift', buffered: true });

    // FID
    new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any) {
            const delay = entry.processingStart - entry.startTime;
            logEvent('web_vitals', {
                metric_name: 'FID',
                value: Math.round(delay),
                event_name: entry.name,
                url: window.location.href
            });
        }
    }).observe({ type: 'first-input', buffered: true });
};

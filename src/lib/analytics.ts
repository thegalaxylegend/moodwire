
import ReactGA from "react-ga4";
import { getAnalytics, logEvent as firebaseLogEvent, setUserProperties as firebaseSetUserProperties } from "firebase/analytics";
import { app } from "./firebase";

// Initialize Firebase Analytics
const firebaseAnalytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

const MEASUREMENT_ID = "G-7MWNJDZ5D0";

// Initialize GA4
export const initAnalytics = () => {
    if (typeof window === 'undefined') return;

    try {
        ReactGA.initialize(MEASUREMENT_ID);
        console.log("[Analytics] initialized");
    } catch (error) {
        console.error("[Analytics] Initialization failed:", error);
    }
};

// Log page view
export const logPageView = () => {
    if (typeof window === 'undefined') return;

    const page = window.location.pathname + window.location.search;
    const title = document.title;

    // ReactGA
    ReactGA.send({ hitType: "pageview", page: page, title: title });
    console.log(`[Analytics] 📡 Page View: ${page}`);

    // Firebase
    if (firebaseAnalytics) {
        firebaseLogEvent(firebaseAnalytics, 'page_view', {
            page_path: page,
            page_title: title,
            location: window.location.href
        });
    }
};

// Log custom event
export const logEvent = (name: string, params?: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    // ReactGA
    ReactGA.event(name, params);
    console.log(`[Analytics] 🔔 Event: ${name}`, params);

    // Firebase
    if (firebaseAnalytics) {
        firebaseLogEvent(firebaseAnalytics, name, params);
    }
};

// Set user properties
export const setUserProperties = (properties: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    // ReactGA
    ReactGA.gtag('set', 'user_properties', properties);
    console.log('[Analytics] 👤 User Properties:', properties);

    // Firebase
    if (firebaseAnalytics) {
        firebaseSetUserProperties(firebaseAnalytics, properties);
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
 * Error Tracking (Glitch Detection)
 */
export const trackGlitch = (error: string | Error, component?: string) => {
    const errorMsg = typeof error === 'string' ? error : error.message;
    let stack: string | undefined;
    if (error instanceof Error) {
        stack = error.stack;
    }
    if (!stack) {
        try {
            stack = new Error().stack;
        } catch (e) {
            stack = "Stack trace unavailable";
        }
    }

    logEvent('exception', {
        description: errorMsg,
        fatal: true,
        component_name: component,
        url: window.location.href,
        timestamp: new Date().toISOString()
    });

    console.error(`[Analytics] 🆘 Error caught in ${component || 'unknown'}:`, errorMsg);
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


// Declare gtag for TS
declare global {
    interface Window {
        gtag: (...args: any[]) => void;
    }
}

// Measurement ID in index.html is G-7MWNJDZ5D0
// Measurement ID in index.html is G-7MWNJDZ5D0
export const logPageView = () => {
    // Small delay to allow React Helmet to update the document title
    setTimeout(() => {
        const page = window.location.pathname + window.location.search;
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_path: page,
                page_title: document.title,
                page_location: window.location.href
            });
            console.log(`[Analytics] 📡 Tracking Page View (gtag): ${page} | Title: ${document.title}`);
        } else {
            console.warn('[Analytics] gtag not found');
        }
    }, 100);
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
 * Track Option Switching behavior (Indicates confusion)
 */
export const trackOptionSwitch = (question_id: string, from_option: string, to_option: string) => {
    logEvent('option_switch', {
        question_id,
        from_option,
        to_option,
        timestamp: new Date().toISOString()
    });
};

export const logEvent = (name: string, params?: Record<string, any>) => {
    if (window.gtag) {
        window.gtag('event', name, params);
        console.log(`[Analytics] 🔔 Tracking Event: ${name}`, params);
    }
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
 * Set User Properties (for cross-report analysis)
 */
export const setUserProperties = (properties: { user_class?: string, selected_exam?: string, auth_status: string }) => {
    if (window.gtag) {
        window.gtag('set', 'user_properties', properties);
        console.log('[Analytics] 👤 User Properties Sync:', properties);
    }
};

/**
 * Self-Fixing Error Tracking (Glitch Detection)
 */
export const trackGlitch = (error: string, component?: string) => {
    logEvent('glitch_detected', {
        error_message: error,
        component_name: component,
        url: window.location.href
    });
};
/**
 * Track SEO Web Vitals (LCP, FID, CLS)
 */
export const trackWebVitals = () => {
    if (typeof window === 'undefined') return;

    // 1. Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
            logEvent('web_vitals', {
                metric_name: 'LCP',
                value: Math.round(entry.startTime),
                url: window.location.href
            });
        }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // 2. Cumulative Layout Shift (CLS)
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

    // 3. First Input Delay (FID)
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

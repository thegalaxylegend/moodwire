/**
 * OxygenOS-Style Animation System
 * Physics-based spring motion optimized for 60Hz/120Hz displays
 */

// ============================================
// SPRING PHYSICS CONSTANTS (OxygenOS preset)
// ============================================
export const SPRING_CONFIG = {
    stiffness: 140,
    damping: 20,
    mass: 1,
} as const;

// ============================================
// TIMING CONSTANTS
// ============================================
export const TIMING = {
    // Micro-interactions (hover, tap)
    micro: 150, // 120-180ms
    // Component transitions (cards, modals)
    component: 300, // 250-400ms
    // Page transitions
    page: 400, // 350-450ms
    // Maximum allowed
    max: 500,
} as const;

// ============================================
// CSS CUBIC-BEZIER PRESETS
// Mimics spring motion: fast start, soft end
// ============================================
export const EASING = {
    // OxygenOS feel: snappy start, smooth landing
    oxygen: 'cubic-bezier(0.22, 0.68, 0.35, 1.0)',
    // Slightly more aggressive for micro-interactions
    oxygenFast: 'cubic-bezier(0.22, 0.78, 0.35, 1.0)',
    // Softer for larger transitions
    oxygenSoft: 'cubic-bezier(0.25, 0.55, 0.35, 1.0)',
    // For press/release
    oxygenPress: 'cubic-bezier(0.34, 0.85, 0.45, 1.0)',
} as const;

// ============================================
// TRANSFORM PRESETS
// ============================================
export const TRANSFORM = {
    // Entry animation start state
    entryFrom: {
        opacity: 0,
        transform: 'translateY(16px) scale(0.96)',
    },
    // Entry animation end state
    entryTo: {
        opacity: 1,
        transform: 'translateY(0) scale(1)',
    },
    // Button press
    buttonPress: {
        transform: 'scale(0.97)',
    },
    buttonRelease: {
        transform: 'scale(1)',
    },
    // Card hover
    cardHover: {
        transform: 'translateY(-6px) scale(1.01)',
    },
    cardRest: {
        transform: 'translateY(0) scale(1)',
    },
} as const;

// ============================================
// INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
// ============================================
export const createScrollObserver = (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
): IntersectionObserver => {
    const defaultOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1,
        ...options,
    };

    return new IntersectionObserver((entries) => {
        // Use requestAnimationFrame for smooth 60Hz/120Hz
        requestAnimationFrame(() => {
            callback(entries);
        });
    }, defaultOptions);
};

// ============================================
// ANIMATION HELPER FUNCTIONS
// ============================================

/**
 * Applies entry animation to an element
 */
export const animateEntry = (
    element: HTMLElement,
    delay: number = 0
): void => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(16px) scale(0.96)';
    element.style.transition = `opacity ${TIMING.component}ms ${EASING.oxygen}, transform ${TIMING.component}ms ${EASING.oxygen}`;
    element.style.transitionDelay = `${delay}ms`;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0) scale(1)';
        });
    });
};

/**
 * Stagger animation for multiple elements
 */
export const animateStagger = (
    elements: HTMLElement[],
    staggerDelay: number = 50
): void => {
    elements.forEach((element, index) => {
        animateEntry(element, index * staggerDelay);
    });
};

// ============================================
// CSS CLASS NAMES FOR EASY APPLICATION
// ============================================
export const ANIMATION_CLASSES = {
    // Base class for all animated elements
    base: 'oxygen-animate',
    // Button with press effect
    button: 'oxygen-button',
    // Card with hover effect
    card: 'oxygen-card',
    // Fade in on scroll
    fadeIn: 'oxygen-fade-in',
    // Modal entrance
    modal: 'oxygen-modal',
    // Stagger children
    stagger: 'oxygen-stagger',
} as const;

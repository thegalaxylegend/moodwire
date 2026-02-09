import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook for scroll-triggered fade-in animations
 * Uses Intersection Observer for performance
 */
export const useScrollAnimation = (options?: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Use requestAnimationFrame for smooth 60Hz/120Hz
                requestAnimationFrame(() => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setIsVisible(true);
                            observer.unobserve(entry.target); // Animate only once
                        }
                    });
                });
            },
            {
                root: null,
                rootMargin: '0px 0px -50px 0px',
                threshold: 0.1,
                ...options,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [options]);

    return { ref, isVisible };
};

/**
 * Hook for stagger animation on children
 */
export const useStaggerAnimation = (options?: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                requestAnimationFrame(() => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setIsVisible(true);
                            observer.unobserve(entry.target);
                        }
                    });
                });
            },
            {
                root: null,
                rootMargin: '0px 0px -30px 0px',
                threshold: 0.05,
                ...options,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [options]);

    return {
        ref,
        className: `oxygen-stagger ${isVisible ? 'visible' : ''}`,
    };
};

/**
 * Hook for button press animation feedback
 */
export const usePressAnimation = () => {
    const [isPressed, setIsPressed] = useState(false);

    const handlers = {
        onMouseDown: useCallback(() => setIsPressed(true), []),
        onMouseUp: useCallback(() => setIsPressed(false), []),
        onMouseLeave: useCallback(() => setIsPressed(false), []),
        onTouchStart: useCallback(() => setIsPressed(true), []),
        onTouchEnd: useCallback(() => setIsPressed(false), []),
    };

    return {
        isPressed,
        handlers,
        style: {
            transform: isPressed ? 'scale(0.97)' : 'scale(1)',
            transition: 'transform 150ms cubic-bezier(0.34, 0.85, 0.45, 1.0)',
        },
    };
};

/**
 * Hook for modal open/close animation
 */
export const useModalAnimation = (isOpen: boolean) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Small delay for mount before animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setAnimationClass('open');
                });
            });
        } else {
            setAnimationClass('');
            // Wait for exit animation before unmounting
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return {
        shouldRender,
        modalClass: `oxygen-modal ${animationClass}`,
        backdropClass: `oxygen-modal-backdrop ${animationClass}`,
    };
};

import { useEffect, useRef } from 'react';

/**
 * Lightweight focus trap for modals and exam overlays.
 * Constrains Tab/Shift+Tab cycling within the referenced container.
 * No external dependencies required.
 * @param isActive - Whether the trap should be active
 */
export const useFocusTrap = (isActive: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const previouslyFocused = document.activeElement as HTMLElement | null;

        // Focus the container itself first
        container.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableSelectors = [
                'a[href]',
                'button:not([disabled])',
                'textarea:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                '[tabindex]:not([tabindex="-1"])',
            ].join(', ');

            const focusableElements = Array.from(
                container.querySelectorAll<HTMLElement>(focusableSelectors)
            ).filter(el => el.offsetParent !== null); // only visible elements

            if (focusableElements.length === 0) {
                e.preventDefault();
                return;
            }

            const firstEl = focusableElements[0];
            const lastEl = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift+Tab: wrap from first to last
                if (document.activeElement === firstEl || document.activeElement === container) {
                    e.preventDefault();
                    lastEl.focus();
                }
            } else {
                // Tab: wrap from last to first
                if (document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
            // Restore focus to previous element on unmount
            if (previouslyFocused && previouslyFocused.focus) {
                previouslyFocused.focus();
            }
        };
    }, [isActive]);

    return containerRef;
};

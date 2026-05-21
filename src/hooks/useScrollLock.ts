import { useEffect } from 'react';

/**
 * Locks body and main content scroll when a modal/overlay is active.
 * Restores the original overflow value on unmount.
 * @param isLocked - Whether scroll should be locked
 */
export const useScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        if (!isLocked) return;

        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;

        // Find all main scroll containers on the page
        const mainElements = Array.from(document.querySelectorAll('main'));
        const originalMainOverflows = mainElements.map(el => el.style.overflow);
        const originalMainPaddingRights = mainElements.map(el => el.style.paddingRight);

        // Calculate scrollbar width to prevent layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        // Lock body overflow
        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        // Lock main elements overflow
        mainElements.forEach(el => {
            el.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                el.style.paddingRight = `${scrollbarWidth}px`;
            }
        });

        return () => {
            // Restore body scroll
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;

            // Restore main elements scroll
            mainElements.forEach((el, index) => {
                el.style.overflow = originalMainOverflows[index];
                el.style.paddingRight = originalMainPaddingRights[index];
            });
        };
    }, [isLocked]);
};


import { useState, useEffect, useRef } from 'react';

/**
 * usePerformanceMonitor
 * Detects if the device is struggling to maintain a smooth frame rate (targets 60Hz/120Hz).
 * If the frame duration consistently exceeds 14ms (failing 60fps), it flags low performance.
 */
export const usePerformanceMonitor = (thresholdMs = 14, sampleSize = 10) => {
    const [isLowPerformance, setIsLowPerformance] = useState(false);
    const frameTimes = useRef<number[]>([]);
    const lastTime = useRef<number>(performance.now());
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const checkPerformance = (time: number) => {
            const delta = time - lastTime.current;
            lastTime.current = time;

            // Ignore extreme spikes (like tab switching)
            if (delta < 200) {
                frameTimes.current.push(delta);
                if (frameTimes.current.length > sampleSize) {
                    frameTimes.current.shift();
                    
                    const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / sampleSize;
                    
                    // If average frame time is > threshold (e.g. 14ms), we are dropping below 60fps
                    if (avgFrameTime > thresholdMs && !isLowPerformance) {
                        console.warn(`🏎️ [Performance] Low FPS detected (${Math.round(1000/avgFrameTime)} fps). Throttling effects...`);
                        setIsLowPerformance(true);
                    }
                }
            }

            requestRef.current = requestAnimationFrame(checkPerformance);
        };

        // Delay monitoring to avoid initial hydration/load jank
        const timer = setTimeout(() => {
            requestRef.current = requestAnimationFrame(checkPerformance);
        }, 3000);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(requestRef.current);
        };
    }, [thresholdMs, sampleSize, isLowPerformance]);

    return isLowPerformance;
};

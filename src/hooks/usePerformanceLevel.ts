import { useState, useEffect, useRef } from 'react';

export type PerformanceTier = 'elite' | 'balanced' | 'low';

/**
 * usePerformanceLevel
 * 3-Tier Multi-Adaptive Performance Monitoring (120fps -> 60fps -> 45fps)
 * Elite: < 9ms (Targets 120Hz)
 * Balanced: 9ms - 18ms (Targets 60Hz)
 * Low: > 18ms (Targets 45Hz/Battery Saver)
 */
export const usePerformanceLevel = (sampleSize = 60) => {
    const [tier, setTier] = useState<PerformanceTier>('balanced');
    const tierRef = useRef<PerformanceTier>('balanced');
    const frameTimes = useRef<number[]>([]);
    const lastTime = useRef<number>(performance.now());
    const requestRef = useRef<number>(0);
    const consecutiveEliteFrames = useRef<number>(0);
    const jankCount = useRef<number>(0);
    const lastJankTime = useRef<number>(0);
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Synchronize Ref with State
    useEffect(() => {
        tierRef.current = tier;
    }, [tier]);

    useEffect(() => {
        const checkPerformance = (time: number) => {
            const delta = time - lastTime.current;
            lastTime.current = time;

            // Frame throttling (only check once per 4 frames to save CPU during monitoring)
            if (Math.random() > 0.25) {
                requestRef.current = requestAnimationFrame(checkPerformance);
                return;
            }

            if (delta < 200) {
                // INSTANT JANK PROTECTION (Thermal / Conflict Detection)
                // Loosened threshold: 110ms (approx 9fps)
                if (delta > 110) { 
                    jankCount.current++;
                    lastJankTime.current = time;
                    
                    // Requirement: 2 consecutive janks before dropping to safety tier
                    if (tierRef.current !== 'low' && jankCount.current >= 2) {
                        console.warn(`[Performance] Significant jitter detected (${delta.toFixed(1)}ms). Switching to thermal safety mode.`);
                        setTier('low');
                        jankCount.current = 0; // Reset after drop
                    }
                } else {
                    // Decay the jank count if we have a good frame
                    if (jankCount.current > 0) jankCount.current -= 0.1;
                }

                frameTimes.current.push(delta);
                if (frameTimes.current.length > sampleSize) {
                    frameTimes.current.shift();
                    
                    const avgFT = frameTimes.current.reduce((a, b) => a + b, 0) / sampleSize;
                    const currentTier = tierRef.current;
                    
                    // Safety check: if we recently had a jank, don't move up for 6 seconds (was 10)
                    const recentlyJanked = time - lastJankTime.current < 6000;

                    if (avgFT > 22) { 
                        if (currentTier !== 'low') setTier('low');
                    } else if (avgFT > 14) { 
                        if (currentTier === 'elite') setTier('balanced');
                    } else if (avgFT < 7 && !recentlyJanked) { 
                        consecutiveEliteFrames.current++;
                        if (currentTier !== 'elite' && consecutiveEliteFrames.current > 250) {
                            setTier('elite');
                        }
                    } else {
                        consecutiveEliteFrames.current = 0;
                    }
                }
            }

            requestRef.current = requestAnimationFrame(checkPerformance);
        };

        // Long Task Monitoring (The true indicator of UI lag/Throttling)
        let observer: PerformanceObserver | null = null;
        try {
            observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 100) { // Main thread blocked for >100ms
                         console.warn("[Performance] Long task detected. Thermal Safety triggered.");
                         setTier('low');
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // PerformanceObserver for longtask not supported in all browsers
        }

        // Proper Cleanup-Safe Battery Logic
        let batteryListenerObject: any = null;
        const updateBatteryStatus = (battery: any) => {
            // On Mobile/Laptops, charging = potential HEAT.
            // On Desktop, charging is always true/irrelevant.
            if (battery.level < 0.20 || (!battery.charging && isMobile)) {
                setTier('low');
            } else if (battery.charging && isMobile && battery.level > 0.90) {
                // Near full capacity + charging is the hottest state for a phone.
                setTier('balanced'); 
            }
        };

        const handleBatteryChange = (e: any) => updateBatteryStatus(e.target);

        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                updateBatteryStatus(battery);
                battery.addEventListener('chargingchange', handleBatteryChange);
                battery.addEventListener('levelchange', handleBatteryChange);
                batteryListenerObject = battery;
            });
        }

        const initialTimer = setTimeout(() => {
            requestRef.current = requestAnimationFrame(checkPerformance);
        }, 3000); // 3s grace period for hydration stability

        return () => {
            clearTimeout(initialTimer);
            cancelAnimationFrame(requestRef.current);
            if (batteryListenerObject) {
                batteryListenerObject.removeEventListener('chargingchange', handleBatteryChange);
                batteryListenerObject.removeEventListener('levelchange', handleBatteryChange);
            }
            if (observer) observer.disconnect();
        };
    }, [sampleSize]); // Removing 'tier' from dependency array to prevent infinite loops

    return tier;
};

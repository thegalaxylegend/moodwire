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
                frameTimes.current.push(delta);
                if (frameTimes.current.length > sampleSize) {
                    frameTimes.current.shift();
                    
                    const avgFT = frameTimes.current.reduce((a, b) => a + b, 0) / sampleSize;
                    const currentTier = tierRef.current;
                    
                    // Unified thresholding logic with HYSTERESIS
                    if (avgFT > 22) { // Dropped below 45fps
                        if (currentTier !== 'low') setTier('low');
                    } else if (avgFT > 14) { // Dropped below 70fps
                        if (currentTier === 'elite') setTier('balanced');
                    } else if (avgFT < 7) { // Solid 144fps potential
                        consecutiveEliteFrames.current++;
                        if (currentTier !== 'elite' && consecutiveEliteFrames.current > 200) {
                            setTier('elite');
                        }
                    } else {
                        consecutiveEliteFrames.current = 0;
                    }
                }
            }

            requestRef.current = requestAnimationFrame(checkPerformance);
        };

        // Proper Cleanup-Safe Battery Logic
        let batteryListenerObject: any = null;
        const updateBatteryStatus = (battery: any) => {
            if (!battery.charging || battery.level < 0.15) {
                setTier('low');
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
        };
    }, [sampleSize]); // Removing 'tier' from dependency array to prevent infinite loops

    return tier;
};

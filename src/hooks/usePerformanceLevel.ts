import { useState, useEffect, useRef } from 'react';

export type PerformanceTier = 'elite' | 'balanced' | 'low';

/**
 * usePerformanceLevel — Smart 3-Tier Adaptive Performance System
 *
 * Tier Classification:
 *   elite    → High-end PC / flagship phone. Full animations, blur, glows.
 *   balanced → Mid-range laptop / phone. Reduced blur, lighter animations.
 *   low      → Very low-end device / battery saver. Zero animations, no blur.
 *
 * Detection Strategy (layered, most accurate → fallback):
 *   1. OS prefers-reduced-motion → always 'low'
 *   2. Hardware capability pre-scan (memory, CPU cores, connection) → initial tier
 *   3. Mobile UA heuristic → bias toward 'balanced' not 'low'
 *   4. rAF frame-time monitoring → real-time adaptive upgrade/downgrade
 *   5. Battery API → only extreme cases trigger downgrade (< 15%)
 *   6. Long task observer → debounced (3 janks needed, not 1)
 */
export const usePerformanceLevel = (enabled = true, sampleSize = 90) => {
    // ─── Step 1: Detect OS-level preference immediately (synchronous) ─────────
    const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─── Step 2: Hardware capability pre-scan ─────────────────────────────────
    const getHardwareTier = (): PerformanceTier => {
        if (prefersReduced) return 'low';

        const nav = navigator as any;
        const memory: number = nav.deviceMemory ?? 4;        // GB RAM (Chrome/Android)
        const cores: number  = nav.hardwareConcurrency ?? 4; // CPU logical cores
        const conn   = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
        const isSlow = conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g';
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Very low-end: ≤1GB RAM or ≤2 CPU cores or very slow network
        if (memory <= 1 || cores <= 2 || isSlow) return 'low';

        // Mid-range: ≤3GB RAM or ≤4 cores, AND on mobile
        if (isMobile && (memory <= 3 || cores <= 4)) return 'balanced';

        // Everything else starts as elite and adapts down if needed
        return 'elite';
    };

    const initialTier = getHardwareTier();
    const [tier, setTier] = useState<PerformanceTier>(initialTier);
    const tierRef = useRef<PerformanceTier>(initialTier);

    const lowestTierObserved = useRef<PerformanceTier>(initialTier);

    const frameTimes     = useRef<number[]>([]);
    const lastTime       = useRef<number>(0);
    const requestRef     = useRef<number>(0);
    const longTaskCount  = useRef<number>(0);

    // Keep ref in sync with state
    useEffect(() => { tierRef.current = tier; }, [tier]);

    useEffect(() => {
        if (!enabled) return;

        // ─── If OS says reduce motion, stay locked to 'low' forever ──────────
        if (prefersReduced) {
            setTier('low');
            return;
        }

        // ─── rAF frame-time monitor ──────────────────────────────────────────
        const checkPerformance = (time: number) => {
            const delta = time - lastTime.current;
            lastTime.current = time;

            // Sample only 1 in 4 frames to minimize measurement overhead
            if (Math.random() > 0.25) {
                requestRef.current = requestAnimationFrame(checkPerformance);
                return;
            }

            if (delta > 0 && delta < 500) {
                // Instant freeze detection: single frame > 150ms
                if (delta > 150) {
                    lowestTierObserved.current = 'low';
                }

                frameTimes.current.push(delta);
                if (frameTimes.current.length > sampleSize) {
                    frameTimes.current.shift();
                    const avg = frameTimes.current.reduce((a, b) => a + b, 0) / sampleSize;

                    // Downgrade based on average
                    if (avg > 28) {
                        lowestTierObserved.current = 'low';
                    } else if (avg > 18) {
                        if (lowestTierObserved.current === 'elite') {
                            lowestTierObserved.current = 'balanced';
                        }
                    }
                }
            }

            requestRef.current = requestAnimationFrame(checkPerformance);
        };

        // ─── Long Task Observer (debounced — 2 tasks needed) ─────────────────
        let observer: PerformanceObserver | null = null;
        try {
            observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 150) {
                        longTaskCount.current++;
                        if (longTaskCount.current >= 2) {
                            lowestTierObserved.current = 'low';
                        }
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (_) {
            // Not supported in all environments
        }

        // ─── Battery API — only extreme low battery triggers downgrade ────────
        let batteryRef: any = null;
        const handleBattery = (battery: any) => {
            if (battery.level < 0.15) {
                lowestTierObserved.current = 'low';
            }
        };
        const onBatteryChange = (e: any) => handleBattery(e.target);

        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                handleBattery(battery);
                battery.addEventListener('levelchange', onBatteryChange);
                batteryRef = battery;
            }).catch(() => {/* ignore */});
        }

        // ─── Profiling grace period: start monitoring after 1.5s ─────────────
        const startTimer = setTimeout(() => {
            lastTime.current = performance.now();
            requestRef.current = requestAnimationFrame(checkPerformance);
        }, 1500);

        // ─── Profiling lock: lock the performance tier after 5.5s total ──────
        const lockTimer = setTimeout(() => {
            cancelAnimationFrame(requestRef.current);
            observer?.disconnect();
            if (batteryRef) {
                batteryRef.removeEventListener('levelchange', onBatteryChange);
            }
            
            const finalTier = lowestTierObserved.current;
            console.log(`[Perf] Profiling completed. Performance tier locked to: ${finalTier}`);
            setTier(finalTier);
        }, 5500);

        return () => {
            clearTimeout(startTimer);
            clearTimeout(lockTimer);
            cancelAnimationFrame(requestRef.current);
            observer?.disconnect();
            if (batteryRef) {
                batteryRef.removeEventListener('levelchange', onBatteryChange);
            }
        };
    }, [enabled, sampleSize, prefersReduced]);

    return tier;
};

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

    const frameTimes     = useRef<number[]>([]);
    const lastTime       = useRef<number>(performance.now());
    const requestRef     = useRef<number>(0);
    const goodFrames     = useRef<number>(0);   // consecutive good frames before promoting
    const longTaskCount  = useRef<number>(0);   // debounce long task drops
    const jankCount      = useRef<number>(0);   // rapid-jank detector

    // Keep ref in sync with state
    useEffect(() => { tierRef.current = tier; }, [tier]);

    useEffect(() => {
        if (!enabled) return;

        // ─── If OS says reduce motion, stay locked to 'low' forever ──────────
        if (prefersReduced) {
            setTier('low');
            return;
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
                // ── Instant jank guard: a single frame > 150ms is a freeze ──
                if (delta > 150) {
                    jankCount.current++;
                    // Require 3 rapid janks to drop (was 2), avoids false positives
                    if (jankCount.current >= 3 && tierRef.current !== 'low') {
                        console.warn(`[Perf] Freeze detected (${delta.toFixed(0)}ms ×${jankCount.current}). Dropping to low.`);
                        setTier('low');
                        goodFrames.current = 0;
                        jankCount.current  = 0;
                    }
                } else {
                    // Decay jank counter on good frames
                    jankCount.current = Math.max(0, jankCount.current - 0.2);
                    goodFrames.current++;
                }

                frameTimes.current.push(delta);
                if (frameTimes.current.length > sampleSize) {
                    frameTimes.current.shift();
                    const avg = frameTimes.current.reduce((a, b) => a + b, 0) / sampleSize;

                    const cur = tierRef.current;

                    // ── Downgrade thresholds ──────────────────────────────
                    // avg > 28ms ≈ < 36fps → drop to 'low'
                    if (avg > 28 && cur !== 'low') {
                        setTier('low');
                        goodFrames.current = 0;
                    }
                    // avg > 18ms ≈ < 56fps → drop to 'balanced' (not all the way to low)
                    else if (avg > 18 && cur === 'elite') {
                        setTier('balanced');
                        goodFrames.current = 0;
                    }
                    // ── Upgrade thresholds (conservative — need sustained good perf) ──
                    // avg < 10ms ≈ > 100fps AND 180 consecutive good frames ≈ 3s
                    else if (avg < 10 && cur === 'balanced' && goodFrames.current > 180) {
                        // Only promote to elite on desktop/non-mobile
                        if (!isMobile) {
                            setTier('elite');
                        }
                    }
                    // avg < 16ms ≈ > 62fps AND 120 good frames ≈ 2s — promote from low to balanced
                    else if (avg < 16 && cur === 'low' && goodFrames.current > 120) {
                        setTier('balanced');
                    }
                }
            }

            requestRef.current = requestAnimationFrame(checkPerformance);
        };

        // ─── Long Task Observer (debounced — 3 tasks needed) ─────────────────
        let observer: PerformanceObserver | null = null;
        try {
            observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    // Only count truly severe blocks (> 150ms, not just any 50ms task)
                    if (entry.duration > 150) {
                        longTaskCount.current++;
                        if (longTaskCount.current >= 3 && tierRef.current !== 'low') {
                            console.warn(`[Perf] ${longTaskCount.current} long tasks. Thermal protection active.`);
                            setTier('low');
                            longTaskCount.current = 0;
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
            // Only drop to low if critically low battery (< 15%)
            // Don't punish "not charging" — that's too aggressive for laptops
            if (battery.level < 0.15) {
                setTier('low');
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

        // ─── Grace period: start monitoring after 2s (was 3s) ────────────────
        const timer = setTimeout(() => {
            requestRef.current = requestAnimationFrame(checkPerformance);
        }, 2000);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(requestRef.current);
            observer?.disconnect();
            if (batteryRef) {
                batteryRef.removeEventListener('levelchange', onBatteryChange);
            }
        };
    }, [enabled, sampleSize, prefersReduced]);

    return tier;
};

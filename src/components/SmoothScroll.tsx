import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router-dom';
import { usePerformance } from '../context/PerformanceProvider';

export const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { tier } = usePerformance();
  const isLow = tier === 'low';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect high-level preference for reduced motion
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Disable smooth scroll for low-performance/battery mode or if preferred
    if (isReducedMotion || isLow || location.pathname.startsWith('/admin')) {
        if (isLow) console.log("🚀 [Performance] Disabling smooth scroll engine for Low-Tier mode.");
        
        // CRITICAL: Clean up root element to restore native browser scroll behaviors
        const root = document.documentElement;
        root.style.scrollBehavior = '';
        root.classList.remove('lenis', 'lenis-stopped', 'lenis-smooth', 'menu-open', 'chat-open');
        return;
    }

    let rafId: number;
    let lenis: Lenis | null = null;

    try {
        const root = document.documentElement;
        root.style.scrollBehavior = 'auto';
        
        lenis = new Lenis({
          duration: 1.4,
          // Premium spring easing: fast start, ultra-soft exponential landing
          easing: (t: number) => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            // Expo out — feels like iOS momentum scroll inertia
            return 1 - Math.pow(2, -10 * t);
          },
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1.0,
          touchMultiplier: 2.0,
          infinite: false,
        });

        // Sync initial state
        root.classList.add('lenis', 'lenis-smooth');

        // Handle external scroll locking (e.g. from Chatbot or Mobile Menu)
        const observer = new MutationObserver(() => {
          const isMenuOpen = root.classList.contains('menu-open') && window.innerWidth < 768;
          const isLocked = root.classList.contains('chat-open') || isMenuOpen;
          
          if (isLocked) {
            lenis?.stop();
          } else {
            lenis?.start();
          }
        });

        observer.observe(root, { attributes: true, attributeFilter: ['class'] });

        // Initial check
        const initialMenuOpen = root.classList.contains('menu-open') && window.innerWidth < 768;
        const initialLocked = root.classList.contains('chat-open') || initialMenuOpen;
        if (initialLocked) lenis.stop();

        function raf(time: number) {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);

        return () => {
          if (rafId) cancelAnimationFrame(rafId);
          observer.disconnect();
          lenis?.destroy();
          
          // CRITICAL: Reset root on unmount to prevent stale locking
          root.style.scrollBehavior = '';
          root.classList.remove('lenis', 'lenis-stopped', 'lenis-smooth', 'menu-open', 'chat-open');
        };
    } catch (e) {
        console.error("Lenis initialization failed:", e);
        return;
    }
  }, [isLow]);

  return <>{children}</>;
};

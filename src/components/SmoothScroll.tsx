import { useEffect } from 'react';
import Lenis from 'lenis';
import { useLocation } from 'react-router-dom';

export const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  useEffect(() => {
    // Only initialize on client
    if (typeof window === 'undefined') return;

    // We ensure native scroll behavior is reset to avoid conflicting with Lenis
    document.documentElement.style.scrollBehavior = 'auto';

    // Disable smooth scroll hijacking on heavy pages and admin dashboards
    if (location.pathname.startsWith('/blog') || 
        location.pathname.startsWith('/admin') || 
        location.pathname.startsWith('/dashboard')) {
      return;
    }

    let rafId: number;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      infinite: false,
    });

    // Handle external scroll locking (e.g. from Chatbot)
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains('chat-open')) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Initial check
    if (document.documentElement.classList.contains('chat-open')) lenis.stop();

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      lenis.destroy();
    };
  }, [location.pathname]);

  return <>{children}</>;
};

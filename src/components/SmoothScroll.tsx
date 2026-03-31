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

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      infinite: false,
    });

    function raf(time: number) {
      if (lenis) {
         lenis.raf(time);
      }
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      if (lenis) {
        lenis.destroy();
      }
    };
  }, [location.pathname]);

  return <>{children}</>;
};

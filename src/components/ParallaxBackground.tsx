import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePerformance } from '../context/PerformanceProvider';

export const ParallaxBackground = () => {
    const loc = useLocation();
    const { tier } = usePerformance();
    const isLow = tier === 'low';

    // Dynamic color selection based on route
    const glowColor = useMemo(() => {
        const path = loc.pathname.toLowerCase();
        if (path.includes('/blog')) return 'rgba(168, 85, 247, 0.15)'; // Purple
        if (path.includes('/neet')) return 'rgba(16, 185, 129, 0.15)'; // Emerald
        if (path.includes('/jee-mains')) return 'rgba(59, 130, 246, 0.15)'; // Blue
        if (path.includes('/dashboard')) return 'rgba(139, 92, 246, 0.1)'; // Deep Purple
        return 'rgba(168, 85, 247, 0.15)'; // Default Purple
    }, [loc.pathname]);

    // Background is always rendered but complex orbs are hidden via CSS classes (perf-tier-low)
    // This is significantly cheaper than React unmounting the entire tree.
    return (
        <div className={`fixed inset-0 -z-50 pointer-events-none overflow-hidden bg-black transition-opacity duration-700 ${isLow ? 'opacity-100' : 'opacity-100'}`}>
            {/* Ambient Base - Always visible for premium feel */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,25,1)_0%,rgba(0,0,0,1)_100%)]" />

            {/* Ghost-Glow Orbs: Hardware accelerated via .gpu-layer. Automatically hidden in low-tier CSS */}
            <div 
                className="absolute top-[-10%] left-[-10%] size-[40%] ghost-glow gpu-layer tier-aware-orb"
                style={{ 
                    '--glow-color': glowColor,
                    transform: 'translate3d(0,0,0)'
                } as any} 
            />
            
            <div 
                className="absolute bottom-[10%] right-[-5%] size-[35%] ghost-glow gpu-layer tier-aware-orb"
                style={{ 
                    '--glow-color': glowColor,
                    transform: 'translate3d(0,0,0)',
                    animationDelay: '-2s'
                } as any} 
            />

            <div 
                className="absolute top-[20%] right-[15%] size-[25%] ghost-glow gpu-layer opacity-40 tier-aware-orb"
                style={{ 
                    '--glow-color': glowColor,
                    transform: 'translate3d(0,0,0)',
                    animationDelay: '-5s'
                } as any} 
            />

            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')] pointer-events-none mix-blend-overlay" />
        </div>
    );
};

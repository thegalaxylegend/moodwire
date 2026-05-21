import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { usePerformanceLevel } from '../hooks/usePerformanceLevel';
import type { PerformanceTier } from '../hooks/usePerformanceLevel';

export type PerformanceMode = 'auto' | 'low' | 'medium' | 'extreme';

interface PerformanceContextType {
    tier: PerformanceTier;
    mode: PerformanceMode;
    setMode: (mode: PerformanceMode) => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setModeState] = useState<PerformanceMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('oxygen_perf_mode') as PerformanceMode;
            if (saved === 'auto' || saved === 'low' || saved === 'medium' || saved === 'extreme') {
                return saved;
            }
        }
        return 'auto';
    });

    // Only run dynamic analysis if we are in 'auto' mode
    const dynamicTier = usePerformanceLevel(mode === 'auto');

    const tier = React.useMemo<PerformanceTier>(() => {
        if (mode === 'low') return 'low';
        if (mode === 'medium') return 'balanced';
        if (mode === 'extreme') return 'elite';
        return dynamicTier;
    }, [mode, dynamicTier]);

    const setMode = (newMode: PerformanceMode) => {
        setModeState(newMode);
        localStorage.setItem('oxygen_perf_mode', newMode);
    };

    const value = React.useMemo(() => ({ tier, mode, setMode }), [tier, mode]);

    return (
        <PerformanceContext.Provider value={value}>
            <div className={`perf-tier-${tier} contents`}>
                {children}
            </div>
        </PerformanceContext.Provider>
    );
};

export const usePerformance = () => {
    const context = useContext(PerformanceContext);
    if (!context) {
        throw new Error('usePerformance must be used within a PerformanceProvider');
    }
    return context;
};


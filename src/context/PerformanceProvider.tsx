import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { usePerformanceLevel } from '../hooks/usePerformanceLevel';
import type { PerformanceTier } from '../hooks/usePerformanceLevel';

interface PerformanceContextType {
    tier: PerformanceTier;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const tier = usePerformanceLevel();
    const value = React.useMemo(() => ({ tier }), [tier]);

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

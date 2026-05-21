import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type BadgeStyle = 'professional' | 'simple';

interface BadgeStyleContextType {
    badgeStyle: BadgeStyle;
    setBadgeStyle: (style: BadgeStyle) => void;
}

const BadgeStyleContext = createContext<BadgeStyleContextType | undefined>(undefined);

export const BadgeStyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [badgeStyle, setBadgeStyleState] = useState<BadgeStyle>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('examcompass_badge_style') as BadgeStyle;
            if (saved === 'professional' || saved === 'simple') {
                return saved;
            }
        }
        return 'professional';
    });

    const setBadgeStyle = (newStyle: BadgeStyle) => {
        setBadgeStyleState(newStyle);
        localStorage.setItem('examcompass_badge_style', newStyle);
    };

    const value = React.useMemo(() => ({ badgeStyle, setBadgeStyle }), [badgeStyle]);

    return (
        <BadgeStyleContext.Provider value={value}>
            {children}
        </BadgeStyleContext.Provider>
    );
};

export const useBadgeStyle = () => {
    const context = useContext(BadgeStyleContext);
    if (!context) {
        throw new Error('useBadgeStyle must be used within a BadgeStyleProvider');
    }
    return context;
};

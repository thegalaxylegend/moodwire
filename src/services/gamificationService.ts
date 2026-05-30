
export interface Rank {
    name: string;
    minXp: number;
    color: string;
    icon: string;
}

// Helper to generate divisions
const createRanks = (type: 'xp' | 'pts' = 'xp') => {
    const xpTiers = [
        { name: 'Bronze', start: 0, end: 1250, color: '#cd7f32', icon: '🥉' },
        { name: 'Silver', start: 1250, end: 3750, color: '#c0c0c0', icon: '🥈' },
        { name: 'Gold', start: 3750, end: 7500, color: '#ffd700', icon: '🥇' },
        { name: 'Platinum', start: 7500, end: 12500, color: '#00bcd4', icon: '💠' },
        { name: 'Diamond', start: 12500, end: 17500, color: '#b9f2ff', icon: '💎' },
        { name: 'Heroic', start: 17500, end: 21250, color: '#ef4444', icon: '🩸' },
        { name: 'Master', start: 21250, end: 25000, color: '#a855f7', icon: '🟣' },
        { name: 'Elite Master', start: 25000, end: 50000, color: '#3b82f6', icon: '⚡' }
    ];

    const ptsTiers = [
        { name: 'Bronze', start: 0, end: 2500, color: '#cd7f32', icon: '🥉' },
        { name: 'Silver', start: 2500, end: 7500, color: '#c0c0c0', icon: '🥈' },
        { name: 'Gold', start: 7500, end: 15000, color: '#ffd700', icon: '🥇' },
        { name: 'Platinum', start: 15000, end: 25000, color: '#00bcd4', icon: '💠' },
        { name: 'Diamond', start: 25000, end: 35000, color: '#b9f2ff', icon: '💎' },
        { name: 'Heroic', start: 35000, end: 42500, color: '#ef4444', icon: '🩸' },
        { name: 'Master', start: 42500, end: 50000, color: '#a855f7', icon: '🟣' },
        { name: 'Elite Master', start: 50000, end: 100000, color: '#3b82f6', icon: '⚡' }
    ];

    const tiers = type === 'xp' ? xpTiers : ptsTiers;
    const gmThreshold = type === 'xp' ? 50000 : 100000;

    const ranks: Rank[] = [];

    tiers.forEach(tier => {
        const range = tier.end - tier.start;
        const step = range / 5;

        for (let i = 5; i >= 1; i--) {
            const divisionStart = tier.start + ((5 - i) * step);
            ranks.push({
                name: `${tier.name} ${i}`,
                minXp: Math.floor(divisionStart),
                color: tier.color,
                icon: tier.icon
            });
        }
    });

    ranks.push({ name: 'Grandmaster', minXp: gmThreshold, color: '#ff00ff', icon: '👑' });

    return ranks;
};

export const XP_RANKS: Rank[] = createRanks('xp');
export const POINT_RANKS: Rank[] = createRanks('pts');
export const RANKS: Rank[] = XP_RANKS; // Default to XP for legacy support

export const calculateGains = (action: 'mcq_correct' | 'mcq_incorrect' | 'lecture_watch' | 'daily_claim', metadata?: any): { xp: number; pts: number } => {
    switch (action) {
        case 'mcq_correct': {
            const base = 20 + (metadata?.difficulty === 'Hard' ? 10 : 0);
            return { xp: 0, pts: base * 2 }; // Points only for tests
        }
        case 'mcq_incorrect':
            return { xp: 0, pts: 10 }; // Points only for tests
        case 'lecture_watch': {
            const xp = Math.min(Math.floor((metadata?.duration || 0) / 6), 500); // 10 XP per minute, max 500
            return { xp, pts: 0 }; // XP only for video study
        }
        case 'daily_claim': {
            const streak = metadata?.streak || 0;
            const loginGains = Math.min(100 + (streak * 10), 500); // Base 100 + 10/day, cap at 500
            return { xp: loginGains, pts: loginGains };
        }
        default:
            return { xp: 0, pts: 0 };
    }
};

// Legacy support
export const calculateXP = (action: any, meta?: any) => calculateGains(action, meta).xp;

export const getRankByValue = (value: number, type: 'xp' | 'pts' = 'xp'): Rank => {
    const scale = type === 'xp' ? XP_RANKS : POINT_RANKS;
    return [...scale].reverse().find(rank => value >= rank.minXp) || scale[0];
};

export const getNextRank = (value: number, type: 'xp' | 'pts' = 'xp'): Rank | null => {
    const scale = type === 'xp' ? XP_RANKS : POINT_RANKS;
    const currentRankIndex = scale.findIndex(r => value >= r.minXp && (scale[scale.indexOf(r) + 1] ? value < scale[scale.indexOf(r) + 1].minXp : true));
    return scale[currentRankIndex + 1] || null;
};

// Seasonal Reset Logic (2-month cycles)
export const getCurrentSeason = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // Calculate 2-month block (Season 1 to 6)
    // Jan/Feb (0,1) -> S1
    // Mar/Apr (2,3) -> S2
    // ...
    const seasonNum = Math.floor(month / 2) + 1;
    return `${year}-S${seasonNum}`;
};

// Point Cycle Logic (2-month cycles, offset by 1 month)
// Feb/Mar -> P1
// Apr/May -> P2
// ... or simply even month start: 
// Feb/Mar (1,2) -> P1
// Apr/May (3,4) -> P2
// Jun/Jul (5,6) -> P3
// Aug/Sep (7,8) -> P4
// Oct/Nov (9,10) -> P5
// Dec/Jan (11,0) -> P6
export const getCurrentPointCycle = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // Offset by 1 to make it start on even months
    // Feb(1) / 2 = 0.5 -> 1
    // Mar(2) / 2 = 1 -> 1
    // Dec(11) / 2 = 5.5 -> 6
    // Jan(0) -> special case or just part of P6 of prev year? 
    // Let's keep it simple: Even month start.
    const cycleNum = Math.floor(((month <= 0 ? 11 : month - 1) / 2)) + 1;
    const cycleYear = month === 0 ? year - 1 : year;
    return `${cycleYear}-P${cycleNum}`;
};

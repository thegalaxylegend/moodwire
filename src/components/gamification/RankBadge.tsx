
import React from 'react';
import { motion } from 'framer-motion';
import { getRankByValue } from '../../services/gamificationService';
import { useBadgeStyle } from '../../context/BadgeStyleProvider';
import type { BadgeStyle } from '../../context/BadgeStyleProvider';
import { usePerformance } from '../../context/PerformanceProvider';

// Custom Glowing Rank Icons (SVGs)

const BronzeIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e5a97d" />
                <stop offset="40%" stopColor="#cd7f32" />
                <stop offset="100%" stopColor="#7c4612" />
            </linearGradient>
            <linearGradient id="bronze-accent" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#cd7f32" />
            </linearGradient>
        </defs>
        <path 
            d="M32 4L12 10V28C12 41.5 20.5 53.5 32 58C43.5 53.5 52 41.5 52 28V10L32 4Z" 
            fill="url(#bronze-grad)" 
            stroke={color} 
            strokeWidth="2"
        />
        <path 
            d="M32 8L16 13V28C16 38.5 22.5 48.5 32 52.5C41.5 48.5 48 38.5 48 28V13L32 8Z" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeOpacity="0.3" 
            fill="none"
        />
        <path 
            d="M20 32L32 20L44 32M20 40L32 28L44 40" 
            stroke="url(#bronze-accent)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

const SilverIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3f4f6" />
                <stop offset="50%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#4b5563" />
            </linearGradient>
            <linearGradient id="silver-accent" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
        </defs>
        <path 
            d="M32 4L10 12V26C10 40 19 53 32 58C45 53 54 40 54 26V12L32 4Z" 
            fill="url(#silver-grad)" 
            stroke={color} 
            strokeWidth="2"
        />
        <path 
            d="M6 18L18 26L6 34M58 18L46 26L58 34" 
            stroke="#ffffff" 
            strokeWidth="2" 
            strokeOpacity="0.4"
        />
        <path 
            d="M32 8L14 15V26C14 37 21.5 48.5 32 52.5C42.5 48.5 50 37 50 26V15L32 8Z" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeOpacity="0.3" 
            fill="none"
        />
        <path 
            d="M22 24L32 14L42 24M22 34L32 24L42 34" 
            stroke="url(#silver-accent)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

const GoldIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="gold-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
        </defs>
        <path 
            d="M32 4L10 12V26C10 40 19 53 32 58C45 53 54 40 54 26V12L32 4Z" 
            fill="url(#gold-grad)" 
            stroke={color} 
            strokeWidth="2"
        />
        <path 
            d="M32 8L14 15V26C14 37 21.5 48.5 32 52.5C42.5 48.5 50 37 50 26V15L32 8Z" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeOpacity="0.4" 
            fill="none"
        />
        <path 
            d="M32 16L35.5 25.5L45 29L35.5 32.5L32 42L28.5 32.5L19 29L28.5 25.5L32 16Z" 
            fill="url(#gold-star-grad)" 
        />
        <circle cx="32" cy="29" r="2.5" fill="#ffffff" />
    </svg>
);

const PlatinumIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="plat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="40%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#155e75" />
            </linearGradient>
            <linearGradient id="plat-light" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
        </defs>
        <path 
            d="M32 4L50 14V42L32 58L14 42V14L32 4Z" 
            fill="url(#plat-grad)" 
            stroke={color} 
            strokeWidth="2"
        />
        <path 
            d="M32 8L46 16V39L32 53L18 39V16L32 8Z" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeOpacity="0.4" 
            fill="none"
        />
        <path 
            d="M32 16L38 26L48 32L38 38L32 48L26 38L16 32L26 26L32 16Z" 
            fill="url(#plat-light)" 
        />
        <circle cx="32" cy="32" r="3" fill="#ffffff" />
    </svg>
);

const DiamondIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="diamond-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="40%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
        </defs>
        <path 
            d="M32 4L52 20L32 58L12 20L32 4Z" 
            fill="url(#diamond-grad)" 
            stroke={color} 
            strokeWidth="2"
        />
        <path d="M32 4V58" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
        <path d="M12 20H52" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
        <path d="M32 4L22 20L32 58L42 20L32 4Z" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.6" />
        <circle cx="32" cy="20" r="3" fill="#ffffff" />
    </svg>
);

const HeroicIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="heroic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fecaca" />
                <stop offset="40%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="fire-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
        </defs>
        <path 
            d="M32 4L54 12V32C54 44.5 45 54.5 32 59C19 54.5 10 44.5 10 32V12L32 4Z" 
            fill="url(#heroic-grad)" 
            stroke={color} 
            strokeWidth="2.5"
        />
        <path 
            d="M32 9L49 16V32C49 42 42 50.5 32 54.5C22 50.5 15 42 15 32V16L32 9Z" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeOpacity="0.3" 
            fill="none"
        />
        <path 
            d="M32 44C32 44 42 36 40 24C38.5 18 34.5 14 32 14C29.5 14 25.5 18 24 24C22 36 32 44 32 44Z" 
            fill="url(#fire-grad)" 
        />
        <path 
            d="M32 44C32 44 37 39 36 31C35 25 33 22 32 22C31 22 29 25 28 31C27 39 32 44 32 44Z" 
            fill="#fef08a" 
        />
    </svg>
);

const MasterIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="master-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3e8ff" />
                <stop offset="40%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
            <radialGradient id="portal-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="60%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#000000" />
            </radialGradient>
        </defs>
        <path 
            d="M32 4L52 14V42L32 58L12 42V14L32 4Z" 
            fill="url(#master-grad)" 
            stroke={color} 
            strokeWidth="2.5"
        />
        <ellipse cx="32" cy="32" rx="22" ry="7" transform="rotate(-25 32 32)" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="4 2" />
        <ellipse cx="32" cy="32" rx="18" ry="5" transform="rotate(-25 32 32)" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
        <circle cx="32" cy="32" r="11" fill="url(#portal-grad)" stroke="#ffffff" strokeWidth="1" />
        <circle cx="32" cy="32" r="4" fill="#ffffff" />
    </svg>
);

const EliteMasterIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="elite-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="40%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
        </defs>
        <path 
            d="M32 4L56 22L46 48L32 59L18 48L8 22L32 4Z" 
            fill="url(#elite-grad)" 
            stroke={color} 
            strokeWidth="2.5"
        />
        <path 
            d="M32 9L50 24L42 44L32 53L22 44L14 24L32 9Z" 
            stroke="#ffffff" 
            strokeWidth="1.5" 
            strokeOpacity="0.4" 
            fill="none"
        />
        <path 
            d="M35 14L19 32H31L27 50L45 28H31L35 14Z" 
            fill="url(#bolt-grad)" 
        />
    </svg>
);

const GrandmasterIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="gm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fae8ff" />
                <stop offset="30%" stopColor="#db2777" />
                <stop offset="70%" stopColor="#c026d3" />
                <stop offset="100%" stopColor="#4a044e" />
            </linearGradient>
            <linearGradient id="crown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f0abfc" />
                <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
        </defs>
        <path 
            d="M32 4L54 10V26C54 41 45 53 32 59C19 53 10 41 10 26V10L32 4Z" 
            fill="url(#gm-grad)" 
            stroke={color} 
            strokeWidth="3"
        />
        <path d="M32 28L18 10M32 28L46 10M32 28L32 6M32 28L10 26M32 28L54 26" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
        <path 
            d="M16 42L22 24L32 34L42 24L48 42H16Z" 
            fill="url(#crown-grad)" 
        />
        <circle cx="22" cy="24" r="2.5" fill="#ffffff" />
        <circle cx="32" cy="34" r="2" fill="#ffffff" />
        <circle cx="42" cy="24" r="2.5" fill="#ffffff" />
        <circle cx="32" cy="42" r="3.5" fill="#db2777" />
    </svg>
);


// Custom Simple/Minimalist Rank Icons (SVGs)

const SimpleBronzeIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd2b3" />
                <stop offset="100%" stopColor="#cd7f32" />
            </linearGradient>
        </defs>
        <path d="M32 12L18 17V33C18 42.5 24 50 32 53C40 50 46 42.5 46 33V17L32 12Z" fill="url(#simple-bronze-grad)" fillOpacity="0.2" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M26 26L32 20L38 26M26 34L32 28L38 34" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SimpleSilverIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
        </defs>
        <path d="M32 12L18 17V33C18 42.5 24 50 32 53C40 50 46 42.5 46 33V17L32 12Z" fill="url(#simple-silver-grad)" fillOpacity="0.2" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 28L32 18L42 28M22 36L32 26L42 36" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SimpleGoldIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
        </defs>
        <path d="M32 12L18 17V33C18 42.5 24 50 32 53C40 50 46 42.5 46 33V17L32 12Z" fill="url(#simple-gold-grad)" fillOpacity="0.2" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 20L35 28H43L37 33L39 41L32 36L25 41L27 33L21 28H29L32 20Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
);

const SimplePlatinumIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-plat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
        </defs>
        <path d="M32 10L50 28L32 46L14 28L32 10Z" fill="url(#simple-plat-grad)" fillOpacity="0.2" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 20V36M24 28H40" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="32" cy="28" r="2" fill="#ffffff" />
    </svg>
);

const SimpleDiamondIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-dia-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
        </defs>
        <path d="M32 12L48 24L32 50L16 24L32 12Z" fill="url(#simple-dia-grad)" fillOpacity="0.2" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M16 24H48M24 18L32 24L40 18M24 18H40M24 18L32 12L40 18M16 24L32 50L48 24" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
);

const SimpleHeroicIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fee2e2" />
                <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
        </defs>
        <path d="M32 10L48 18V34C48 44.5 40 52 32 55C24 52 16 44.5 16 34V18L32 10Z" fill="url(#simple-hero-grad)" fillOpacity="0.2" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 18V38M25 24H39M28 32H36" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
);

const SimpleMasterIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-master-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3e8ff" />
                <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
        </defs>
        <path d="M32 10L48 19V38L32 47L16 38V19L32 10Z" fill="url(#simple-master-grad)" fillOpacity="0.2" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="32" cy="28.5" r="9.5" stroke={color} strokeWidth="3" />
        <circle cx="32" cy="28.5" r="4.5" fill={color} />
    </svg>
);

const SimpleEliteMasterIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-elite-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
        </defs>
        <path d="M32 12L46 17V33C46 42.5 40 50 32 53C24 50 18 42.5 18 33V17L32 12Z" fill="url(#simple-elite-grad)" fillOpacity="0.25" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M34 20L22 33H32L30 44L42 31H32L34 20Z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" />
    </svg>
);

const SimpleGrandmasterIcon: React.FC<{ color: string; className?: string }> = ({ color, className }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="simple-gm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fce7f3" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
        </defs>
        <path d="M32 10L48 16V32C48 42 40 50 32 53C24 50 16 42 16 32V16L32 10Z" fill="url(#simple-gm-grad)" fillOpacity="0.2" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 36L25 22L32 28L39 22L42 36H22Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="25" cy="21" r="1.5" fill="#ffffff" />
        <circle cx="32" cy="27" r="1" fill="#ffffff" />
        <circle cx="39" cy="21" r="1.5" fill="#ffffff" />
    </svg>
);

export const RankIconSVG: React.FC<{ rankName: string; color: string; className?: string; style?: BadgeStyle }> = ({ rankName, color, className, style }) => {
    const activeStyle = style || (typeof window !== 'undefined' ? localStorage.getItem('examcompass_badge_style') as BadgeStyle : 'professional') || 'professional';
    const name = rankName.toLowerCase();

    if (activeStyle === 'simple') {
        if (name.includes('grandmaster')) {
            return <SimpleGrandmasterIcon color={color} className={className} />;
        } else if (name.includes('elite master')) {
            return <SimpleEliteMasterIcon color={color} className={className} />;
        } else if (name.includes('master')) {
            return <SimpleMasterIcon color={color} className={className} />;
        } else if (name.includes('heroic')) {
            return <SimpleHeroicIcon color={color} className={className} />;
        } else if (name.includes('diamond')) {
            return <SimpleDiamondIcon color={color} className={className} />;
        } else if (name.includes('platinum')) {
            return <SimplePlatinumIcon color={color} className={className} />;
        } else if (name.includes('gold')) {
            return <SimpleGoldIcon color={color} className={className} />;
        } else if (name.includes('silver')) {
            return <SimpleSilverIcon color={color} className={className} />;
        } else {
            return <SimpleBronzeIcon color={color} className={className} />;
        }
    }

    if (name.includes('grandmaster')) {
        return <GrandmasterIcon color={color} className={className} />;
    } else if (name.includes('elite master')) {
        return <EliteMasterIcon color={color} className={className} />;
    } else if (name.includes('master')) {
        return <MasterIcon color={color} className={className} />;
    } else if (name.includes('heroic')) {
        return <HeroicIcon color={color} className={className} />;
    } else if (name.includes('diamond')) {
        return <DiamondIcon color={color} className={className} />;
    } else if (name.includes('platinum')) {
        return <PlatinumIcon color={color} className={className} />;
    } else if (name.includes('gold')) {
        return <GoldIcon color={color} className={className} />;
    } else if (name.includes('silver')) {
        return <SilverIcon color={color} className={className} />;
    } else {
        return <BronzeIcon color={color} className={className} />;
    }
};

interface RankBadgeProps {
    xp: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onClick?: (e?: React.MouseEvent) => void;
    style?: BadgeStyle;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ xp, showLabel = true, size = 'md', onClick, style }) => {
    const rank = getRankByValue(xp);
    const { badgeStyle: globalBadgeStyle } = useBadgeStyle();
    const activeStyle = style || globalBadgeStyle;
    const { tier } = usePerformance();

    const sizeClasses = {
        sm: 'w-10 h-10',
        md: 'w-14 h-14',
        lg: 'w-20 h-20'
    };

    const iconSizes = {
        sm: 'w-5 h-5',
        md: 'w-7 h-7',
        lg: 'w-11 h-11'
    };

    const isHighTier = rank.name.includes('Master') || rank.name.includes('Grandmaster') || rank.name.includes('Heroic') || rank.name.includes('Diamond');

    return (
        <div
            className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className="relative">
                {/* Rotating Outer Aura for High Tiers (Elite tier only to prevent lag on massive lists) */}
                {isHighTier && tier === 'elite' && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-2 rounded-full blur-md opacity-50"
                        style={{
                            background: `linear-gradient(to right, ${rank.color}, transparent, ${rank.color})`,
                        }}
                    />
                )}
                
                {/* Outer Glow Shield */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={onClick ? { scale: 1.08, y: -2 } : undefined}
                    whileTap={onClick ? { scale: 0.95 } : undefined}
                    className={`${sizeClasses[size]} rounded-[20px] flex items-center justify-center relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.7)]`}
                    style={{
                        background: `linear-gradient(135deg, ${rank.color}15 0%, ${rank.color}35 100%)`,
                        border: `1.5px solid ${rank.color}60`,
                        boxShadow: `inset 0 0 15px ${rank.color}25, 0 8px 24px -4px ${rank.color}40`
                    }}
                >
                    {/* SVG Geometric Frame overlay */}
                    <svg className="absolute inset-0 w-full h-full p-1 opacity-60 text-white pointer-events-none" viewBox="0 0 100 100" fill="none">
                        {/* Outer polygon framing */}
                        <polygon 
                            points="50,6 88,28 88,72 50,94 12,72 12,28" 
                            stroke={rank.color} 
                            strokeWidth="2.5" 
                            strokeDasharray="4 2"
                        />
                        {/* Inner accent ring */}
                        <polygon 
                            points="50,14 80,31 80,69 50,86 20,69 20,31" 
                            stroke={rank.color} 
                            strokeWidth="1" 
                            opacity="0.4"
                        />
                        {/* Corner details */}
                        <circle cx="50" cy="6" r="2.5" fill={rank.color} />
                        <circle cx="88" cy="28" r="2" fill={rank.color} />
                        <circle cx="88" cy="72" r="2" fill={rank.color} />
                        <circle cx="50" cy="94" r="2.5" fill={rank.color} />
                        <circle cx="12" cy="72" r="2" fill={rank.color} />
                        <circle cx="12" cy="28" r="2" fill={rank.color} />
                    </svg>

                    {/* Ethereal light sweep */}
                    <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" 
                        style={{ transform: 'skewX(-20deg)', width: '200%' }}
                    />

                    {/* Badge Icon */}
                    <span className="relative z-10 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] select-none transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                        <RankIconSVG rankName={rank.name} color={rank.color} className={iconSizes[size]} style={activeStyle} />
                    </span>
                </motion.div>
            </div>

            {showLabel && (
                <motion.span
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-[9px] font-black uppercase tracking-[0.2em] mt-1 text-center"
                    style={{
                        color: rank.color,
                        textShadow: `0 0 12px ${rank.color}50`
                    }}
                >
                    {rank.name}
                </motion.span>
            )}
        </div>
    );
};

import { useEffect, useState } from 'react';
import { Palette, Moon, Zap } from 'lucide-react';

type Theme = 'glass' | 'zen' | 'gamified';

interface ThemeSwitcherProps {
    className?: string;
}

export const ThemeSwitcher = ({ className }: ThemeSwitcherProps) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            // First check localStorage, then fall back to data-theme attribute
            const savedTheme = localStorage.getItem('theme') as Theme;
            if (savedTheme) return savedTheme;
            return (document.documentElement.getAttribute('data-theme') as Theme) || 'glass';
        }
        return 'glass';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'glass') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', theme);
        }
        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <div className={`flex items-center gap-2 p-2 bg-surface backdrop-blur-md rounded-full border border-border z-50 ${className || 'fixed top-6 right-6'}`}>
            <button
                onClick={() => setTheme('glass')}
                className={`p-2 rounded-full transition-colors ${theme === 'glass' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                title="Glassmorphism Future"
            >
                <Palette size={20} />
            </button>
            <button
                onClick={() => setTheme('zen')}
                className={`p-2 rounded-full transition-colors ${theme === 'zen' ? 'bg-primary text-black' : 'text-text-muted hover:text-text-main'}`}
                title="Zen Minimalist"
            >
                <Moon size={20} />
            </button>
            <button
                onClick={() => setTheme('gamified')}
                className={`p-2 rounded-full transition-colors ${theme === 'gamified' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
                title="Gamified Progress"
            >
                <Zap size={20} />
            </button>
        </div>
    );
};

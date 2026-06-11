import { create } from 'zustand';

type Theme = 'neon' | 'nordic';

interface ThemeState {
    theme: Theme;
    isSidebarCollapsed: boolean;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    theme: 'neon',
    isSidebarCollapsed: localStorage.getItem('mw_sidebar_collapsed') === 'true',
    setTheme: (_theme) => set({ theme: 'neon' }), // Lock to neon
    toggleTheme: () => { }, // Disable toggle
    toggleSidebar: () => set((state) => {
        const next = !state.isSidebarCollapsed;
        localStorage.setItem('mw_sidebar_collapsed', String(next));
        return { isSidebarCollapsed: next };
    }),
    setSidebarCollapsed: (collapsed: boolean) => {
        localStorage.setItem('mw_sidebar_collapsed', String(collapsed));
        set({ isSidebarCollapsed: collapsed });
    }
}));

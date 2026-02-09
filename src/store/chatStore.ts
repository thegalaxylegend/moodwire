import { create } from 'zustand';

interface ChatState {
    isOpen: boolean;
    initialMessage: string | null;
    openChat: (message?: string) => void;
    closeChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    initialMessage: null,
    openChat: (message) => set({ isOpen: true, initialMessage: message || null }),
    closeChat: () => set({ isOpen: false, initialMessage: null }),
}));

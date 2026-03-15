import { create } from 'zustand';

export interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    link?: string;
    linkText?: string;
    image?: string;
    isStreaming?: boolean;
}

interface ChatState {
    isOpen: boolean;
    initialMessage: string | null;
    messages: Message[];
    isThinking: boolean;
    isSearching: boolean;
    streamingText: string;
    openChat: (message?: string) => void;
    closeChat: () => void;
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    addMessage: (message: Message) => void;
    setIsThinking: (isThinking: boolean) => void;
    setIsSearching: (isSearching: boolean) => void;
    setStreamingText: (text: string) => void;
    clearHistory: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    initialMessage: null,
    messages: JSON.parse(localStorage.getItem('chat_history') || '[]'),
    isThinking: false,
    isSearching: false,
    streamingText: '',
    
    openChat: (message) => set({ isOpen: true, initialMessage: message || null }),
    closeChat: () => set({ isOpen: false, initialMessage: null }),
    
    setMessages: (updater) => set((state) => {
        const newMessages = typeof updater === 'function' ? updater(state.messages) : updater;
        return { messages: newMessages };
    }),
    
    addMessage: (message) => set((state) => {
        const newMessages = [...state.messages, message].slice(-50);
        return { messages: newMessages };
    }),
    
    setIsThinking: (isThinking) => set({ isThinking }),
    setIsSearching: (isSearching) => set({ isSearching }),
    setStreamingText: (streamingText) => set({ streamingText }),
    clearHistory: () => {
        localStorage.removeItem('chat_history');
        set({ messages: [] });
    }
}));

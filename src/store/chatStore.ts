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

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

interface ChatState {
    isOpen: boolean;
    initialMessage: string | null;
    sessions: ChatSession[];
    currentSessionId: string;
    messages: Message[]; // SYNCED with current session
    isThinking: boolean;
    isSearching: boolean;
    streamingText: string;
    
    // Actions
    openChat: (message?: string) => void;
    closeChat: () => void;
    
    // Session Actions
    createSession: (firstMessage?: string) => string;
    switchSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    
    // Message Actions (applied to active session)
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    addMessage: (message: Message) => void;
    
    // UI State Actions
    setIsThinking: (isThinking: boolean) => void;
    setIsSearching: (isSearching: boolean) => void;
    setStreamingText: (text: string) => void;
    clearHistory: () => void;
}

const STORAGE_KEY = 'exa_chat_sessions';
const LEGACY_KEY = 'chat_history';

// Helper to load/migrate sessions
const loadStoredSessions = (): ChatSession[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse chat sessions", e);
        }
    }
    
    // Migration: Check for legacy single-chat history
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
        try {
            const messages = JSON.parse(legacy);
            if (Array.isArray(messages) && messages.length > 0) {
                const legacySession: ChatSession = {
                    id: 'legacy-' + Date.now(),
                    title: 'Previous Discovery',
                    messages: messages,
                    timestamp: Date.now()
                };
                localStorage.removeItem(LEGACY_KEY);
                const results = [legacySession];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
                return results;
            }
        } catch (e) {}
    }
    
    return [];
};

const initialSessions = loadStoredSessions();
const initialActiveId = initialSessions[0]?.id || 'new';
const initialMessages = initialSessions.find(s => s.id === initialActiveId)?.messages || [];

export const useChatStore = create<ChatState>((set) => ({
    isOpen: false,
    initialMessage: null,
    sessions: initialSessions,
    currentSessionId: initialActiveId,
    messages: initialMessages,
    isThinking: false,
    isSearching: false,
    streamingText: '',
    
    openChat: (message) => set({ isOpen: true, initialMessage: message || null }),
    closeChat: () => set({ isOpen: false, initialMessage: null }),
    
    createSession: (firstMessage) => {
        const id = 'session-' + Date.now();
        const newSession: ChatSession = {
            id,
            title: firstMessage ? firstMessage.slice(0, 30) + '...' : 'New Discovery',
            messages: [],
            timestamp: Date.now()
        };
        
        set((state) => {
            const nextSessions = [newSession, ...state.sessions];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
            return { sessions: nextSessions, currentSessionId: id, messages: [] };
        });
        return id;
    },
    
    switchSession: (sessionId) => {
        set((state) => {
            const session = state.sessions.find(s => s.id === sessionId);
            return { 
                currentSessionId: sessionId, 
                messages: session ? session.messages : [] 
            };
        });
    },
    
    deleteSession: (sessionId) => {
        set((state) => {
            const nextSessions = state.sessions.filter(s => s.id !== sessionId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
            
            let nextActiveId = state.currentSessionId;
            let nextMessages = state.messages;
            
            if (state.currentSessionId === sessionId) {
                const head = nextSessions[0];
                nextActiveId = head?.id || 'new';
                nextMessages = head?.messages || [];
            }
            
            return { sessions: nextSessions, currentSessionId: nextActiveId, messages: nextMessages };
        });
    },
    
    setMessages: (updater) => set((state) => {
        const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
        if (!currentSession) return state; 
        
        const prevMessages = currentSession.messages;
        const newMessages = typeof updater === 'function' ? updater(prevMessages) : updater;
        
        const nextSessions = state.sessions.map(s => 
            s.id === state.currentSessionId ? { ...s, messages: newMessages } : s
        );
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
        return { sessions: nextSessions, messages: newMessages };
    }),
    
    addMessage: (message) => set((state) => {
        let activeId = state.currentSessionId;
        let nextSessions = [...state.sessions];
        let nextMessages = [...state.messages];
        
        if (activeId === 'new' || !state.sessions.find(s => s.id === activeId)) {
            activeId = 'session-' + Date.now();
            const newSession: ChatSession = {
                id: activeId,
                title: message.text.slice(0, 30) + '...',
                messages: [message],
                timestamp: Date.now()
            };
            nextSessions = [newSession, ...state.sessions];
            nextMessages = [message];
        } else {
            nextSessions = state.sessions.map(s => {
                if (s.id === activeId) {
                    const updatedMessages = [...s.messages, message].slice(-100);
                    const nextTitle = (s.title === 'New Discovery' || s.title === 'Previous Discovery') ? message.text.slice(0, 30) + '...' : s.title;
                    nextMessages = updatedMessages;
                    return { ...s, messages: updatedMessages, title: nextTitle };
                }
                return s;
            });
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
        return { sessions: nextSessions, currentSessionId: activeId, messages: nextMessages };
    }),
    
    setIsThinking: (isThinking) => set({ isThinking }),
    setIsSearching: (isSearching) => set({ isSearching }),
    setStreamingText: (streamingText) => set({ streamingText }),
    
    clearHistory: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ sessions: [], currentSessionId: 'new', messages: [] });
    }
}));

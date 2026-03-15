import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { X, Settings, Bot, Phone, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatWindowProps {
    messages: any[];
    isThinking: boolean;
    isSearching?: boolean;
    onClose: () => void;
    onToggleSettings: () => void;
    isCallMode: boolean;
    setIsCallMode: (val: boolean) => void;
    isMuted: boolean;
    setIsMuted: (val: boolean) => void;
    children?: React.ReactNode;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    isThinking,
    isSearching,
    onClose,
    onToggleSettings,
    isCallMode,
    setIsCallMode,
    isMuted,
    setIsMuted,
    children
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasInitialScrolled = useRef(false);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        const isStreaming = lastMessage?.sender === 'bot' && lastMessage?.isStreaming;
        
        // First render: jump instantly so the user doesn't see a visible scroll
        if (!hasInitialScrolled.current) {
            hasInitialScrolled.current = true;
            scrollToBottom("auto");
            return;
        }

        scrollToBottom(isStreaming || isThinking ? "auto" : "smooth");
    }, [messages, isThinking]);

    return (
        <div className={`flex flex-col h-full bg-gray-950/80 backdrop-blur-xl border border-white/10 
            rounded-3xl overflow-hidden shadow-2xl transition-all
            ${isCallMode ? 'ring-2 ring-purple-500/50 shadow-purple-900/20' : ''}`}>
            
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg overflow-hidden">
                            <Bot size={22} />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950 shadow-sm animate-pulse"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white leading-tight">Exa</h3>
                            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-black rounded uppercase tracking-tighter border border-indigo-500/10">AI</span>
                        </div>
                        <p className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Active Mentor 3.1</p>
                    </div>
                </div>

                <div className="flex items-center gap-0.5">
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsCallMode(!isCallMode)}
                        className={`p-2 rounded-xl transition-all ${isCallMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                        title={isCallMode ? "End Call" : "Voice Call"}
                    >
                        <Phone size={18} className={isCallMode ? 'fill-current' : ''} />
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-2 rounded-xl transition-all ${isMuted ? 'text-red-400 bg-red-500/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        <Volume2 size={18} className={isMuted ? 'opacity-50' : ''} />
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onToggleSettings}
                        className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        title="Voice Settings"
                    >
                        <Settings size={18} />
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        title="Close Chat"
                    >
                        <X size={18} />
                    </motion.button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 relative overflow-hidden">
                <div className={`h-full overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}>
                    {messages.map((m) => (
                        <MessageBubble key={m.id} message={m} />
                    ))}

                    {isSearching && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-pulse">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <span className="text-xs font-medium text-blue-300 uppercase tracking-widest flex items-center gap-2">
                             Exa is searching the web...
                        </span>
                    </div>
                )}
                
                {isThinking && (
                    <div className="flex w-full justify-start mb-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex items-end gap-3 max-w-[80%] flex-row">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg relative overflow-hidden group">
                                <Bot size={15} className="text-white relative z-10" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 animate-pulse" />
                            </div>
                            <div className="bg-[#1a1c23] border border-white/5 px-5 py-3 rounded-2xl rounded-bl-sm shadow-xl flex items-center gap-2">
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-500/30 rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] ml-2">Exa is thinking</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            </div>

            {/* Input Area (NOW INSIDE THE OVERLAY) */}
            <div className="p-4 bg-white/5 border-t border-white/10">
                {children}
            </div>
        </div>
    );
};

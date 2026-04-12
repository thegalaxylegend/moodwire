import React, { useRef, useEffect, useState } from 'react';
import { X, Bot, Phone, Volume2, Trash2, Zap, LayoutDashboard, Clock, Target, Menu, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickReplies } from './QuickReplies';
import { MessageBubble } from './MessageBubble';
import { usePerformanceLevel } from '../../hooks/usePerformanceLevel';
import { ttsManager } from '../../lib/tts/TTSManager';

interface VoicePreset {
    id: string;
    name: string;
    gender: 'female' | 'male';
    isNeural?: boolean;
}

interface ChatWindowProps {
    messages: any[];
    isThinking: boolean;
    isTTSLoading?: boolean;
    isSearching?: boolean;
    suggestions?: string[];
    onSelectSuggestion?: (text: string) => void;
    onClearHistory?: () => void;
    onClose: () => void;
    onToggleSettings: () => void;
    isCallMode: boolean;
    setIsCallMode: (val: boolean) => void;
    isMuted: boolean;
    setIsMuted: (val: boolean) => void;
    
    // Voice Props
    voicePresets?: VoicePreset[];
    selectedPresetId?: string;
    onSelectPreset?: (id: string) => void;
    
    // Session Props
    sessions?: any[];
    currentSessionId?: string;
    onSwitchSession?: (id: string) => void;
    onDeleteSession?: (id: string) => void;
    onCreateSession?: () => void;
    
    // Language Props
    selectedLanguage?: 'en' | 'hi' | 'hinglish';
    onSelectLanguage?: (lang: 'en' | 'hi' | 'hinglish') => void;
    
    children?: React.ReactNode;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    isThinking,
    isSearching,
    isTTSLoading,
    suggestions = [],
    onSelectSuggestion = () => {},
    onClearHistory = () => {},
    onClose,
    isCallMode,
    setIsCallMode,
    isMuted,
    setIsMuted,
    
    voicePresets = [],
    selectedPresetId,
    onSelectPreset = () => {},
    
    sessions = [],
    currentSessionId,
    onSwitchSession = () => {},
    onDeleteSession = () => {},
    onCreateSession = () => {},
    
    selectedLanguage = 'en',
    onSelectLanguage,
    
    children
}) => {
    const perfTier = usePerformanceLevel();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasInitialScrolled = useRef(false);
    const [isToolboxOpen, setIsToolboxOpen] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);

    const handleSpeak = async (id: string, text: string) => {
        if (speakingId === id) {
            ttsManager.stop();
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            return;
        }

        setSpeakingId(id);
        
        try {
            // Attempt neural TTS
            await ttsManager.speak(text);
            setSpeakingId(null);
        } catch (error) {
            console.warn('[ChatWindow] Neural TTS failed, fallback to native:', error);
            
            // Native Fallback
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setSpeakingId(null);
            utterance.onerror = () => setSpeakingId(null);
            window.speechSynthesis.speak(utterance);
        }
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        // If within 50px of bottom, consider it "at bottom"
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsAtBottom(atBottom);
    };

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        const isStreaming = lastMessage?.sender === 'bot' && lastMessage?.isStreaming;
        
        if (!hasInitialScrolled.current) {
            hasInitialScrolled.current = true;
            scrollToBottom("auto");
            return;
        }
        
        if (isAtBottom || isStreaming || isThinking) {
            scrollToBottom(isStreaming || isThinking ? "auto" : "smooth");
        }
    }, [messages, isThinking]);

    return (
        <div className={`flex flex-col h-full bg-[#11131c]/90 border border-white/5 
            rounded-3xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] transition-[border-color,box-shadow,transform] duration-500 font-manrope gpu-layer
            ${perfTier === 'elite' ? 'backdrop-blur-2xl' : perfTier === 'balanced' ? 'backdrop-blur-lg' : 'backdrop-blur-none'}
            ${isCallMode ? 'ring-2 ring-[#5d21df]/50 shadow-[#5d21df]/20' : ''}`}>
            
            {/* Main Area: Split Layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                
                {/* Left Pane: Mentor Toolbox */}
                <div 
                    data-lenis-prevent
                    className={`
                    absolute inset-y-0 left-0 z-[60] w-full lg:flex-[0.7] h-full lg:relative lg:block transition-transform duration-500 ease-out
                    bg-[#1d1f29] lg:bg-[#11131c]/50 border-r border-white/5 overflow-y-auto overflow-x-hidden scroll-safe-layer
                    ${perfTier === 'elite' ? 'lg:backdrop-blur-xl' : 'lg:backdrop-blur-none'}
                    ${isToolboxOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-8 space-y-10 lg:space-y-12">
                        
                        {/* Bot Identity & Branding */}
                        <div className="flex items-center gap-4 py-2 mb-4 gpu-accelerate">
                            <div className="relative group shrink-0">
                                <div className="w-14 h-14 rounded-[24px] bg-gradient-to-br from-[#5d21df] to-[#153ae4] flex items-center justify-center text-white shadow-[0_12px_24px_rgba(93,33,223,0.3)] overflow-hidden transition-transform group-hover:scale-105 transform-gpu">
                                    <Bot size={28} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#81ecff] rounded-full border-[3px] border-[#11131c] shadow-[0_0_10px_#81ecff] animate-pulse"></div>
                            </div>
                            <div>
                                <div className="flex flex-col">
                                    <h3 className="font-newsreader italic text-3xl text-white leading-none tracking-tight">Exa AI</h3>
                                    <div className="mt-2 text-white/40">
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Mental Nexus v4.0</span>
                                    </div>
                                    <div className="mt-1 flex gap-2">
                                        <div className="px-2 py-0.5 bg-[#cdbdff]/10 border border-[#cdbdff]/20 rounded-md">
                                            <span className="text-[8px] font-black text-[#cdbdff] uppercase tracking-widest">Digital Curator</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Toolbox Header (Mobile only toggle) */}
                        <div className="lg:hidden flex items-center justify-between mb-8">
                            <h4 className="font-newsreader italic text-2xl text-white">Navigation</h4>
                            <button onClick={() => setIsToolboxOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors"><X size={24} /></button>
                        </div>

                        {/* Feature: New Chat & Actions */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#cdbdff]/10 rounded-lg text-[#cdbdff]">
                                    <LayoutDashboard size={18} />
                                </div>
                                <h4 className="text-xs font-black text-white/50 uppercase tracking-[4px]">Session Control</h4>
                            </div>
                            
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(93, 33, 223, 0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onCreateSession}
                                className="w-full py-5 rounded-[24px] border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-950/20 group hover:bg-indigo-500/10"
                            >
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Zap size={16} className="fill-indigo-400" />
                                </div>
                                <span className="font-black text-sm uppercase tracking-widest">New Discovery</span>
                            </motion.button>
                        </section>

                        {/* Feature: Discovery History */}
                        <section className="flex-1 min-h-0 flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#81ecff]/10 rounded-lg text-[#81ecff]">
                                    <Clock size={18} />
                                </div>
                                <h4 className="text-xs font-black text-white/50 uppercase tracking-[4px]">Discovery History</h4>
                            </div>
                            
                            <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar max-h-[250px]">
                                {sessions.length === 0 ? (
                                    <div className="p-6 rounded-[24px] border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-4">
                                            <Bookmark size={18} />
                                        </div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-white/20">No history yet</p>
                                    </div>
                                ) : (
                                    sessions.map(session => (
                                        <div key={session.id} className="group relative">
                                            <button
                                                onClick={() => onSwitchSession(session.id)}
                                                className={`w-full p-4 rounded-[22px] text-left transition-all border flex flex-col gap-1 relative overflow-hidden backdrop-blur-sm
                                                    ${currentSessionId === session.id 
                                                        ? 'bg-white/[0.08] border-indigo-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)] ring-1 ring-white/10' 
                                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 text-white/60'}`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-[11px] font-bold truncate pr-6 ${currentSessionId === session.id ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>
                                                        {session.title}
                                                    </span>
                                                    {currentSessionId === session.id && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                                                    )}
                                                </div>
                                                <span className="text-[9px] uppercase font-black text-white/10 tracking-widest">
                                                    {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                
                                                {currentSessionId === session.id && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                                )}
                                            </button>
                                            
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteSession(session.id);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/0 group-hover:text-red-400/60 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Voice Controls (Moved from header) */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#81ecff]/10 rounded-lg text-[#81ecff]">
                                    <Phone size={18} />
                                </div>
                                <h4 className="text-xs font-black text-white/50 uppercase tracking-[4px]">Neural Communication</h4>
                            </div>
                            
                            <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-[22px] border border-white/5 mb-6">
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsCallMode(!isCallMode)}
                                    className={`flex-1 py-3 rounded-[16px] transition-all flex items-center justify-center gap-3 ${isCallMode ? 'text-[#81ecff] bg-[#81ecff]/10 shadow-[0_0_15px_rgba(129,236,255,0.2)]' : 'text-white/40 hover:text-white bg-white/5'}`}
                                >
                                    <Phone size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isCallMode ? 'ACTIVE' : 'START CALL'}</span>
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsMuted(!isMuted)}
                                    className={`p-3 rounded-[16px] transition-all ${isMuted ? 'text-red-400 bg-red-500/10' : 'text-white/40 hover:text-white bg-white/5'}`}
                                >
                                    <Volume2 size={16} />
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 auto-rows-fr">
                                {voicePresets.map(preset => (
                                    <button 
                                        key={preset.id}
                                        onClick={() => onSelectPreset(preset.id)}
                                        className={`px-4 py-3 rounded-[22px] text-[10px] font-black transition-all border flex flex-col gap-1 items-start relative overflow-hidden group/voice h-full ${
                                            selectedPresetId === preset.id 
                                            ? 'bg-gradient-to-br from-[#5d21df] to-[#153ae4] text-white border-transparent shadow-[0_15px_30px_rgba(93,33,223,0.4)]' 
                                            : 'bg-white/[0.03] text-white/40 border-white/5 hover:bg-white/[0.08] hover:text-white/70'
                                        }`}
                                    >
                                        <span className="relative z-10">{preset.name.replace('Exa ', '')}</span>
                                        <span className="text-[8px] uppercase opacity-40 font-bold relative z-10 leading-none">{preset.gender}</span>
                                        {selectedPresetId === preset.id && (
                                            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Language Control */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#cdbdff]/10 rounded-lg text-[#cdbdff]">
                                    <Bot size={18} />
                                </div>
                                <h4 className="text-xs font-black text-white/50 uppercase tracking-[4px]">Mentor Language</h4>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'en', label: 'English', icon: '🇬🇧' },
                                    { id: 'hi', label: 'Hindi', icon: '🇮🇳' },
                                    { id: 'hinglish', label: 'Hinglish', icon: '💬' }
                                ].map(lang => (
                                    <button 
                                        key={lang.id}
                                        onClick={() => onSelectLanguage?.(lang.id as any)}
                                        className={`flex flex-col items-center gap-2 py-4 rounded-[22px] border transition-all relative overflow-hidden ${
                                            selectedLanguage === lang.id
                                            ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <span className={`text-xl transition-transform duration-500 ${selectedLanguage === lang.id ? 'scale-110' : 'opacity-60'}`}>{lang.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{lang.label}</span>
                                        
                                        {selectedLanguage === lang.id && (
                                            <motion.div 
                                                layoutId="lang-pulse"
                                                className="absolute inset-0 bg-indigo-500/5 animate-pulse" 
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Biometrics */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#cdbdff]/10 rounded-lg text-[#cdbdff]">
                                    <Target size={18} />
                                </div>
                                <h4 className="text-xs font-black text-white/50 uppercase tracking-[4px]">Biometric Analysis</h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[28px] group hover:bg-white/[0.05] transition-colors shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                                                <Clock size={20} />
                                            </div>
                                            <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Focus Orbit</span>
                                        </div>
                                        <span className="text-2xl font-newsreader italic text-white tabular-nums tracking-tighter">42:15</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                             <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                                    <Trash2 size={18} />
                                </div>
                                <h4 className="text-xs font-black text-white/50 uppercase tracking-[4px]">Maintenance</h4>
                            </div>
                            
                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClearHistory}
                                className="w-full py-4 rounded-[22px] border border-red-500/10 bg-red-500/5 text-red-500/40 hover:text-red-400 flex items-center justify-center gap-3 transition-all"
                            >
                                <span className="font-bold text-[10px] uppercase tracking-widest">Nuclear Reset</span>
                            </motion.button>
                        </section>
                    </div>
                </div>

                {/* Right Pane: Chat Experience (Swapped from left) */}
                <div className="lg:flex-[2.3] min-w-0 flex flex-col h-full relative overflow-hidden bg-gradient-to-b from-transparent to-white/[0.01]">
                    
                    {/* Floating Controls Overlay - Responsive Positioning */}
                    <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[70] flex items-center gap-2 md:gap-3">
                        <button 
                            onClick={() => setIsToolboxOpen(!isToolboxOpen)}
                            className="lg:hidden p-3 bg-[#1d1f29]/80 backdrop-blur-xl rounded-xl border border-white/10 text-white/60 hover:text-white transition-all shadow-2xl active:scale-95"
                        >
                            <Menu size={20} />
                        </button>
                        <motion.button 
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="p-3 bg-[#1d1f29]/80 backdrop-blur-xl rounded-xl border border-white/10 text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all shadow-2xl group active:scale-95"
                        >
                            <X size={20} />
                        </motion.button>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <div 
                            data-lenis-prevent
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className={`h-full overflow-y-auto px-2 md:px-8 pt-24 pb-12 md:pt-20 space-y-6 scrollbar-none gpu-layer will-change-transform`}
                        >
                            <div className="max-w-full md:max-w-5xl mx-auto w-full pb-32">
                                {messages.map((m) => (
                                    <MessageBubble 
                                        key={m.id} 
                                        message={m} 
                                        onSpeak={handleSpeak}
                                        speakingId={speakingId}
                                    />
                                ))}

                                {isSearching && (
                                    <div className={`flex items-center gap-4 px-6 py-4 bg-[#81ecff]/5 border border-[#81ecff]/10 rounded-3xl backdrop-blur-sm ${perfTier !== 'low' ? 'animate-pulse' : ''}`}>
                                        <div className={`w-3 h-3 bg-[#81ecff] rounded-full ${perfTier !== 'low' ? 'animate-ping' : ''}`}></div>
                                        <span className="text-xs font-black text-[#81ecff] uppercase tracking-[3px]">Mapping Knowledge...</span>
                                    </div>
                                )}
                                
                                 {(isThinking || isTTSLoading) && (
                                    <div className={`flex w-full justify-start mb-6 ${perfTier !== 'low' ? 'animate-in fade-in slide-in-from-left-2 duration-500' : ''}`}>
                                        <div className="flex items-end gap-4 max-w-[80%]">
                                            <div className={`w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20 ${perfTier !== 'low' ? 'animate-pulse' : ''}`}>
                                                <Zap size={14} className="text-indigo-400" />
                                            </div>
                                            <div className="bg-[#32343e]/40 border border-white/10 px-6 py-4 rounded-[32px] rounded-bl-sm backdrop-blur-md">
                                                <div className="flex gap-2 items-center">
                                                    <div className="flex gap-1">
                                                        <div className="w-1.5 h-1.5 bg-[#81ecff] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                        <div className="w-1.5 h-1.5 bg-[#81ecff]/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                        <div className="w-1.5 h-1.5 bg-[#81ecff]/30 rounded-full animate-bounce"></div>
                                                    </div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-3">
                                                        {isTTSLoading ? 'Neural Voice Syncing...' : 'Neural Synthesis'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    </div>

                    {/* Right Pane Footer: Floating Input Unit */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pt-10 bg-gradient-to-t from-[#11131c] via-[#11131c]/95 to-transparent pointer-events-none z-40">
                        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                            <AnimatePresence>
                                {suggestions.length > 0 && !isThinking && isAtBottom && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="mb-4"
                                    >
                                        <QuickReplies 
                                            suggestions={suggestions} 
                                            onSelect={onSelectSuggestion} 
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {/* The Input Unit */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#5d21df] to-[#153ae4] rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <div className="relative">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

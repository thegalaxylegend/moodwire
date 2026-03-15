import { useState, useRef, useEffect } from 'react';
import { MinimizedBubble } from './MinimizedBubble';
import { askAI } from '../lib/ai';
import { useChatStore } from '../store/chatStore';
import type { Message } from '../store/chatStore';
import { useUserStore } from '../store/userStore';
import { extractAndSaveMemory } from '../lib/memoryExtractor';
import { ChatWindow } from './Chat/ChatWindow';
import { InputBar } from './Chat/InputBar';
import { X } from 'lucide-react';
import { CallOverlay } from './Chat/CallOverlay';
import { AnimatePresence, motion } from 'framer-motion';

// Emotion Definitions
type ExaEmotion = 'neutral' | 'listening' | 'thinking' | 'speaking' | 'excited' | 'shy';

// Voice Preset Definition
interface VoicePreset {
    id: string;
    name: string;
    gender: 'female' | 'male';
    pitch: number;
    rate: number;
}

const DYNAMIC_GREETINGS = [
    "Oh, you're back? ✨",
    "Hey. Study time again? 📚",
    "Finally! I missed you. ✨",
    "Ready to ace that exam? 🌸"
];

const VOICE_PRESETS: VoicePreset[] = [
    { id: 'girl_sweet', name: 'Exa (Sweet)', gender: 'female', pitch: 1.15, rate: 1.05 },
    { id: 'girl_calm', name: 'Exa (Calm)', gender: 'female', pitch: 1.0, rate: 0.95 },
    { id: 'girl_playful', name: 'Exa (Playful)', gender: 'female', pitch: 1.1, rate: 1.1 },
    { id: 'boy_chill', name: 'Exa (Chill)', gender: 'male', pitch: 1.0, rate: 0.95 },
    { id: 'boy_deep', name: 'Exa (Deep)', gender: 'male', pitch: 0.9, rate: 0.9 },
    { id: 'boy_brisk', name: 'Exa (Brisk)', gender: 'male', pitch: 1.0, rate: 1.1 },
];

export const Chatbot = () => {
    const { 
        isOpen, openChat, closeChat, initialMessage, 
        messages, setMessages, isThinking, setIsThinking,
        isSearching, setIsSearching, addMessage
    } = useChatStore();
    
    const { user } = useUserStore();

    const [input, setInput] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCallMode, setIsCallMode] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [, ] = useState<ExaEmotion>('neutral');
    const [showSettings, setShowSettings] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [selectedPresetId, setSelectedPresetId] = useState<string>(() => localStorage.getItem('exa_voice_id') || localStorage.getItem('exa_voice_preset_id') || "girl_sweet");

    const recognitionRef = useRef<any>(null);
    const pttTimerRef = useRef<any>(null);
    const streamingTextRef = useRef("");
    const lastUpdateRef = useRef(0);
    const spokenUpToRef = useRef(0); // tracks how many chars have been sent to TTS
    const settingsPanelRef = useRef<HTMLDivElement | null>(null);

    // Pre-warm voices on mount so first speak() is instant
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const load = () => window.speechSynthesis.getVoices();
            load();
            window.speechSynthesis.addEventListener('voiceschanged', load);
            return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
        }
    }, [])

    // Persistent History - Optimized to avoid stringifying during rapid updates
    useEffect(() => {
        const isStreaming = messages.some(m => m.isStreaming);
        if (!isThinking && !isStreaming) {
            localStorage.setItem('chat_history', JSON.stringify(messages));
        }
    }, [messages, isThinking]);

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            const greeting = DYNAMIC_GREETINGS[Math.floor(Math.random() * DYNAMIC_GREETINGS.length)];
            addMessage({ id: Date.now(), text: greeting, sender: 'bot' });
        }
    }, [messages.length, addMessage]);

    // Handle Call Mode Voice/STT sync
    useEffect(() => {
        if (isCallMode) {
            // In call mode, try to start listening after a small delay to avoid feedback
            if (!isSpeaking) {
                const timer = setTimeout(() => {
                    startListening();
                }, 1000);
                return () => clearTimeout(timer);
            }
        } else {
            // Stop listening when call mode is off
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    }, [isCallMode, isSpeaking]);

    // Handle initial message from store
    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage);
        }
    }, [initialMessage]);

    // Close voice settings when user clicks anywhere outside the panel.
    useEffect(() => {
        if (!showSettings) return;

        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node | null;
            if (settingsPanelRef.current && target && !settingsPanelRef.current.contains(target)) {
                setShowSettings(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [showSettings]);

    const handleClose = () => {
        if (isCallMode) {
            setIsMinimized(true);
            return;
        }
        window.speechSynthesis.cancel();
        closeChat();
        setIsMinimized(false);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === 'application/pdf') {
            const { extractTextFromPDF } = await import('../lib/pdfHelper');
            setIsThinking(true);
            try {
                const text = await extractTextFromPDF(file);
                setInput(prev => prev + "\n[PDF CONTENT]: " + text.slice(0, 5000));
            } catch (err) {
                console.error("PDF Extraction failed:", err);
            } finally {
                setIsThinking(false);
            }
        } else if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const speak = (text: string, cancelPending = false) => {
        if (!window.speechSynthesis) return;
        let cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
        // Strip LaTeX/math notation: $$...$$ and $...$
        cleanText = cleanText.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$]*?\$/g, '').replace(/\\(text|frac|sqrt|left|right|times|cdot|geq|leq|neq|approx|infty|sum|int|prod|lim|rightarrow|leftarrow|Rightarrow|AA)\b\{?[^}]*\}?/g, '');
        // Strip markdown formatting: bold (**), italic (*), headers (#), links, code blocks
        cleanText = cleanText.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1').replace(/_{1,3}(.*?)_{1,3}/g, '$1').replace(/`{1,3}[^`]*`{1,3}/g, '').replace(/^#{1,6}\s+/gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/^[-*+]\s+/gm, '').replace(/^\d+\.\s+/gm, '').replace(/^>\s+/gm, '').replace(/\|/g, '').replace(/---+/g, '').trim();

        if (isMuted || !cleanText) return;

        // Voices are pre-warmed on mount; fallback listener just in case
        if (window.speechSynthesis.getVoices().length === 0) {
            const handleVoicesChanged = () => {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
                speak(text, cancelPending);
            };
            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const preset = VOICE_PRESETS.find(p => p.id === selectedPresetId) || VOICE_PRESETS[0];

        // Find best system voice matching gender
        let systemVoice: SpeechSynthesisVoice | undefined;
        const findByName = (keywords: string[]) => voices.find(v => keywords.some(k => v.name.includes(k)));

        if (preset.gender === 'female') {
            systemVoice = findByName(['Google US English', 'Samantha', 'Zira', 'Microsoft Zira', 'Google UK English Female', 'En-US-Female', 'Female', 'female'])
                || voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'))
                || voices[0];
        } else {
            systemVoice = findByName(['Google UK English Male', 'Daniel', 'Google US English Male', 'David', 'Microsoft David', 'En-US-Male', 'Male', 'male'])
                || voices.find(v => v.lang.startsWith('en'))
                || voices[0];
        }

        if (systemVoice) utterance.voice = systemVoice;
        utterance.pitch = preset.pitch;
        utterance.rate = preset.rate;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("SpeechSynthesis error:", e);
            setIsSpeaking(false);
            if (e.error === 'interrupted') return;
            window.speechSynthesis.cancel();
        };

        // Only cancel if explicitly requested (e.g. user sends new message)
        // During streaming we queue sentences so we must NOT cancel here
        if (cancelPending) window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() && !selectedImage) return;

        const userText = input;
        const userImg = selectedImage;
        const userMsg: Message = { id: Date.now(), text: userText, sender: 'user', image: userImg || undefined };
        
        addMessage(userMsg);
        setInput("");
        setSelectedImage(null);
        
        // Interrupt any ongoing speech when a new message is sent
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        setIsThinking(true);

        try {
            const history = messages.slice(-10).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            })) as any;

            const response = await askAI(
                "Chat context",
                userText,
                'groq',
                history,
                { stream: true },
                user as any,
                isCallMode,
                userImg || undefined,
                undefined,
                [],
                (searching: boolean) => setIsSearching(searching)
            );

            if (typeof response === 'string') {
                addMessage({ id: Date.now() + 1, text: response, sender: 'bot' });
                speak(response, true);
            } else {
                // Handle Stream or Static Completion
                let fullText = "";
                const botId = Date.now() + 1;
                let botMessageAdded = false;

                if (Symbol.asyncIterator in response) {
                    streamingTextRef.current = "";
                    lastUpdateRef.current = Date.now();
                    spokenUpToRef.current = 0;

                    // Speak a sentence fragment immediately
                    const speakPending = () => {
                        const text = streamingTextRef.current;
                        const spoken = spokenUpToRef.current;
                        const remaining = text.slice(spoken);
                        // Find the last sentence boundary
                        const match = remaining.match(/^[\s\S]*?[.!?।](?=\s|$)/);
                        if (match) {
                            const sentence = match[0].trim();
                            if (sentence) speak(sentence);
                            spokenUpToRef.current = spoken + match[0].length;
                        }
                    };

                    for await (const chunk of (response as any)) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            streamingTextRef.current += content;
                            
                            // Only add bot message to state once we have content
                            if (!botMessageAdded && streamingTextRef.current.trim()) {
                                addMessage({ id: botId, text: streamingTextRef.current, sender: 'bot', isStreaming: true });
                                botMessageAdded = true;
                            }

                            // Throttled update: Only update React state every 150ms
                            const now = Date.now();
                            if (botMessageAdded && now - lastUpdateRef.current > 150) {
                                fullText = streamingTextRef.current;
                                setMessages((prev: Message[]) => prev.map(m => 
                                    m.id === botId ? { ...m, text: fullText, isStreaming: true } : m
                                ));
                                lastUpdateRef.current = now;
                            }

                            // Speak completed sentences as they arrive
                            speakPending();
                        }
                    }
                    fullText = streamingTextRef.current;
                } else {
                    fullText = (response as any).choices?.[0]?.message?.content || "";
                }
                
                // Finalize bot message
                if (botMessageAdded) {
                    setMessages((prev: Message[]) => prev.map(m => 
                        m.id === botId ? { ...m, text: fullText, isStreaming: false } : m
                    ));
                } else if (fullText.trim()) {
                    addMessage({ id: botId, text: fullText, sender: 'bot', isStreaming: false });
                }
                
                // Only extract memory if message is long enough to contains facts (> 30 chars)
                if (userText.length > 30) {
                    extractAndSaveMemory(userText);
                }
                // Speak any remaining text not yet spoken
                const remainder = fullText.slice(spokenUpToRef.current).trim();
                if (remainder) speak(remainder, false);
            }
        } catch (err) {
            addMessage({ id: Date.now() + 1, text: "I'm having a connection issue. Try again? 🌸", sender: 'bot' });
        } finally {
            setIsThinking(false);
        }
    };

    // STT Handlers
    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        if (isMicMuted) return;
        recognition.start();
        recognitionRef.current = recognition;
    };

    const onPTTStart = () => {
        pttTimerRef.current = setTimeout(() => {
            startListening();
        }, 200);
    };

    const onPTTEnd = () => {
        clearTimeout(pttTimerRef.current);
        if (recognitionRef.current) recognitionRef.current.stop();
    };

    return (
        <>
            <AnimatePresence>
                {isCallMode && !isMinimized && (
                    <CallOverlay 
                        isSpeaking={isSpeaking}
                        isThinking={isThinking}
                        isMuted={isMuted}
                        setIsMuted={setIsMuted}
                        isMicMuted={isMicMuted}
                        setIsMicMuted={setIsMicMuted}
                        onEndCall={() => {
                            setIsCallMode(false);
                            setIsMinimized(false);
                        }}
                        onMinimize={() => {
                            setIsMinimized(true);
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="fixed bottom-24 md:bottom-6 right-6 md:right-8 z-[100] pointer-events-none">
            {(!isOpen || isMinimized) && (
                <div className="pointer-events-auto absolute bottom-0 right-0">
                    <MinimizedBubble
                        isHolding={isListening}
                        isSpeaking={isSpeaking}
                        isThinking={isThinking}
                        isCallActive={isCallMode}
                        onMaximize={() => {
                            openChat();
                            setIsMinimized(false);
                        }}
                        onPTTStart={onPTTStart}
                        onPTTEnd={onPTTEnd}
                    />
                </div>
            )}

            <AnimatePresence>
            {isOpen && !isMinimized && (
                <motion.div
                    key="chatwindow"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ transformOrigin: 'bottom right' }}
                    className="absolute bottom-0 right-0 pointer-events-auto w-[95vw] md:w-[450px] h-[550px] md:h-[600px] max-h-[75vh] md:max-h-[85vh] flex flex-col"
                >
                    <ChatWindow
                        messages={messages}
                        isThinking={isThinking}
                        isSearching={isSearching}
                        onClose={handleClose}
                        onToggleSettings={() => setShowSettings(!showSettings)}
                        isCallMode={isCallMode}
                        setIsCallMode={setIsCallMode}
                        isMuted={isMuted}
                        setIsMuted={setIsMuted}
                    >
                        <InputBar
                            input={input}
                            setInput={setInput}
                            handleSend={handleSend}
                            isThinking={isThinking}
                            isListening={isListening}
                            selectedImage={selectedImage}
                            setSelectedImage={setSelectedImage}
                            handleFileSelect={handleFileSelect}
                            onPTTStart={onPTTStart}
                            onPTTEnd={onPTTEnd}
                        />
                    </ChatWindow>
                    {showSettings && (
                        <div className="absolute inset-0 z-[60] p-3 md:p-4 pointer-events-auto">
                             <div className="absolute inset-0 bg-[#0d0f14]/45 backdrop-blur-[1px] rounded-3xl" onClick={() => setShowSettings(false)} />
                             <div ref={settingsPanelRef} className="relative mx-auto w-full max-w-[390px] max-h-[72%] bg-[#0d0f14]/96 backdrop-blur-2xl rounded-2xl p-4 md:p-5 shadow-2xl overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                             <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h4 className="text-[12px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Voice engine</h4>
                                    <p className="text-[10px] text-white/20">Select Exa's personality</p>
                                </div>
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-2.5">
                                 {VOICE_PRESETS.map(preset => (
                                     <button 
                                        key={preset.id}
                                        onClick={() => {
                                            setSelectedPresetId(preset.id);
                                            localStorage.setItem('exa_voice_id', preset.id);
                                            localStorage.setItem('exa_voice_preset_id', preset.id);
                                            localStorage.setItem('exa_sidebar_voice_id', preset.id);
                                            // Play immediate preview
                                            speak("How do I sound?");
                                        }}
                                        className={`px-3.5 py-3.5 rounded-xl text-[12px] font-bold transition-all duration-300 border flex flex-col items-start gap-1 ${
                                            selectedPresetId === preset.id 
                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                                            : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:border-white/10 shadow-sm'
                                        }`}
                                     >
                                         <span className="text-[13px]">{preset.name.replace('Exa ', '')}</span>
                                         <span className={`text-[9px] uppercase tracking-widest ${selectedPresetId === preset.id ? 'text-white/60' : 'text-white/20'}`}>
                                            {preset.gender}
                                         </span>
                                     </button>
                                 ))}
                             </div>

                             <div className="mt-6 pt-5 border-t border-white/5">
                                 <button 
                                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                                    className="w-full py-3 text-[11px] font-black text-red-400/50 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all uppercase tracking-[0.2em] border border-red-400/10 hover:border-red-400/30"
                                 >
                                     Reset AI Memory
                                 </button>
                             </div>
                             </div>
                        </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
        </>
    );
};

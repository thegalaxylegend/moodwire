import { useState, useRef, useEffect } from 'react';
import { MinimizedBubble } from './MinimizedBubble';
import { askAI } from '../lib/ai';
import { useChatStore } from '../store/chatStore';
import type { Message } from '../store/chatStore';
import { useUserStore } from '../store/userStore';
import { extractAndSaveMemory } from '../lib/memoryExtractor';
import { ChatWindow } from './Chat/ChatWindow';
import { InputBar } from './Chat/InputBar';
import { CallOverlay } from './Chat/CallOverlay';
import { AnimatePresence, motion } from 'framer-motion';
import { ttsManager } from '../lib/tts/TTSManager';
import { usePerformance } from '../context/PerformanceProvider';

// Emotion Definitions
type ExaEmotion = 'neutral' | 'listening' | 'thinking' | 'speaking' | 'excited' | 'shy';

// Voice Preset Definition
interface VoicePreset {
    id: string;
    name: string;
    gender: 'female' | 'male';
    pitch: number;
    rate: number;
    isNeural?: boolean;
    modelUrl?: string;
    tokensUrl?: string;
}

const DYNAMIC_GREETINGS = [
    "Oh, you're back? ✨",
    "Hey. Study time again? 📚",
    "Finally! I missed you. ✨",
    "Ready to ace that exam? 🌸"
];

const VOICE_PRESETS: VoicePreset[] = [
    { 
        id: 'kristin_neural', 
        name: 'Exa (Natural)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.0, 
        isNeural: true,
        modelUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-us-kristin-medium/resolve/main/en_US-kristin-medium.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-us-kristin-medium/resolve/main/tokens.txt'
    },
    { 
        id: 'lessac_neural', 
        name: 'Exa (Tutor)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.0, 
        isNeural: true,
        modelUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-us-lessac-low/resolve/main/en_US-lessac-low.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-us-lessac-low/resolve/main/tokens.txt'
    },
    { 
        id: 'southern_neural', 
        name: 'Exa (British)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.0, 
        isNeural: true,
        modelUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-gb-southern_english_female-low/resolve/main/en_GB-southern_english_female-low.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-gb-southern_english_female-low/resolve/main/tokens.txt'
    },
    { 
        id: 'amy_neural', 
        name: 'Exa (Friendly)', 
        gender: 'female', 
        pitch: 1.0, 
        rate: 1.0, 
        isNeural: true,
        modelUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-amy-low/resolve/main/model.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-en-amy-low/resolve/main/tokens.txt'
    },
    { 
        id: 'hindi_neural', 
        name: 'Exa (Bharat)', 
        gender: 'female', 
        pitch: 1.0,
        rate: 1.0,
        isNeural: true,
        modelUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-hi-p302-low/resolve/main/hi_p302_low.onnx',
        tokensUrl: 'https://huggingface.co/csukuangfj/sherpa-onnx-vits-hi-p302-low/resolve/main/tokens.txt'
    },
    { id: 'girl_sweet', name: 'Exa (Sweet)', gender: 'female', pitch: 1.15, rate: 1.05 },
    { id: 'boy_chill', name: 'Exa (Chill)', gender: 'male', pitch: 1.0, rate: 0.95 },
];

export const Chatbot = () => {
    const { tier: perfTier } = usePerformance();
    const { 
        isOpen, openChat, closeChat, initialMessage, 
        messages, setMessages, isThinking, setIsThinking,
        isSearching, setIsSearching, addMessage,
        sessions, currentSessionId, switchSession, deleteSession, createSession,
        selectedLanguage, setLanguage
    } = useChatStore();
    
    const { user } = useUserStore();

    const [input, setInput] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCallMode, setIsCallMode] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [, ] = useState<ExaEmotion>('neutral');
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isTTSLoading, setIsTTSLoading] = useState(false);
    const [selectedPresetId, setSelectedPresetId] = useState<string>(() => localStorage.getItem('exa_voice_id') || localStorage.getItem('exa_voice_preset_id') || "kristin_neural");
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const recognitionRef = useRef<any>(null);
    const pttTimerRef = useRef<any>(null);
    const streamingTextRef = useRef("");
    const lastUpdateRef = useRef(0);
    const spokenUpToRef = useRef(0); // tracks how many chars have been sent to TTS

    // Pre-warm voices on mount so first speak() is instant
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const load = () => window.speechSynthesis.getVoices();
            load();
            window.speechSynthesis.addEventListener('voiceschanged', load);
            return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
        }
    }, [])

    // Persistent History handled by store actions

    // Body Scroll Lock signals
    useEffect(() => {
        const shouldLock = (isOpen && !isMinimized) || isCallMode;
        if (shouldLock) {
            document.documentElement.classList.add('chat-open');
        } else {
            document.documentElement.classList.remove('chat-open');
        }
        return () => {
            document.documentElement.classList.remove('chat-open');
        };
    }, [isOpen, isMinimized, isCallMode]);

    // Contextual Suggestions Logic
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) {
            setSuggestions(["How do I start?", "What's my goal?", "Tell me a fun fact"]);
            return;
        }

        if (lastMessage.sender === 'bot' && !isThinking && !lastMessage.isStreaming) {
            const botText = lastMessage.text.toLowerCase();
            
            // Knowledge Focus
            if (botText.includes("biology") || botText.includes("dna") || botText.includes("cell")) {
                setSuggestions(["Show me a diagram", "Test my biology knowledge", "Explain in simple terms"]);
            } else if (botText.includes("physics") || botText.includes("force") || botText.includes("quantum")) {
                setSuggestions(["Solve a problem", "Visual explanation", "Harder topic"]);
            } else if (botText.includes("math") || botText.includes("calculate") || botText.includes("formula")) {
                setSuggestions(["Give me a practice sum", "Step-by-step breakdown", "How is this used?"]);
            }
            // Interaction Focus
            else if (botText.includes("?") || botText.includes("feeling") || botText.includes("prep")) {
                setSuggestions(["I'm feeling great!", "Need a study plan", "A bit overwhelmed"]);
            } else if (botText.includes("ready") || botText.includes("back") || botText.includes("start")) {
                setSuggestions(["Let's study!", "Show me my progress", "Explain a topic"]);
            } else if (botText.includes("summarize") || botText.includes("overview")) {
                setSuggestions(["Deep dive into details", "Give me 3 key points", "Create a quiz"]);
            } else if (botText.includes("visual") || botText.includes("imagine") || botText.includes("diagram") || botText.includes("draw")) {
                setSuggestions(["Show me a Mermaid diagram", "Draw a flowchart", "Create a concept map"]);
            } else if (botText.includes("voice") || botText.includes("hear") || botText.includes("sound")) {
                setSuggestions(["Try a different voice", "Speach speed faster", "Speak more naturally"]);
            } else {
                setSuggestions(["Explain more", "Give an example", "What's next?"]);
            }
        } else if (lastMessage.sender === 'user' && isThinking) {
            setSuggestions([]); // Clear while thinking
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
            if (!isSpeaking) {
                const timer = setTimeout(() => {
                    startListening();
                }, 1000);
                return () => clearTimeout(timer);
            }
        } else {
            if (recognitionRef.current) recognitionRef.current.stop();
        }
    }, [isCallMode, isSpeaking]);

    // Handle initial message from store
    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage);
        }
    }, [initialMessage]);

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

    const speak = async (text: string, cancelPending = false) => {
        let cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
        cleanText = cleanText.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$[^$]*?\$/g, '').replace(/\\(text|frac|sqrt|left|right|times|cdot|geq|leq|neq|approx|infty|sum|int|prod|lim|rightarrow|leftarrow|Rightarrow|AA)\b\{?[^}]*\}?/g, '');
        cleanText = cleanText.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1').replace(/_{1,3}(.*?)_{1,3}/g, '$1').replace(/`{1,3}[^`]*`{1,3}/g, '').replace(/^#{1,6}\s+/gm, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/^[-*+]\s+/gm, '').replace(/^\d+\.\s+/gm, '').replace(/^>\s+/gm, '').replace(/\|/g, '').replace(/---+/g, '').trim();

        if (isMuted || !cleanText) return;

        const preset = VOICE_PRESETS.find(p => p.id === selectedPresetId) || VOICE_PRESETS[0];

        // AUTO-SWITCH TO HINDI MODEL IF LANG IS HI
        const isHindiMode = selectedLanguage === 'hi';
        const finalModelId = isHindiMode ? 'hindi_neural' : selectedPresetId;
        const finalPreset = VOICE_PRESETS.find(p => p.id === finalModelId) || preset;

        // NEW: Neural Engine Logic / Modified for Loading Feedback + Thermal Safety
        const isThermalThrottling = perfTier === 'low';
        if (finalPreset.isNeural && !isThermalThrottling) {
            try {
                if (cancelPending) ttsManager.stop();
                
                // Only show loading if engine needs initialization
                if (!isTTSLoading) { // Guard against rapid toggles
                   setIsTTSLoading(true);
                }
                
                await ttsManager.init(finalPreset.modelUrl, finalPreset.tokensUrl); 
                setIsTTSLoading(false);
                
                setIsSpeaking(true);
                await ttsManager.speak(cleanText, finalPreset.rate || 1.0, finalPreset.modelUrl, finalPreset.tokensUrl);
                setIsSpeaking(false);
                return; 
            } catch (err) {
                console.warn("[Chatbot] Neural TTS failed, shifting to system fallback:", err);
                setIsTTSLoading(false);
            }
        }

        // --- System Fallback (window.speechSynthesis) ---
        if (!window.speechSynthesis) return;

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

        if (cancelPending) window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
        if (e) e.preventDefault();
        const userText = overrideText || input;
        if (!userText.trim() && !selectedImage) return;
        const userImg = selectedImage;
        const userMsg: Message = { id: Date.now(), text: userText, sender: 'user', image: userImg || undefined };
        
        addMessage(userMsg);
        setInput("");
        setSelectedImage(null);
        
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        // Detect Intents
        const lowText = userText.toLowerCase();
        const isVisualRequest = lowText.match(/diagram|draw|visual|map|flowchart|chart|explanation|graph/);
        const isDoubtRequest = lowText.match(/solve|doubt|question|explain why|how to|answer|options/) || selectedImage;

        let promptOverride = "";
        if (isVisualRequest) {
            promptOverride = `[PROTOCOL: CRYSTALLINE DIAGRAM] Use professional Mermaid.js code only. No ASCII art. For 2D/math graphs (e.g. v-t graphs, equations), use exactly this syntax:\n\`\`\`mermaid\nxychart-beta\n  x-axis [0, 1, 2, 3, 4, 5, 6]\n  y-axis "Label" 0 --> 20\n  line [0, 2, 4, 6, 8, 10, 12]\n\`\`\`\nCRITICAL RULES:\n1. NEVER use 2D arrays like [[0,0], [1,1]]. You MUST use two separate flat arrays.\n2. Calculate high-resolution coordinates (at least 5-8 points) for smooth mathematical curves.\n3. NEVER use 'note' or flowchart commands.\n4. ALWAYS put a newline before x-axis, y-axis, and line. Do not use graph TD for coordinate graphs.\n`;
        } else if (isDoubtRequest) {
            promptOverride = `[PROTOCOL: DOUBT SOLVER]\nYou are acting as an elite tutor.\n1. PRE-CHECK: Understand the question deeply.\n2. STEP-BY-STEP: Provide a very rigorous, step-by-step logical breakdown.\n3. WHY OTHERS ARE WRONG: Explicitly analyze the incorrect options or alternate methods and explain why they fail.\n4. TONE: Encouraging but purely academic.\nIf the student says "Teach me like I'm 12", use simple analogies.\n`;
        }

        setIsThinking(true);

        try {
            // Build history — modelRouter waterfall handles Cerebras → Groq → Gemini automatically
            const history = [
                ...messages.slice(-9).map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                })),
                { role: 'user', content: promptOverride + userText }
            ] as any;

            const aiOptions = { stream: true, tier: 'T3' };

            // Single call — modelRouter waterfall: Cerebras → Groq → Gemini
            const response = await askAI(
                "Chat context",
                promptOverride + userText,
                'auto',
                history,
                aiOptions,
                user as any,
                isCallMode,
                userImg || undefined,
                undefined,
                [],
                (searching: boolean) => setIsSearching(searching),
                { language: selectedLanguage }
            );

            if (typeof response === 'string') {
                addMessage({ id: Date.now() + 1, text: response, sender: 'bot' });
                speak(response, true);
            } else {
                let fullText = "";
                const botId = Date.now() + 1;
                let botMessageAdded = false;

                if (Symbol.asyncIterator in response) {
                    streamingTextRef.current = "";
                    lastUpdateRef.current = Date.now();
                    spokenUpToRef.current = 0;

                    const speakPending = (isFinal = false) => {
                        if (isMuted) return; // Silent Buffer: Don't even process if muted

                        const text = streamingTextRef.current;
                        const spoken = spokenUpToRef.current;
                        const remaining = text.slice(spoken);

                        // Only speak when a full sentence is ready
                        const match = remaining.match(/^[\s\S]*?[.!?।](?=\s|$)/);
                        
                        if (match) {
                            const sentence = match[0].trim();
                            if (sentence) speak(sentence);
                            spokenUpToRef.current = spoken + match[0].length;
                        } else if (isFinal && remaining.trim()) {
                            // Only speak the final remainder if it's not empty
                            speak(remaining.trim());
                            spokenUpToRef.current = spoken + remaining.length;
                        }
                    };

                    for await (const chunk of (response as any)) {
                        // Normalize both Groq format {choices[0].delta.content} and Gemini passthrough
                        const content = chunk.choices?.[0]?.delta?.content 
                            ?? chunk.candidates?.[0]?.content?.parts?.[0]?.text 
                            ?? "";
                        if (content) {
                            streamingTextRef.current += content;
                            
                            if (!botMessageAdded && streamingTextRef.current.trim()) {
                                addMessage({ id: botId, text: streamingTextRef.current, sender: 'bot', isStreaming: true });
                                botMessageAdded = true;
                            }

                            const now = Date.now();
                            if (botMessageAdded && now - lastUpdateRef.current > 150) {
                                fullText = streamingTextRef.current;
                                setMessages((prev: Message[]) => prev.map(m => 
                                    m.id === botId ? { ...m, text: fullText, isStreaming: true } : m
                                ));
                                lastUpdateRef.current = now;
                            }

                            speakPending();
                        }
                    }
                    fullText = streamingTextRef.current;
                    speakPending(true); // Final check for any remaining text
                } else {
                    fullText = (response as any).choices?.[0]?.message?.content || "";
                }
                
                if (botMessageAdded) {
                    setMessages((prev: Message[]) => prev.map(m => 
                        m.id === botId ? { ...m, text: fullText, isStreaming: false } : m
                    ));
                } else if (fullText.trim()) {
                    addMessage({ id: botId, text: fullText, sender: 'bot', isStreaming: false });
                }
                
                if (userText.length > 30) {
                    extractAndSaveMemory(userText);
                }
                const remainder = fullText.slice(spokenUpToRef.current).trim();
                if (remainder) speak(remainder, false);
            }
        } catch (err) {
            addMessage({ id: Date.now() + 1, text: "I'm having a connection issue. Try again? 🌸", sender: 'bot' });
        } finally {
            setIsThinking(false);
        }
    };

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
        <div className={`perf-tier-${perfTier}`}>
            <AnimatePresence>
                {isOpen && !isMinimized && !isCallMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={handleClose}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            handleClose();
                        }}
                        className="fixed inset-0 bg-[#0a0b10]/80 backdrop-blur-2xl z-[80] pointer-events-auto cursor-pointer exa-chat-backdrop"
                    />
                )}
            </AnimatePresence>

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

            <div className="fixed bottom-[calc(84px+env(safe-area-inset-bottom,12px))] md:bottom-6 right-4 md:right-8 z-[100] pointer-events-none">
                <AnimatePresence mode="wait">
                    {(!isOpen || isMinimized) && (
                        <motion.div 
                            key="minimized-bubble"
                            initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="pointer-events-auto absolute bottom-0 right-0"
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {isOpen && !isMinimized && (
                    <motion.div
                        key="chatwindow"
                        initial={{ 
                            opacity: 0, 
                            scale: 0.92,
                            y: 16,
                        }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            y: 0,
                        }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.92,
                            y: 16,
                        }}
                        transition={
                            perfTier === 'low' 
                                ? { type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                                : { 
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 38,
                                    mass: 0.7,
                                    restDelta: 0.001
                                }
                        }
                        className={`fixed top-[calc(8px+env(safe-area-inset-top,0px))] left-2 right-2 bottom-[calc(8px+env(safe-area-inset-bottom,0px))] md:inset-6 lg:inset-x-[6%] lg:inset-y-[5%] z-[100] pointer-events-auto flex flex-col perf-tier-${perfTier} exa-chat-window`}
                    >
                        <ChatWindow
                            messages={messages}
                            isThinking={isThinking}
                            isTTSLoading={isTTSLoading}
                            isSearching={isSearching}
                            suggestions={suggestions}
                            onSelectSuggestion={(text) => {
                                setInput(text);
                                handleSend(undefined, text);
                            }}
                            onClearHistory={() => {
                                if (window.confirm("Nuclear Reset? This wipes the current chat history.")) {
                                    useChatStore.getState().clearHistory();
                                }
                            }}
                            onClose={handleClose}
                            isCallMode={isCallMode}
                            setIsCallMode={setIsCallMode}
                            isMuted={isMuted}
                            setIsMuted={setIsMuted}
                            selectedLanguage={selectedLanguage}
                            onSelectLanguage={setLanguage}
                            voicePresets={VOICE_PRESETS.filter(v => {
                                if (selectedLanguage === 'hi') return v.id === 'hindi_neural';
                                return v.id !== 'hindi_neural';
                            })}
                            selectedPresetId={selectedLanguage === 'hi' ? 'hindi_neural' : selectedPresetId}
                             onSelectPreset={(id) => {
                                 const preset = VOICE_PRESETS.find(p => p.id === id);
                                 if (!preset) return;
                                 
                                 setSelectedPresetId(id);
                                 localStorage.setItem('exa_voice_id', id);
                                 
                                 if (preset.isNeural) {
                                     setIsTTSLoading(true);
                                     ttsManager.init(preset.modelUrl, preset.tokensUrl).then(() => {
                                         setIsTTSLoading(false);
                                         speak(selectedLanguage === 'hi' ? "Namaste! Meri awaaz kaisi hai?" : "How do I sound now? I'm using my new natural voice engine.");
                                     }).catch((err) => {
                                         console.error("Neural Voice Init Error:", err);
                                         setIsTTSLoading(false);
                                         speak(selectedLanguage === 'hi' ? "Maaf kijiye, kuch error hai." : "Something went wrong with my high-quality voice. Using basic voice instead.");
                                     });
                                 } else {
                                     speak(selectedLanguage === 'hi' ? "Ab ye voice kaisa hai?" : "How do I sound now?");
                                 }
                             }}
                            sessions={sessions}
                            currentSessionId={currentSessionId}
                            onSwitchSession={switchSession}
                            onDeleteSession={deleteSession}
                            onCreateSession={() => createSession()}
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

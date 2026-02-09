import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { MinimizedBubble } from './MinimizedBubble';
import { X, Send, Bot, User, Paperclip, Loader2, Image as ImageIcon, Mic, Volume2, MicOff, VolumeX, Phone, PhoneOff, Settings, Minimize2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { askAI } from '../lib/ai';

import remarkGfm from 'remark-gfm';

const ReactMarkdown = lazy(() => import('react-markdown'));
const AvatarCanvas = lazy(() => import('./avatar/AvatarCanvas').then(m => ({ default: m.AvatarCanvas })));

type Message = {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    link?: string;
    linkText?: string;
    image?: string;
};

import { useChatStore } from '../store/chatStore';
import { useUserStore } from '../store/userStore';

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
    "Oh, you're back? ✨ I wasn't waiting for you or anything... but I'm glad you're here. How are you feeling? 🌸",
    "Hey. I noticed you haven't talked to me in a while. Not that I was counting the minutes! ☁️ Are you okay? ✨",
    "Study time again? 📚 I mean, if you want. I'm here if you need me... for the exam, obviously. How's your head feeling? ☁️",
    "Finally! I was starting to think you forgot about me. ✨ How's your heart doing today? Not that it matters to me... okay, maybe it does. 💖"
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
    const { isOpen, openChat, closeChat, initialMessage } = useChatStore();
    const { user, updateProfile } = useUserStore();
    const navigate = useNavigate();

    // Pick a random greeting on mount
    const [initialExaGreeting] = useState(() => DYNAMIC_GREETINGS[Math.floor(Math.random() * DYNAMIC_GREETINGS.length)]);

    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: initialExaGreeting, sender: 'bot' }
    ]);
    const [input, setInput] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [isCallMode, setIsCallMode] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);

    // PTT Logic
    const [isHolding, setIsHolding] = useState(false);
    const pttStartTimeRef = useRef<number>(0);
    const wasHoldingRef = useRef<boolean>(false);

    // Behavioral Tracking
    const [confusionCount, setConfusionCount] = useState(0);
    const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());
    const [explainBackTrigger, setExplainBackTrigger] = useState(0);
    const [emotion, setEmotion] = useState<ExaEmotion>('neutral');

    // Auto-update basic emotions
    useEffect(() => {
        if (isSpeaking) setEmotion('speaking');
        else if (isThinking) setEmotion('thinking');
        else if (isListening || isHolding) setEmotion('listening');
        else setEmotion('neutral');
    }, [isSpeaking, isThinking, isListening, isHolding]);

    // Voice Selection State
    const [showSettings, setShowSettings] = useState(false);
    const [isSettingsClosing, setIsSettingsClosing] = useState(false);
    const [selectedPresetId, setSelectedPresetId] = useState<string>("girl_sweet"); // Default Preset

    // Audio tracking refs

    const lastTranscriptRef = useRef("");
    const hasProcessedResultRef = useRef(false);
    const shouldListenRef = useRef(false);
    const pttTimerRef = useRef<any>(null);
    const initialLoadDone = useRef(false);

    // Use ref to track call mode state in async callbacks
    const isCallModeRef = useRef(isCallMode);
    useEffect(() => {
        isCallModeRef.current = isCallMode;
    }, [isCallMode]);

    const isMinimizedRef = useRef(isMinimized);
    useEffect(() => {
        isMinimizedRef.current = isMinimized;
    }, [isMinimized]);

    // Handle initial message triggering
    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage);
        }
    }, [initialMessage]);

    // Handle Closing Animation
    const closeSettings = () => {
        setIsSettingsClosing(true);
        setTimeout(() => {
            setShowSettings(false);
            setIsSettingsClosing(false);
        }, 300);
    };

    // Mobile Back Button Support
    useEffect(() => {
        if (showSettings) {
            window.history.pushState({ menu: 'voice' }, '');
        }

        const handlePopState = () => {
            if (showSettings) {
                closeSettings();
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [showSettings]);

    const handleClose = () => {
        if (isCallMode) {
            setIsMinimized(true);
            return;
        }
        setIsClosing(true);
        setIsThinking(false); // Reset thinking on close
        window.speechSynthesis.cancel(); // Stop talking on close

        // Stop Mic Immediately
        shouldListenRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        setTimeout(() => {
            closeChat();
            setIsClosing(false);
            setIsCallMode(false); // End call on close
            setIsMicMuted(false); // Reset mute on close
            setIsMinimized(false);

            // Navigate home if on mobile
            if (window.innerWidth < 1024) {
                navigate('/dashboard');
            }
        }, 300); // Match animation duration
    };

    const handleMinimize = () => {
        setIsMinimized(true);
        // Only stop listening if we are NOT in active call mode (User wants background call)
        if (!isCallMode) {
            shouldListenRef.current = false;
            recognitionRef.current?.stop();
        }
    };


    // PTT logic moved to top for better scope

    const handlePushToTalkStart = (e: any) => {
        // Stop bubbling 
        e.stopPropagation();
        if (isHolding) return;

        console.log("👇 PTT Touch Start - Eager Listen");
        pttStartTimeRef.current = Date.now();
        wasHoldingRef.current = false; // Reset

        // EAGER LISTEN: Start mic immediately, don't wait for timer
        shouldListenRef.current = true;
        startListening(true); // Using continuous=true for PTT allows better tail capture? simplified logic.

        // Start visuals timer (optional, just for UI feedback)
        pttTimerRef.current = setTimeout(() => {
            setIsHolding(true);
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }, 300);
    };

    const handlePushToTalkEnd = (e: any) => {
        e.stopPropagation();
        const duration = Date.now() - pttStartTimeRef.current;
        console.log(`☝️ PTT Touch End - Duration: ${duration}ms`);

        // Clear visual timer
        if (pttTimerRef.current) {
            clearTimeout(pttTimerRef.current);
            pttTimerRef.current = null;
        }

        // SHORT TAP LOGIC (< 300ms)
        if (duration < 300) {
            console.log("👆 Short Tap Detected -> Aborting Mic & Maximizing");
            shouldListenRef.current = false;
            // Hack: Mark as processed to prevent "I didn't catch that" on abort
            hasProcessedResultRef.current = true;
            // Abort the eager listen
            if (recognitionRef.current) recognitionRef.current.abort();
            setIsHolding(false);

            if (isCallMode) {
                setIsMinimized(false);
            } else {
                openChat();
                setIsMinimized(false);
            }
            return;
        }

        // HOLD LOGIC (> 300ms)
        console.log("👋 PTT Hold Release -> Processing");
        setIsHolding(false);
        wasHoldingRef.current = true; // Mark as holding preventing click

        // Standard PTT End Logic (Graceful Stop)
        if (isCallModeRef.current && !isMinimizedRef.current) {
            shouldListenRef.current = true;
            // Stop immediately if switching to continuous
            if (recognitionRef.current) recognitionRef.current.stop();
        } else {
            shouldListenRef.current = false;
            // GRACEFUL STOP
            if (!lastTranscriptRef.current && recognitionRef.current) {
                console.log("⏳ Graceful Stop: Waiting for tail...");
                setTimeout(() => {
                    recognitionRef.current?.stop();
                }, 500);
            } else {
                if (recognitionRef.current) recognitionRef.current.stop();
            }
        }
    };

    const handleHangUp = () => {
        setIsCallMode(false);
        setIsMinimized(false);
        closeChat(); // Close the global state

        // Navigate home on mobile or general "close screen" request
        if (window.innerWidth < 1024) {
            navigate('/dashboard');
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Load messages from localStorage on mount
    useEffect(() => {
        if (initialLoadDone.current) return;

        const savedMessages = localStorage.getItem('chat_history');
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
                initialLoadDone.current = true;
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        } else if (user?.recentChat && user.recentChat.length > 0) {
            // Recover from Cloud if local is empty
            const recovered = user.recentChat.map((m, i) => ({
                id: m.timestamp + i,
                text: m.text,
                sender: m.role === 'user' ? 'user' : 'bot'
            })) as Message[];
            setMessages(recovered);
            initialLoadDone.current = true;
        }

        // Prime voices for better initialization
        const loadVoices = () => {
            const vs = window.speechSynthesis.getVoices();
            if (vs.length > 0) {
                // Try to load saved preference (Preset ID)
                const savedPresetId = localStorage.getItem('exa_voice_preset_id');
                if (savedPresetId) setSelectedPresetId(savedPresetId);
            }
        };

        window.speechSynthesis.getVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices(); // Initial try
    }, [user]);

    // Save voice preference
    const handleVoiceChange = (presetId: string) => {
        setSelectedPresetId(presetId);
        localStorage.setItem('exa_voice_preset_id', presetId);
    };

    const unlockAudio = () => {
        // Essential for mobile browsers to allow subsequent speech after async tasks
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        window.speechSynthesis.speak(u);
    };

    // --- Exa's Soul: Memory Helpers ---
    const extractAndSaveMemory = (text: string) => {
        const lower = text.toLowerCase();
        let memory = localStorage.getItem('exa_memory') || "";
        const lines = memory.split('\n').filter(Boolean);

        // Simple Extraction (can be improved with AI extraction later)
        if (lower.includes('my name is ')) {
            const name = text.split(/my name is /i)[1];
            lines.push(`Student's name is ${name}`);
        }
        if (lower.includes('my birthday is ')) {
            const bday = text.split(/my birthday is /i)[1];
            lines.push(`Student's birthday is ${bday}`);
        }
        if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('burnt out')) {
            lines.push(`Student mentioned feeling tired/burnt out on ${new Date().toLocaleDateString()}`);
        }

        // Keep unique lines and cap at 10 important facts
        const uniqueLines = Array.from(new Set(lines)).slice(-10);
        localStorage.setItem('exa_memory', uniqueLines.join('\n'));
    };

    const getImportantMemories = () => localStorage.getItem('exa_memory') || "";

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    // Voice Synthesis Logic


    const detectEmotionFromText = (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes('✨') || lower.includes('excited') || lower.includes('happy') || lower.includes('yay')) return 'excited';
        if (lower.includes('🌸') || lower.includes('shy') || lower.includes('flustered') || lower.includes('dummy') || lower.includes('staring')) return 'shy';
        return 'neutral';
    };

    const speak = (text: string, onEnd?: () => void) => {
        // Strip emojis to prevent AI reading them out
        const cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        setIsSpeaking(true);
        setIsSpeaking(true);
        // We DO NOT start listening here to prevent self-interruption (echo cancellation issues)
        // if (!isListening) {
        //    shouldListenRef.current = true;
        //    startListening(true);
        // }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const currentPreset = VOICE_PRESETS.find(p => p.id === selectedPresetId) || VOICE_PRESETS[0];

        let systemVoice: SpeechSynthesisVoice | undefined;
        const findByName = (keywords: string[]) => voices.find(v => keywords.some(k => v.name.includes(k)));

        if (currentPreset.gender === 'female') {
            systemVoice = findByName(['Google US English', 'Samantha', 'Zira', 'Microsoft Zira', 'Google UK English Female'])
                || voices.find(v => v.name.includes('Female') || v.name.includes('female'))
                || voices.find(v => v.lang === 'en-US' && !v.name.includes('Male'))
                || voices[0];
        } else {
            systemVoice = findByName(['Google UK English Male', 'Daniel', 'Google US English Male', 'David', 'Microsoft David'])
                || voices.find(v => v.name.includes('Male') || v.name.includes('male'))
                || voices.find(v => v.lang === 'en-GB')
                || voices[0];
        }

        if (systemVoice) {
            utterance.voice = systemVoice;
            const isConfidentMatch = systemVoice.name.includes(currentPreset.gender === 'female' ? 'Female' : 'Male')
                || systemVoice.name.includes(currentPreset.gender === 'female' ? 'Zira' : 'David')
                || systemVoice.name.includes(currentPreset.gender === 'female' ? 'Samantha' : 'Daniel');

            if (isConfidentMatch) {
                utterance.pitch = currentPreset.pitch;
            } else {
                utterance.pitch = currentPreset.gender === 'female' ? Math.min(currentPreset.pitch, 1.1) : Math.max(currentPreset.pitch, 0.95);
            }
            utterance.rate = currentPreset.rate;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEnd) onEnd();
            if (isCallModeRef.current && !isThinking && !isMinimizedRef.current) {
                setTimeout(() => {
                    shouldListenRef.current = true;
                    startListening(true);
                }, 500);
            }
        };
        utterance.onerror = (e) => {
            console.error("🗣️ Speech Error:", e);
            setIsSpeaking(false);
            if (onEnd) onEnd();
            if (isCallModeRef.current && !isMinimizedRef.current) {
                setTimeout(() => {
                    shouldListenRef.current = true;
                    startListening(true);
                }, 500);
            }
        };

        window.speechSynthesis.speak(utterance);
    };

    // Speech Recognition Logic
    const recognitionRef = useRef<any>(null);


    const startListening = async (continuous: boolean = false) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        // Removed manual getUserMedia check to prevent audio device conflicts.
        // SpeechRecognition handles permission requests automatically.

        shouldListenRef.current = continuous;
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.abort();
            } catch (e) { }
        }

        // Clear previous transcript ONLY when starting a fresh listen, 
        // but preserve if we are just restarting loop? 
        // Actually for PTT we want fresh.
        lastTranscriptRef.current = "";

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        // Enable interim results to ensure we capture speech even if stop() is called quickly
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onspeechstart = () => {
            setInput("Exa is listening...");
            setTimeout(() => {
                if (shouldListenRef.current && !hasProcessedResultRef.current) {
                    setInput("");
                }
            }, 3000);
        };

        recognition.onstart = () => {
            console.log("🎤 [Mic] Started");
            setIsListening(true);
            hasProcessedResultRef.current = false;
        };

        recognition.onend = () => {
            console.log("🎤 [Mic] Ended");
            setIsListening(false);

            const hasText = lastTranscriptRef.current.trim().length > 0;
            console.log(`🎤 [Mic] End Check: hasText=${hasText}, processed=${hasProcessedResultRef.current}, text="${lastTranscriptRef.current}"`);

            if (continuous && !hasProcessedResultRef.current && hasText) {
                console.log("🎤 [Mic] Sending Text (Continuous)");
                hasProcessedResultRef.current = true;
                handleSend(new Event('submit') as any, lastTranscriptRef.current, true);
            } else if (isMinimizedRef.current && !hasText && !hasProcessedResultRef.current && !shouldListenRef.current) {
                // Feedback triggers ONLY if user has RELEASED the button (shouldListen=false)
                // This prevents it from interrupting while they are holding and thinking.
                console.log("🎤 [Mic] Silence Feedback Triggered");
                speak("I didn't catch that.");
            }

            // Restart loop if we should listen, not speaking/thinking
            // AND (Not minimized OR Call Mode is active) --> Call Mode overrides minimize block
            if (shouldListenRef.current && !isSpeaking && !isThinking && (!isMinimizedRef.current || isCallModeRef.current)) {
                setTimeout(() => {
                    if (!isSpeaking) startListening(true);
                }, 300);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("🎤 [Mic] Error:", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                shouldListenRef.current = false;
                setIsCallMode(false);
                alert("Microphone access denied. Please enable permissions.");
            }
            if (event.error === 'no-speech' || event.error === 'aborted') {
                if (isSpeaking) setIsSpeaking(false);
                // Retry if we should be listening and NOT minimized
                if (shouldListenRef.current && !isMinimizedRef.current) {
                    setTimeout(() => {
                        if (!isSpeaking) startListening(true);
                    }, 300);
                }
            }
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            console.log(`🎤 [Mic] Result: "${currentText}" (Final: ${!!finalTranscript})`);

            if (isSpeaking) {
                if (currentText.toLowerCase().includes("exa")) {
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                } else {
                    return;
                }
            }

            if (currentText) {
                setInput(currentText);
                lastTranscriptRef.current = currentText;
            }
        };

        recognitionRef.current = recognition;
        // Start immediately - no delay
        try {
            recognition.start();
        } catch (e) {
            console.error("Mic Start Error", e);
        }
    };

    const stopListening = () => {
        shouldListenRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch (e) { }
            setIsListening(false);
        }
    };

    useEffect(() => {
        if (isCallMode && !isMicMuted) {
            if (!shouldListenRef.current && !isListening) {
                startListening(true);
            }
        } else if (!isCallMode) {
            stopListening();
            window.speechSynthesis.cancel();
        }

        if (isCallMode && isMicMuted) {
            stopListening();
        }
    }, [isCallMode, isMicMuted]);

    const handleSend = async (e: React.FormEvent, overrideText?: string, forceVoice: boolean = false) => {
        if (e) e.preventDefault();
        if (voiceEnabled || isCallModeRef.current || forceVoice) unlockAudio();

        const textToSend = overrideText || input;
        if (!textToSend.trim() && !selectedImage) return;

        setIsThinking(true);
        const userMsg: Message = {
            id: Date.now(),
            text: textToSend,
            sender: 'user',
            image: selectedImage || undefined
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        lastTranscriptRef.current = "";
        const imageToSend = selectedImage;
        setSelectedImage(null);
        if (isCallModeRef.current) window.speechSynthesis.cancel();

        const now = Date.now();
        const timeDiff = now - lastMessageTime;
        setLastMessageTime(now);

        // Confusion Detection: Repeated content or long pause
        const isRepeated = messages.length > 0 && messages[messages.length - 1].text.toLowerCase() === textToSend.toLowerCase();
        const isLongPause = timeDiff > 60000;

        if (isRepeated || isLongPause) {
            setConfusionCount(prev => prev + 1);
        } else {
            setConfusionCount(0);
        }

        const context = `You are "Exa". Brillaint mentor with hidden affection. Current Confusion: ${confusionCount}.`;

        try {
            const history = messages.slice(-10).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            })) as any;

            const adaptiveProfile = {
                skills: user?.skills,
                mistakes: user?.commonMistakes || [],
                targetExam: user?.targetExam,
                userClass: user?.userClass
            };

            // Forgetfulness Predictor Check
            let forgetfulnessWarning = "";
            if (user?.lastTestDate) {
                const lastTest = new Date(user.lastTestDate);
                const daysSince = (now - lastTest.getTime()) / (1000 * 360 * 60 * 24);
                if (daysSince > 1.5) {
                    forgetfulnessWarning = "\n\n⚠️ You are likely to forget your last topic soon. A quick revision now will lock it in.";
                }
            }

            let botResponse = await askAI(
                context,
                userMsg.text || "Analyze this image",
                'groq',
                history,
                { temperature: 0.7 },
                adaptiveProfile,
                isCallMode || voiceEnabled,
                imageToSend || undefined,
                getImportantMemories()
            );
            console.log("🤖 Chatbot: askAI returned:", botResponse ? (botResponse.substring(0, 20) + "...") : "NULL/EMPTY");

            if (botResponse && forgetfulnessWarning) {
                botResponse += forgetfulnessWarning;
            }

            // Sync to Cloud
            if (user) {
                const latestHistory = [...messages, userMsg, { id: Date.now() + 1, text: botResponse || "...", sender: 'bot' }].slice(-10);
                const syncHistory = latestHistory.map(m => ({
                    role: m.sender === 'user' ? 'user' : 'bot',
                    text: m.text,
                    timestamp: Date.now()
                })) as any;
                updateProfile({ recentChat: syncHistory });
            }

            // Extract personal facts
            extractAndSaveMemory(textToSend);

            setExplainBackTrigger(prev => prev + 1);
            if (explainBackTrigger >= 3) setExplainBackTrigger(0);

            let link = undefined;
            let linkText = undefined;
            const lowerRes = botResponse?.toLowerCase() || "";
            if (lowerRes.includes('syllabus')) {
                link = "/dashboard/syllabus";
                linkText = "View Syllabus";
            } else if (lowerRes.includes('jan 24')) {
                link = "/dashboard/timeline";
                linkText = "View Timeline";
            }

            const botMsg: Message = {
                id: Date.now() + 1,
                text: botResponse || "...",
                sender: 'bot',
                link,
                linkText
            };

            setMessages(prev => [...prev, botMsg]);

            if (botResponse && (voiceEnabled || isCallMode || forceVoice)) {
                speak(botResponse);
            }

            // Set dynamic emotion based on response text
            const nextEmotion = detectEmotionFromText(botResponse || "");
            if (nextEmotion !== 'neutral') {
                setEmotion(nextEmotion);
                // Reset to neutral after 5 seconds of 'special' emotion
                setTimeout(() => setEmotion('neutral'), 5000);
            }

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: "Connection Issue.", sender: 'bot' }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-36 md:bottom-6 right-6 md:right-8 z-[100] flex flex-col items-end pointer-events-none">
            {(!isOpen || isMinimized) && (
                <div className="pointer-events-auto">
                    <MinimizedBubble
                        isHolding={isHolding}
                        isSpeaking={isSpeaking}
                        isThinking={isThinking}
                        onMaximize={() => {
                            clearTimeout(pttTimerRef.current);
                            pttTimerRef.current = null;

                            // BLOCK if we just came from a PTT hold (click event from mouseup)
                            if (wasHoldingRef.current) {
                                console.log("🛑 Blocking maximize (was holding)");
                                wasHoldingRef.current = false;
                                return;
                            }

                            if (isCallMode) {
                                setIsMinimized(false);
                                shouldListenRef.current = true;
                                startListening(true);
                            } else {
                                openChat();
                                setIsMinimized(false);
                            }
                        }}
                        onPTTStart={handlePushToTalkStart}
                        onPTTEnd={handlePushToTalkEnd}
                    />
                </div>
            )}

            {isOpen && !isMinimized && (
                <div className="contents">
                    {!isCallMode && (
                        <div className={`fixed bottom-24 right-4 left-4 md:left-auto md:bottom-auto md:relative w-auto md:w-96 h-[80vh] max-h-[600px] md:h-[600px] flex flex-col rounded-2xl bg-surface backdrop-blur-xl border border-border shadow-2xl origin-bottom-right pointer-events-auto z-[151] ${isClosing ? 'oxygen-pop-out-br' : 'oxygen-pop-in-br'}`}>
                            <div className="p-4 border-b border-border flex items-center justify-between bg-primary/10 rounded-t-2xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"> <Bot size={18} className="text-white" /> </div>
                                    <h3 className="font-bold text-text-main">Exa <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full ml-1">AI</span></h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setIsCallMode(true);
                                            unlockAudio();
                                            const callGreetings = [
                                                "Oh! ✨ You want to hear my voice? I... I guess I can talk for a bit. How are you doing? 🌸",
                                                "Finally. I was wondering when you'd call. ✨ Everything okay? ☁️",
                                                "Hey. I'm glad you called... not that I was waiting or anything! 😊 How was your day? ✨",
                                                "So you need me after all? 💖 Fine, I'm listening. Tell me how you're feeling. ✨"
                                            ];
                                            const greeting = callGreetings[Math.floor(Math.random() * callGreetings.length)];
                                            speak(greeting);
                                        }}
                                        className="p-1.5 rounded-lg text-text-muted hover:text-green-500 transition-colors"
                                    >
                                        <Phone size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const next = !voiceEnabled;
                                            setVoiceEnabled(next);
                                            if (next) {
                                                unlockAudio();
                                                speak("Exa voice active.");
                                            } else {
                                                window.speechSynthesis.cancel();
                                            }
                                        }}
                                        className={`p-1.5 rounded-lg transition-all ${voiceEnabled ? 'bg-primary/20 text-primary shadow-sm shadow-primary/20' : 'text-text-muted hover:bg-white/5'}`}
                                        title={voiceEnabled ? "Mute Voice" : "Enable Voice"}
                                    >
                                        {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                    </button>
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-white/5'}`}
                                        title="Voice Settings"
                                    >
                                        <Settings size={18} className={showSettings ? 'animate-spin-slow' : ''} />
                                    </button>
                                    <button onClick={handleClose} className="text-text-muted hover:text-text-main p-1.5 rounded-lg"> <X size={18} /> </button>
                                </div>
                            </div>

                            {(showSettings || isSettingsClosing) && (
                                <div className={`absolute top-[65px] left-0 right-0 z-20 bg-surface/90 backdrop-blur-2xl p-4 border-b border-border shadow-2xl rounded-b-xl overflow-hidden ${isSettingsClosing ? 'animate-fade-out-up' : 'animate-fade-in-down'}`}>
                                    <h4 className="text-sm font-bold text-text-main mb-3 flex items-center justify-between">
                                        Select Voice
                                        <button onClick={closeSettings} className="text-text-muted hover:text-text-main"><X size={14} /></button>
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {VOICE_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => { handleVoiceChange(preset.id); speak("How do I sound?"); }}
                                                className={`p-2 rounded border text-xs text-left truncate transition-all ${selectedPresetId === preset.id ? 'bg-primary/20 border-primary text-primary' : 'bg-surface border-border text-text-muted hover:bg-surface-hover'}`}
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-secondary' : 'bg-primary'}`}> {msg.sender === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />} </div>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-secondary/20 text-text-main rounded-tr-none' : 'bg-surface border border-border text-text-main rounded-tl-none'}`}>
                                            {msg.image && <img src={msg.image} className="mb-2 rounded-lg max-h-32 object-cover" />}
                                            <div className="prose prose-invert max-w-none text-sm break-words">
                                                <Suspense fallback={<div className="flex items-center gap-2 text-xs text-text-muted"><Loader2 className="animate-spin" size={12} /> formatting...</div>}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                                </Suspense>
                                            </div>
                                            {msg.link && <Link to={msg.link} className="inline-flex items-center gap-1 text-primary hover:underline mt-2 text-xs font-semibold">{msg.linkText} ↗</Link>}
                                        </div>
                                    </div>
                                ))}
                                {isThinking && <div className="flex gap-2"> <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"> <Bot size={14} className="text-white" /> </div> <div className="bg-surface border border-border p-3 rounded-2xl"> <Loader2 size={16} className="animate-spin text-primary" /> </div> </div>}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 border-t border-border">
                                {selectedImage && (
                                    <div className="flex items-center gap-2 p-2 bg-text-main/5 rounded-lg mb-2">
                                        <ImageIcon size={16} className="text-primary" />
                                        <span className="text-xs text-text-muted truncate flex-1">Image selected</span>
                                        <button onClick={() => setSelectedImage(null)} className="text-text-muted hover:text-red-500"> <X size={14} /> </button>
                                    </div>
                                )}
                                <form onSubmit={handleSend} className="flex items-center gap-2">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-text-muted hover:text-primary transition-colors"> <Paperclip size={20} /> </button>
                                    <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Exa is listening..." : "Ask Exa..."} className="flex-1 bg-black/20 border border-border rounded-xl py-3 px-4 text-sm text-text-main focus:outline-none focus:border-primary" />
                                    <button type="submit" disabled={!input.trim() && !selectedImage || isThinking} className="p-3 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"> <Send size={18} /> </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                                </form>
                            </div>
                        </div>
                    )}

                    {isCallMode && (
                        <div className={`fixed inset-0 z-[150] bg-surface/90 backdrop-blur-3xl flex flex-col items-center justify-center transition-all duration-300 pointer-events-auto ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                            <button onClick={handleMinimize} className="absolute top-6 right-6 p-4 rounded-full bg-black/20 text-white/70 hover:text-white transition-all z-[152]"> <Minimize2 size={24} /> </button>
                            <div className="flex flex-col items-center gap-12 pointer-events-none">
                                <div className="relative">
                                    <div className={`absolute inset-0 bg-primary/30 blur-3xl rounded-full transition-all ${isSpeaking ? 'scale-150' : 'scale-100'} ${isHolding ? 'bg-red-500/30' : ''}`} />
                                    <div className={`w-80 h-80 relative z-10 pointer-events-auto transition-transform ${isSpeaking ? 'scale-105' : 'scale-100'}`}
                                        onMouseDown={handlePushToTalkStart} onMouseUp={handlePushToTalkEnd} onMouseLeave={handlePushToTalkEnd}
                                        onTouchStart={handlePushToTalkStart} onTouchEnd={handlePushToTalkEnd}
                                    >
                                        <div className="w-full h-full relative overflow-visible">
                                            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/50">Loading 3D...</div>}>
                                                <AvatarCanvas emotion={emotion} />
                                            </Suspense>

                                            {/* Fallback Image / Overlay if 3D is problematic or just as a base */}
                                            {/* <img src={getAvatarUrl(emotion)} className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none mix-blend-overlay" /> */}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-0 flex flex-col gap-1">
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Exa AI</h2>
                                    <div className="h-5 flex items-center justify-center">
                                        <span className={`text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${((isListening || isHolding || isCallMode) && !isSpeaking && !isThinking) || isSpeaking || isThinking ? 'text-primary' : 'text-white/40'}`}>
                                            {(isSpeaking) ? 'Exa is speaking...' : (isThinking ? 'Exa is thinking...' : ((isListening || isHolding || isCallMode) ? 'Exa is listening...' : 'Hold to Speak'))}
                                        </span>
                                    </div>
                                    <p className="text-[9px] uppercase tracking-[0.3em] text-white/10 font-medium">Ongoing Call • {isMicMuted ? 'Muted' : 'Active'}</p>
                                </div>
                                <div className="flex items-center gap-8 pointer-events-auto mt-2 px-10">
                                    <button onClick={() => setIsMicMuted(!isMicMuted)} className={`p-5 rounded-full transition-all border border-white/10 backdrop-blur-md ${isMicMuted ? 'bg-white text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}> {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />} </button>
                                    <button onClick={handleHangUp} className={`p-7 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-all hover:scale-110 border border-white/20 shadow-xl`}> <PhoneOff size={28} /> </button>
                                    <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="p-5 rounded-full bg-white/5 text-white border border-white/10 backdrop-blur-md hover:bg-white/10"> <VolumeX size={24} /> </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

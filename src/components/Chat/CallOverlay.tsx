import React from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, MicOff, Mic, Volume2, VolumeX, Minimize2, ChevronUp, ChevronDown, Plus, Minus } from 'lucide-react';
import { FurinaAvatar } from './FurinaAvatar';
import { useState } from 'react';

interface CallOverlayProps {
    isSpeaking: boolean;
    isThinking: boolean;
    isMuted: boolean;
    setIsMuted: (val: boolean) => void;
    onEndCall: () => void;
    onMinimize: () => void;
    isMicMuted: boolean;
    setIsMicMuted: (val: boolean) => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
    isSpeaking,
    isThinking,
    isMuted,
    setIsMuted,
    onEndCall,
    onMinimize,
    isMicMuted,
    setIsMicMuted
}) => {
    const [zoom, setZoom] = useState(1);
    const [tilt, setTilt] = useState(1);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleTiltUp = () => setTilt(prev => Math.min(prev + 0.1, 2));
    const handleTiltDown = () => setTilt(prev => Math.max(prev - 0.1, 0.5));

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0d0f14] flex flex-col items-center justify-between pt-6 pb-10 px-6 overflow-hidden"
        >
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-radial from-indigo-500/10 via-transparent to-transparent opacity-50 blur-3xl animate-pulse" />
            </div>

            {/* Top Bar */}
            <div className="w-full flex justify-between items-center z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                         <h2 className="text-2xl font-black text-white tracking-widest uppercase">Exa <span className="text-indigo-500">AI</span></h2>
                         <div className="px-2 py-0.5 bg-indigo-500/20 rounded border border-indigo-500/20 text-[10px] font-bold text-indigo-400">SECURE</div>
                    </div>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mt-1">Connecting secure study session</p>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onMinimize}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all border border-white/5"
                >
                    <Minimize2 size={24} />
                </motion.button>
            </div>

            {/* Central 3D Avatar Area */}
            <div className="relative flex-1 w-full max-h-[42vh] flex items-center justify-center z-10 mb-2">
                <div className="relative w-full aspect-square max-w-[320px] flex items-center justify-center">
                    {/* Glowing Rings */}
                    <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-[ping_4s_linear_infinite]" />
                    <div className="absolute inset-10 rounded-full border border-indigo-500/5 animate-[ping_6s_linear_infinite_1s]" />
                    
                    {/* Circle Frame for 3D */}
                    <div className="w-full h-full rounded-full border-2 border-white/10 bg-[#0d0f14]/50 backdrop-blur-3xl overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.1)] relative">
                         <FurinaAvatar zoom={zoom} tilt={tilt} />
                         
                         {/* Avatar State Overlay */}
                         {isSpeaking && (
                             <div className="absolute inset-0 pointer-events-none border-[12px] border-indigo-500/10 animate-pulse rounded-full" />
                         )}
                    </div>
                </div>
            </div>

            {/* Status Information & Camera Controls */}
            <div className="flex flex-col items-center gap-2 z-10 w-full mb-4">
                {/* Camera Control Buttons */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/5 rounded-full border border-white/10 p-1">
                        <button 
                            onClick={handleTiltUp}
                            className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                        >
                            <ChevronUp size={16} />
                        </button>
                        <button 
                            onClick={handleTiltDown}
                            className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>

                    <div className="flex items-center bg-white/5 rounded-full border border-white/10 p-1">
                        <button 
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                        >
                            <Plus size={16} />
                        </button>
                        <button 
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                        >
                            <Minus size={16} />
                        </button>
                    </div>
                </div>

                <div className="h-8 flex items-center justify-center">
                    <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]"
                    >
                        {isThinking ? "Exa is thinking..." : "Exa is listening"}
                    </motion.span>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-md grid grid-cols-3 gap-4 items-center z-10">
                <div className="flex justify-center">
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsMicMuted(!isMicMuted)}
                        className={`p-4 rounded-full transition-all border ${isMicMuted ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                    >
                        {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </motion.button>
                </div>

                <div className="flex justify-center">
                    <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onEndCall}
                        className="p-6 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-2xl shadow-red-500/40 relative group"
                    >
                        <PhoneOff size={28} />
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 group-hover:opacity-0" />
                    </motion.button>
                </div>

                <div className="flex justify-center">
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-4 rounded-full transition-all border ${isMuted ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                    >
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
